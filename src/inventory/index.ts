
import path from "path";
import { fetchWithRetry, saveCsv } from "../utilities";


interface ResourceResponse {
    totalResults: number;
    items: any[];
}

export async function generateAllOnHandInventoryOfAllResourcesCSV(
    clientId: string,
    clientSecret: string,
    instanceUrl: string
): Promise<void> {

    let offset = 0;
    const limit = 100;

    const allUsers: any[] = [];
    let token = "";

    console.log("🚀 Starting all Resources Inventories export...");
    console.log("--------------------------------------------------");


    while (true) {
        const usersUrl = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/resources/?offset=${offset}&limit=${limit}`;
        console.log(`➡️ Fetching users offset=${offset}`);

        const res = await fetchWithRetry(usersUrl, clientId, clientSecret, instanceUrl, token);
        token = res.token;

        const data = res.data as ResourceResponse;

        if (!data?.items?.length) {
            console.warn("⚠ No user items returned. Breaking.");
            break;
        }

        allUsers.push(...data.items);

        console.log(`   ✔ Received ${data.items.length} resources (Total: ${allUsers.length})`);

        if (offset + limit >= data.totalResults) break;
        offset += limit;

    }

    console.log("--------------------------------------------------");
    console.log(`🧩 Total resources to process: ${allUsers.length}`);
    console.log("--------------------------------------------------");


    // 2. Fetch on hand inventories for each resource

    const rows: any[] = [];

    for (const [index, user] of allUsers.entries()) {
        console.log(`${index} 👤 Fetching Inventories for ${user.resourceId}`);

        if (user.status !== "active") {
            console.log(`   ⚠ Skipping inactive resource ${user.resourceId}`);
            continue;
        }

        offset = 0;
        while (true) {
            const invUrl = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/resources/${encodeURIComponent(user.resourceId)}/inventories/?offset=${offset}&limit=${limit}`;
            try {

                const res = await fetchWithRetry(invUrl, clientId, clientSecret, instanceUrl, token);

                token = res.token;

                const itemsData = res.data as ResourceResponse;
                const items = itemsData?.items ?? [];

                if (!items || items.length === 0) {
                    console.log(`   ⚠ No Inventories found for ${user.resourceId}`);
                    break;
                }

                for (const inv of items) {
                    delete inv.links;
                    delete inv.status;
                    rows.push({ resourceName: user.name, resourceType: user.resourceType, resourceTimeZone: user.timeZoneIANA, ...inv, });
                }

                console.log(`   ✔ Found ${items.length} Inventories`);

                if (offset + limit >= itemsData.totalResults) break;

                offset += limit;

            } catch (err) {
                console.error(`❌ Error fetching Inventories for ${user.resourceId}:`, err);
                console.log(`   ⚠ Skipping invUrl ${invUrl}`);
            }



        }
    }

    console.log("--------------------------------------------------");
    console.log(`📦 Total rows: ${rows.length}`);
    console.log("--------------------------------------------------");
    const ts = Math.floor(Date.now() / 1000);
    const filename = `All_Resources_Inventories_${ts}.csv`;
    const fullPath = path.resolve(filename);
    saveCsv(rows, filename);
    console.log(`📁 CSV saved: ${fullPath}`);

}

export async function generateAllOnHandInventoryOfAllResources(
    clientId: string,
    clientSecret: string,
    instanceUrl: string
): Promise<{ data: any[]; props: string[] }> {

    let offset = 0;
    const limit = 100;

    const allResources: any[] = [];
    let token = "";

    console.log("🚀 Starting all Resources Inventories export...");
    console.log("--------------------------------------------------");


    while (true) {
        const resourcesUrl = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/resources/?offset=${offset}&limit=${limit}`;
        console.log(`➡️ Fetching resources offset=${offset}`);

        const res = await fetchWithRetry(resourcesUrl, clientId, clientSecret, instanceUrl, token);
        token = res.token;

        const data = res.data as ResourceResponse;

        if (!data?.items?.length) {
            console.warn("⚠ No resource items returned. Breaking.");
            break;
        }

        allResources.push(...data.items);

        console.log(`   ✔ Received ${data.items.length} resources (Total: ${allResources.length})`);

        if (offset + limit >= data.totalResults) break;
        offset += limit;

    }

    console.log("--------------------------------------------------");
    console.log(`Total resources to process: ${allResources.length}`);
    console.log("--------------------------------------------------");


    // 2. Fetch on hand inventories for each resource

    const rows: any[] = [];

    for (const [index, resource] of allResources.entries()) {
        console.log(`${index} 👤 Fetching Inventories for ${resource.resourceId}`);

        if (resource.status !== "active") {
            console.log(`   ⚠ Skipping inactive resource ${resource.resourceId}`);
            continue;
        }

        offset = 0;
        while (true) {
            const invUrl = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/resources/${encodeURIComponent(resource.resourceId)}/inventories/?offset=${offset}&limit=${limit}`;
            try {

                const res = await fetchWithRetry(invUrl, clientId, clientSecret, instanceUrl, token);

                token = res.token;

                const itemsData = res.data as ResourceResponse;
                const items = itemsData?.items ?? [];

                if (!items || items.length === 0) {
                    console.log(`   ⚠ No Inventories found for ${resource.resourceId}`);
                    break;
                }

                for (const inv of items) {
                    delete inv.links;
                    delete inv.status;
                    rows.push({ resourceName: resource.name, resourceType: resource.resourceType, resourceTimeZone: resource.timeZoneIANA, ...inv, });
                }

                console.log(`   ✔ Found ${items.length} Inventories`);

                if (offset + limit >= itemsData.totalResults) break;

                offset += limit;

            } catch (err) {
                console.error(`❌ Error fetching Inventories for ${resource.resourceId}:`, err);
                console.log(`   ⚠ Skipping invUrl ${invUrl}`);
            }



        }
    }

    console.log("--------------------------------------------------");
    console.log(`Total rows: ${rows.length}`);
    console.log("--------------------------------------------------");

    const props = [...rows.reduce<Set<string>>((set, row) => {
        if (row && typeof row === "object") {
            Object.keys(row).forEach((key) => set.add(key));
        }
        return set;
    }, new Set<string>())];

    return {
        data: rows,
        props,
    };

}

