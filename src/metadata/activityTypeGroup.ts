import { fetchWithRetry } from "../utilities";
type SheetData = Record<string, any[]>;
export async function getActivityTypesGroupsMetaData(
  clientId: string, clientSecret: string, instanceUrl: string, token: string = ""
): Promise<SheetData> {


  let responsedata: any[] = [];
  let offset = 0;
  const limit = 100;


  while (true) {
    const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscMetadata/v1/activityTypeGroups?offset=${offset}&limit=${limit}`;

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
    Label: d.label,
    Name: d.name
  }));

  sheets['Activity Type Groups Overview'] = overview;

  // Sheet 2: Activity Type Groups Activities
  const activityTypes: any[] = [];

  data.forEach(d => {
    if (!Array.isArray(d.activityTypes)) return;
   
    d.activityTypes.forEach((ts: any) => {
      activityTypes.push({
        "Activity Group Label": d.label,
        "Activity Group Label Name": d.name,
        'Activity Type': ts.label
      });
    });
  });
  
  sheets['Activity Type Groups Activities'] = activityTypes;

  return sheets;
}