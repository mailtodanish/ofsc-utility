import { fetchWithRetry } from "../utilities";
type SheetData = Record<string, any[]>;
export async function getInventoryTypesMetaData(
    clientId: string, clientSecret: string, instanceUrl: string, token: string = ""
): Promise<SheetData> {


    let responsedata: any[] = [];
    let offset = 0;
    const limit = 100;


    while (true) {
        const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscMetadata/v1/inventoryTypes?offset=${offset}&limit=${limit}`;

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



export function transformData(data: any[]): any {
    const sheets: SheetData = {};

    // Sheet 1: Activity Type Groups Overview
    const overview = data.map(d => ({
        "Label": d.label,
        "Inv Name": d.name,
        "Unit Of Measurement": d.unitOfMeasurement,
        "Status": d.active ? "Active" : "Inactive",
        "NonSerialized": d.nonSerialized ? "NonSerialized" : "Serialized",
        "Model Property": d.modelProperty,
        "Quantity Precision": d.quantityPrecision,
    }));

    const props = overview.reduce((acc: any[], curr: any) => {
         acc.push({
            label: curr["Model Property"],
            comment:"It is being used in Inventory Type"
        });
        return acc;
    },[]);

   
    return {
        data: {'Inventory Type Overview':overview},
        props
    };


}