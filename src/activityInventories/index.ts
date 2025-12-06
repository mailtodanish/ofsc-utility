import { getOAuthToken } from "../oauthTokenService";
import { fetchWithRetry } from "../utilities";

/**
 * Fetches all customer inventories related to the given activity.
 *
 * @param {string} clientId - The OFSC client ID.
 * @param {string} clientSecret - The OFSC client secret.
 * @param {string} instanceUrl - The OFSC instance URL.
 * @param {string} activityId - The ID of the activity to fetch customer inventories for.
 *
 * @returns {Promise<any[]>} A promise which resolves to an array of customer inventory objects.
 */
export async function getActivityCustomerInventories(
    clientId: string,
    clientSecret: string,
    instanceUrl: string,
    activityId: string
): Promise<any[]> {

    const limit = 100;
    let offset = 0;
    let token = await getOAuthToken(clientId, clientSecret, instanceUrl);

    const allItems: any[] = [];   

    const  fetchCustomerInventories = async (offset: number) => {
        const params = new URLSearchParams({
            offset: offset.toString(),
            limit: limit.toString()
        });

        const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/activities/${activityId}/customerInventories?${params}`;

        console.log(`➡️ Fetching offset=${offset}, limit=${limit}`);

        const response = await fetchWithRetry(url, clientId, clientSecret, instanceUrl, token);

        token = response.token;
        const data = response.data;

        if (!data.items || data.items.length === 0) {
            // console.log("✔ No more items found. Stopping pagination.");
            return;
        }

        allItems.push(...data.items);
        console.log(`   ✔ Received ${data.items.length} items (Total: ${allItems.length}) for activity ${activityId}`);
        
        await fetchCustomerInventories(offset + limit);
    };

    await fetchCustomerInventories(offset);

    return allItems;
}

/**
 * Creates a new customer inventory related to the given activity.
 *
 * @param {string} clientId - The OFSC client ID.
 * @param {string} clientSecret - The OFSC client secret.
 * @param {string} instanceUrl - The OFSC instance URL.
 * @param {string} activityId - The ID of the activity to create a customer inventory for.
 * @param {object} payload - The customer inventory payload.
 *
 * @returns {Promise<object>} A promise which resolves to the created customer inventory object.
 */
export async function createActivityCustomerInventories(
    clientId: string,
    clientSecret: string,
    instanceUrl: string,
    activityId: string,
    payload: {}
): Promise<{}> {

    const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/activities/${activityId}/customerInventories`;

    const token = await getOAuthToken(clientId, clientSecret, instanceUrl);

    const res = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        throw new Error(`❌ POST failed: ${res.status} ${res.statusText}`);
    }

    return await res.json() as {};
}