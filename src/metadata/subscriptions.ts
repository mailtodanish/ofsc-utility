import { fetchWithRetry } from "../utilities";
type SheetData = Record<string, any[]>;

export async function getSubscriptionsMetaData(
    clientId: string, clientSecret: string, instanceUrl: string, token: string = ""
): Promise<SheetData> {


    let responsedata: any[] = [];
    let offset = 0;
    const limit = 100;


    while (true) {
        const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/events/subscriptions`;

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
        "subscriptionId": d.subscriptionId,
        "subscriptionConfig": JSON.stringify(d.subscriptionConfig),
        "applicationId":d.applicationId
       
    }));

    sheets['Subscription Config'] = overview;
    return sheets;
}