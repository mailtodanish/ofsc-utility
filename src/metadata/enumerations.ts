import { fetchWithRetry } from "../utilities";

type SheetData = Record<string, any[]>;

/**
 * Fetch enumeration metadata for a specific property label.
 *
 * This helper will page through the OFSC metadata API until all enumeration
 * values are retrieved for the requested property label.
 *
 * @param clientId - OFSC client ID
 * @param clientSecret - OFSC client secret
 * @param instanceUrl - OFSC instance host portion
 * @param label - property label used to fetch enumeration values
 * @param allUsedPropes - collection of properties used in other metadata sheets
 * @param token - optional existing OAuth token
 * @returns array of enumeration rows for the property
 */
export async function getPropertiesDropDownMetaData(
    clientId: string,
    clientSecret: string,
    instanceUrl: string,
    label: string,
    allUsedPropes: any[],
    token: string = ""
): Promise<any[]> {
    let responsedata: any[] = [];
    let offset = 0;
    const limit = 100;

    // Continue paging until the API indicates there are no more items.
    while (true) {
        const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscMetadata/v1/properties/${label}/enumerationList?offset=${offset}&limit=${limit}`;

        const res = await fetchWithRetry(
            url,
            clientId,
            clientSecret,
            instanceUrl,
            token
        );

        // Keep the latest token for subsequent requests.
        token = res.token;

        responsedata = [...responsedata, ...res.data.items];

        if (!res.data.hasMore) break;

        offset = res.data.offset + limit;
    }

    return transformData(responsedata, allUsedPropes, label);
}

/**
 * Transform raw enumeration items into the final sheet row format.
 *
 * The output is a simple array of enumeration rows, and each row includes the
 * property label, enumeration label, active flag, and translated name.
 *
 * @param data - raw enumeration items returned by the API
 * @param allUsedPropes - collection of properties used elsewhere, used for comments
 * @param label - parent property label for this enumeration list
 * @returns transformed enumeration rows
 */
export async function transformData(
    data: any[],
    allUsedPropes: any[],
    label: string
): Promise<any[]> {
    const overview = data.map(d => {
        // Find all matching comments from the shared property usage data.
        const comments = [
            ...new Set(
                allUsedPropes
                    .filter((p: any) => p.label === d.label)
                    .map((p: any) => p.comment)
                    .filter(Boolean)
            )
        ].join(', ');

        return {
            propertyLabel: label,
            Label: d.label,
            active: d.active,
            name: d.translations?.[0]?.name || '',
            comments
        };
    });

    return overview;
}
