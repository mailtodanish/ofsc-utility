import * as XLSX from 'xlsx-js-style';
import { DOMParser } from "xmldom";
import { getOAuthToken } from "../oauthTokenService";
/**
 * Fetches a URL with retry logic for expired tokens.
 *
 * @param {string} url - The URL to fetch.
 * @param {string} clientId - The OFSC client ID.
 * @param {string} clientSecret - The OFSC client secret.
 * @param {string} instanceUrl - The OFSC instance URL.
 * @param {string} token - The current OAuth token.
 *
 * @returns {Promise<{ data: any; token: string }>} A promise which resolves to an object containing the parsed JSON data and the latest OAuth token.
 */
export const fetchWithRetry = async (
    url: string,
    clientId: string,
    clientSecret: string,
    instanceUrl: string,
    token: string,
    retries: number = 5,
    baseDelay: number = 500
): Promise<{ data: any; token: string }> => {

    const doFetch = async (bearer: string) => {
        return fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${bearer}`,
                Accept: "application/json"
            }
        });
    };
    console.log(`➡️ Fetching ${url}`);
    // Try with the current token
    let res = await doFetch(token);

    /* ---------- 401: refresh token ONCE per call ---------- */
    if (res.status === 401) {
        console.warn("⚠️ Token expired — renewing token…");
        token = await getOAuthToken(clientId, clientSecret, instanceUrl);

        res = await doFetch(token);
    }

    /* ---------- 429: retry with backoff ---------- */
    if (res.status === 429 && retries > 0) {
        const retryAfter = res.headers.get("Retry-After");
        console.log("⚠️ 429 received. Retrying...", retryAfter);
        const delay = retryAfter ? Number(retryAfter) * 1000 : baseDelay;
        console.warn(`⚠️ 429 received. Retrying in ${delay}ms... (${retries} left)`);

        await new Promise(r => setTimeout(r, delay));

        return fetchWithRetry(
            url,
            clientId,
            clientSecret,
            instanceUrl,
            token,
            retries - 1,
            baseDelay * 2
        );
    }

    // If still not OK → fail
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`❌ Request failed: ${res.status} ${res.statusText}\n${body}`);
    }

    // Return parsed JSON + latest token
    return {
        data: await res.json(),
        token
    };
};

import fs from "fs";
import path from "path";

export function saveCsv<T extends Record<string, any>>(
    rows: T[],
    filePath: string
): void {
    if (!rows || rows.length === 0) {
        throw new Error("CSV creation failed: no rows provided.");
    }

    // Extract headers from the first row
    const headers = Object.keys(rows[0]);

    // Build CSV content
    const csvLines = [
        headers.join(","), // header row
        ...rows.map(row =>
            headers.map(h => escapeCsvValue(row[h])).join(",")
        )
    ];

    const csvContent = csvLines.join("\n");

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(filePath, csvContent);

    console.log(`CSV saved: ${filePath}`);
}

// Escape CSV fields
function escapeCsvValue(value: any): string {
    if (value == null) return "";
    if (typeof value === "object") {
        value = JSON.stringify(value);
    }
    const str = String(value);

    // Wrap in quotes if needed
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
}

export function xmlNodeToObjects(
    xmlString: string,
    parentNodeName: string
): Record<string, string>[] {

    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlString, "application/xml");

    const nodes = Array.from(xml.getElementsByTagName(parentNodeName));

    if (nodes.length === 0) {
        throw new Error(`No <${parentNodeName}> nodes found`);
    }

    return nodes.map(node => {
        const obj: Record<string, string> = {};

        const fields = Array.from(node.getElementsByTagName("Field"));

        for (const field of fields) {
            const key = field.getAttribute("name");
            if (!key) continue;

            obj[key] = field.textContent?.trim() ?? "";
        }

        return obj;
    });
}


type SheetRow = Record<string, unknown>;
type SheetsData = Record<string, SheetRow[]>;

export function createExcelFile(
  sheetsData: SheetsData,
  filename: string = 'file.xlsx'
): void {
  const workbook = XLSX.utils.book_new();

  /* ============================
      Create INDEX sheet first
     ============================ */
  const indexData = Object.keys(sheetsData).map(sheetName => ({
    "OFSC Master Configuration Sheet": sheetName
  }));

  const indexSheet = XLSX.utils.json_to_sheet(indexData);

  // Style INDEX header
  const indexHeaderCell = indexSheet['A1'];
  if (indexHeaderCell) {
    indexHeaderCell.s = {
      fill: { fgColor: { rgb: 'FFD9D9D9' } },
      font: { bold: true, size: 18 },
      alignment: { horizontal: 'center' }
    };
  }

  // Add hyperlinks
  indexData.forEach((_, i) => {
    const row = i + 2; // data starts after header
    const cellAddress = `A${row}`;
    const cell = indexSheet[cellAddress];

    if (cell) {
      cell.l = {
        Target: `#'${cell.v}'!A1`,
        Tooltip: `Go to ${cell.v}`
      };
      cell.s = {
        font: {
          color: { rgb: 'FF0563C1' }, // Excel hyperlink blue
          underline: true
        }
      };
    }
  });

  indexSheet['!cols'] = [{ wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, indexSheet, 'INDEX');

  /* ============================
      Create data sheets
     ============================ */
  Object.entries(sheetsData).forEach(([sheetName, data]) => {
    const worksheet = XLSX.utils.json_to_sheet(data);

    if (data.length > 0) {
      const keys = Object.keys(data[0]);

      // Auto-size columns
      worksheet['!cols'] = keys.map(key => {
        const maxLength = Math.max(
          key.length,
          ...data.map(row => String(row[key] ?? '').length)
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });

      // Highlight header row
      keys.forEach((_, colIndex) => {
        const addr = XLSX.utils.encode_cell({ r: 0, c: colIndex });
        const cell = worksheet[addr];
        if (!cell) return;

        cell.s = {
          fill: { fgColor: { rgb: 'FFD9D9D9' } },
          font: { bold: false, sz: 14, },
          alignment: { horizontal: 'center' }
        };
      });

      // Process data rows
      data.forEach((row, rowIndex) => {
        const rowIsInactive =
          row.Status === 'Inactive' ||
          JSON.stringify(row).toUpperCase().includes('INACTIVE') || JSON.stringify(row).toUpperCase().includes('INACTIVATE');

        keys.forEach((key, colIndex) => {
          const addr = XLSX.utils.encode_cell({
            r: rowIndex + 1,
            c: colIndex
          });

          const cell = worksheet[addr];
          if (!cell) return;

          const value = String(row[key] ?? '').toLowerCase();
          cell.s = cell.s || {};

          // "read write" highlight
          if (value.includes('read write')) {
            cell.s.font = {
              ...(cell.s.font || {}),
              bold: true,
              color: { rgb: 'FFCC0000' }
            };
          }

          if (value.includes('nonserialized')) {
            cell.s.font = {
              ...(cell.s.font || {}),
              bold: true,
              color: { rgb: 'FF006100' }
            };
          }

          if (value.includes('it is being used')) {
            cell.s.font = {
              ...(cell.s.font || {}),
              bold: true,
              color: { rgb: 'FF006100' }
            };
          }

          if (value.includes('on-call')) {
            cell.s.font = {
              ...(cell.s.font || {}),
              bold: true,
              color: { rgb: 'FF0563C1' }
            };
          }

          // Inactive row highlight
          if (rowIsInactive) {
            cell.s.fill = { fgColor: { rgb: 'FFFFCCCC' } };
            cell.s.font = {
              ...(cell.s.font || {}),
              color: { rgb: 'FFCC0000' }
            };
          }
        });
      });
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  XLSX.writeFile(workbook, filename);
  console.log(`✓ Excel file created: ${filename}`);
}