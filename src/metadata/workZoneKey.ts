import { fetchWithRetry } from "../utilities";
type SheetData = any;
export async function getWorkZoneKeyMetaData(
    clientId: string, clientSecret: string, instanceUrl: string, token: string = ""
): Promise<any> {


    let responsedata: any[] = [];
    let offset = 0;
    const limit = 100;


    while (true) {
        const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscMetadata/v1/workZoneKey?offset=${offset}&limit=${limit}`;

        const res = await fetchWithRetry(
            url,
            clientId,
            clientSecret,
            instanceUrl,
            token
        );

        token = res.token;

        responsedata = [...responsedata, ...res.data.current];


        if (!res.data.hasMore) break;

        offset = res.data.offset + limit;
    }
    const sheet = transformData(responsedata);
    return sheet;

}



export function transformData(data: any[]): SheetData {
    const sheets: SheetData = {};
    
    // Sheet 1: workZoneKey Overview
    const overview = data.map(d => ({
        "Label": d.label,
        "Length": d.length,
        "Function": d.function,
        "Order": d.order,
        "Api Parameter Name": d.apiParameterName
    }));

    const props = overview.reduce((acc: any[], curr: any) => {
         acc.push({
            label: curr["Api Parameter Name"],
            comment:"It is being used in work zone key"
        });
        return acc;
    },[]);

   
    return {
        data: {'Work Zone Key':overview},
        props
    };;
}