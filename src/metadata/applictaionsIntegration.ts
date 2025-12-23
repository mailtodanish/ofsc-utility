import { fetchWithRetry } from "../utilities";
type SheetData = Record<string, any[]>;
export async function getApplictaionsIntegrationsDetailMetaData(
    clientId: string, clientSecret: string, instanceUrl: string, token: string = ""
): Promise<SheetData> {


    let responsedata: any[] = [];
    let offset = 0;
    const limit = 100;


    while (true) {
        const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscMetadata/v1/applications?offset=${offset}&limit=${limit}`;

        const res = await fetchWithRetry(
            url,
            clientId,
            clientSecret,
            instanceUrl,
            token
        );

        token = res.token;

        responsedata = [...responsedata, ...res.data.items];


        if (!res.data.items.hasMore) break;

        offset = res.data.items.offset + limit;
    }
    const sheet = transformData(responsedata);
    const accessData = await getApplictaionsAccessMetaData(clientId, clientSecret, instanceUrl, responsedata, token);
    sheet['ApplictaonsAccessDetail'] = accessData;

    return sheet;

}



export function transformData(data: any[]): SheetData {
    const sheets: SheetData = {};

    // Sheet 1: Activity Type Groups Overview
    const overview = data.map(d => ({
        "Name": d.name,
        "Label": d.label,
        "Status": d.status,
        "Token Service": d.tokenService
    }));

    sheets['ApplictaonsUsedByIntegrations'] = overview;

    return sheets;
}


export async function getApplictaionsIntegrationsAPIAccessDetailMetaData(
    clientId: string, clientSecret: string, instanceUrl: string, label: string, token: string = ""
): Promise<any[]> {


    let responsedata: any[] = [];
    let offset = 0;
    const limit = 100;


    while (true) {
        const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscMetadata/v1/applications/${label}/apiAccess?offset=${offset}&limit=${limit}`;

        const res = await fetchWithRetry(
            url,
            clientId,
            clientSecret,
            instanceUrl,
            token
        );

        token = res.token;

        responsedata = [...responsedata, ...res.data.items];


        if (!res.data.items.hasMore) break;

        offset = res.data.items.offset + limit;
    }

    return responsedata;

}

export async function getApplictaionsIntegrationsAPIAccessEntitiesDetailMetaData(
    clientId: string, clientSecret: string, instanceUrl: string, applictaionLabel: string, accesslabel: string, token: string = ""
): Promise<any[]> {



    const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscMetadata/v1/applications/${applictaionLabel}/apiAccess/${accesslabel}`;

    const res = await fetchWithRetry(
        url,
        clientId,
        clientSecret,
        instanceUrl,
        token
    );

    token = res.token;
    return res.data.apiEntities || [];

}

export async function getApplictaionsAccessMetaData(
    clientId: string, clientSecret: string, instanceUrl: string, appData: any[], token: string = ""
) {
    const data: any[] = [];
    for (const app of appData) {
        const applictaionlabel = app.label;
        const apiAccess = await getApplictaionsIntegrationsAPIAccessDetailMetaData(clientId, clientSecret, instanceUrl, applictaionlabel, token);
        for (const access of apiAccess) {

            let accesslabel = access.label;
            let accessStatus = access.status;

            if (accessStatus == "active") {
                // call access detail API
                let response = await getApplictaionsIntegrationsAPIAccessEntitiesDetailMetaData(clientId, clientSecret, instanceUrl, applictaionlabel, accesslabel, token);
                response.map(d =>
                    data.push({
                        "Applictaion Name": applictaionlabel,
                        "ApiAccess": accesslabel,
                        "Label": d.label.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, (c:any) => c.toUpperCase()),
                        "Access": d.access.replace(/([a-z])([A-Z])/g, '$1 $2')
                    })
                )

            }
        }
    }

    return data;
}