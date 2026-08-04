import { fetchWithRetry } from "../utilities";
import { getPropertiesDropDownMetaData } from "./enumerations";
type SheetData = Record<string, any[]>;
export async function getPropertiesMetaData(
    clientId: string, clientSecret: string, instanceUrl: string, allUsedPropes: any[], token: string = ""
): Promise<SheetData> {


    let responsedata: any[] = [];
    let offset = 0;
    const limit = 100;


    while (true) {
        const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscMetadata/v1/properties?offset=${offset}&limit=${limit}`;

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
    const sheet = transformData(responsedata, allUsedPropes, clientId, clientSecret, instanceUrl, token);
    return sheet;

}



export async function transformData(data: any[], allUsedPropes: any[], clientId: string, clientSecret: string, instanceUrl: string, token: string): Promise<SheetData> {
    const sheets: SheetData = {};

    // Sheet 1: Activity Type Groups Overview
    const overview = data.map(d => {
        const comments = [
            ...new Set(
                allUsedPropes
                    .filter((p: any) => p.label === d.label)
                    .map((p: any) => p.comment)
                    .filter(Boolean) // remove null / undefined
            )
        ].join(', ');
        return {
            Label: d.label,
            Name: d.name,
            "Data Type": d.type,
            "Entity": d.entity,
            "GUI": d.gui,
            "Clone Flag": d.cloneFlag,
            "Comments": comments
        }
    });

    sheets['Properties Overview'] = overview;
    const dropDownData: any[] = [];
    const enumerationProps = overview.filter((prop: any) => prop["Data Type"] === 'enumeration');

    console.log(`Found ${enumerationProps.length} enumeration properties to fetch dropdown data for.`);
    for (const prop of enumerationProps) {
        // Process each property
        let enums =
            await getPropertiesDropDownMetaData(
                clientId, clientSecret, instanceUrl, prop.Label, allUsedPropes, token

            );
        dropDownData.push(...enums);

    }
    sheets['Properties Enumerations'] = dropDownData;
    return sheets;
}