import { fetchWithRetry } from "../utilities";
type SheetData = Record<string, any[]>;
export async function getResourceTypesMetaData(
    clientId: string, clientSecret: string, instanceUrl: string, token: string = ""
): Promise<SheetData> {


    let responsedata: any[] = [];
    let offset = 0;
    const limit = 100;


    while (true) {
        const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscMetadata/v1/resourceTypes?offset=${offset}&limit=${limit}`;

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
        // "Label": d.label,
        "Name": d.name,
        "Status": d.active ? "Active" : "Inactive",
        "Applictaion Role": d.role,
    }));

    sheets['Resource Types Overview'] = overview;



    return sheets;
}