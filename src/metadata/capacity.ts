import { fetchWithRetry } from "../utilities";
type SheetData = Record<string, any[]>;
export async function getCapacityMetaData(
    clientId: string, clientSecret: string, instanceUrl: string, token: string = ""
): Promise<SheetData> {


    let responsedata: any[] = [];
    let offset = 0;
    const limit = 100;


    while (true) {
        const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscMetadata/v1/capacityAreas?offset=${offset}&limit=${limit}`;

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
    let capacityData: any[] = [];
    for (let i = 0; i < responsedata.length; i++) {
        const element = responsedata[i];
        const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscMetadata/v1/capacityAreas/${element.label}?offset=0&limit=1000`;
        const res = await fetchWithRetry(
            url,
            clientId,
            clientSecret,
            instanceUrl,
            token
        );
        capacityData.push(res.data);
    }
    const sheet = transformData(capacityData);
    let capacitycategories = await capacitycategoriesOfacapacityArea(clientId, clientSecret, instanceUrl, responsedata, token);
    sheet['CapacityCategoriesForCapacity'] = capacitycategories;
    return sheet;
}



export function transformData(data: any[]): SheetData {
    const sheets: SheetData = {};
    const overview = data.map(d => ({
        "Bucket": d.parentLabel,
        "Capacity Name": d.name,
        "Type": d.type.replace(/\b\w/g, (c: any) => c.toUpperCase()),
        "Status": d.status.replace(/\b\w/g, (c: any) => c.toUpperCase()),

    }));

    sheets['Capacity Overview'] = overview;

    return sheets;
}

async function capacitycategoriesOfacapacityArea(clientId: string, clientSecret: string, instanceUrl: string, capacityAreas: any[], token: string = ""
): Promise<any[]> {
    let data: any[] = [];
    for (let i = 0; i < capacityAreas.length; i++) {

        const capacityArea = capacityAreas[i];
        const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscMetadata/v1/capacityAreas/${capacityArea.label}/capacityCategories`;

        const res = await fetchWithRetry(
            url,
            clientId,
            clientSecret,
            instanceUrl,
            token
        );
        token = res.token;
        for (const category of res.data.items) {
            data.push({
                "capacityArea": capacityArea.label,
                "Capacity Category": category.name,
                "status": category.status === "active" ? "Active" : "Inactive"
            })
        }

    }
    return data;

}