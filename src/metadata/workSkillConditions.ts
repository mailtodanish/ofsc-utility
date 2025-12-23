import { fetchWithRetry } from "../utilities";
type SheetData = Record<string, any[]>;

export async function getWorkSkillsMetaData(
    clientId: string, clientSecret: string, instanceUrl: string, token: string = ""
): Promise<SheetData> {


    let responsedata: any[] = [];
    let offset = 0;
    const limit = 100;


    while (true) {
        const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscMetadata/v1/workSkills?offset=${offset}&limit=${limit}`;

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
    const sheet = transformDataWS(responsedata);
    const WSCSheet = await getWorkSkillConditionsMetaData(clientId, clientSecret, instanceUrl, responsedata, token);

    return {
        // ...sheet,
        ...WSCSheet
    };

}
export async function getWorkSkillConditionsMetaData(
    clientId: string, clientSecret: string, instanceUrl: string, wsData: any[], token: string = ""
): Promise<SheetData> {


    let responsedata: any[] = [];
    let offset = 0;
    const limit = 100;


    while (true) {
        const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscMetadata/v1/workSkillConditions?offset=${offset}&limit=${limit}`;

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
    const sheet = transformData(responsedata, wsData);
    return sheet;

}



export function transformData(data: any[], wsData: any[]): any {
    const sheets: SheetData = {};

    // Sheet 2: Activity Type Groups Activities
    const wsConditions: any[] = [];

    data.forEach(d => {
        if (!Array.isArray(d.conditions)) return;

        d.conditions.forEach((ts: any) => {
            wsConditions.push({
                "Work Skill Name": d.label,
                "Work Skill Status": wsData.find((ws: any) => ws.label === d.label).active ? "Active" : "Inactive",
                "Property": ts.label,
                "Function": ts.function,
                "Value List": JSON.stringify(ts.valueList)
            });
        });
    });

    const props = wsConditions.reduce((acc: any[], curr: any) => {
        acc.push({
            label: curr["Property"],
            comment: "It is being used in Work Skill Condition"
        });
        return acc;
    }, []);

    return {
        data: { 'Work Skills Conditions': wsConditions },
        props
    };;
}

export function transformDataWS(data: any[]): SheetData {
    const sheets: SheetData = {};


    const wsConditions: any[] = [];

    data.forEach(d => {


        wsConditions.push({
            // "label": "ALM",
            "WS Name": d.name,
            "status": d.active ? "Active" : "Inactive",
            "Sharing": d.sharing,
        });
    });

    sheets['Work Skills Overview'] = wsConditions;

    return sheets;
}