import { fetchWithRetry } from "../utilities";
type SheetData = Record<string, any[]>;
export async function getCapacityCategoriesMetaData(
  clientId: string, clientSecret: string, instanceUrl: string, token: string = ""
): Promise<SheetData> {


  let responsedata: any[] = [];
  let offset = 0;
  const limit = 100;


  while (true) {
    const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscMetadata/v1/capacityCategories?offset=${offset}&limit=${limit}`;

    const res = await fetchWithRetry(
      url,
      clientId,
      clientSecret,
      instanceUrl,
      token
    );

    token = res.token;

    responsedata = [...responsedata, ...res.data.items];


    if (!res.data.hasMore) break;

    offset = res.data.offset + limit;
  }
  const sheet = transformData(responsedata);
  return sheet;

}



export function transformData(data: any[]): SheetData {
  const sheets: SheetData = {};

  // Sheet 1: Activity Type Groups Overview
  const overview = data.map(d => ({
    "Capacity Label": d.label,
    "Capacity Name": d.name,
     Status: d.active ? "Active" : "Inactive"
  }));

  sheets['Capacity Category Overview'] = overview;

  // Sheet 2: Activity Type Groups Activities
  const workSkills: any[] = [];

  data.forEach(d => {
    if (!Array.isArray(d.workSkills)) return;
   
    d.workSkills.forEach((v: any) => {
      workSkills.push({
        "Capacity Name": d.name,
        "WorkSkills Label": v.label,
        "workSkills Start Date": v.startDate,
        "workSkills EndDate": v.endDate,
        "workSkills Status": v.endDate ? "Inactive" : "Active"
      });
    });

  });
  sheets['Capacity Category WorkSkills'] = workSkills;
  return sheets;
}