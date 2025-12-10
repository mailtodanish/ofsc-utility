
import path from "path";
import { fetchWithRetry, saveCsv } from "../utilities";
interface UserItem {
    login: string;
    [key: string]: any;
}

interface GroupItem {
    name: string;
    type: string;
    description?: string;
    status?: string;
}

interface ResourceResponse {
    totalResults: number;
    items: any[];
}

export async function generateUsersCollaborationCSV(
    clientId: string,
    clientSecret: string,
    instanceUrl: string
): Promise<void> {

    let offset = 0;
    const limit = 100;

    const allUsers: UserItem[] = [];
    let token = "";

    console.log("🚀 Starting Users Collaboration Groups export...");
    console.log("--------------------------------------------------");


    while (true) {
        const usersUrl = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/users/?offset=${offset}&limit=${limit}`;
        console.log(`➡️ Fetching users offset=${offset}`);

        const res = await fetchWithRetry(usersUrl, clientId, clientSecret, instanceUrl, token);
        token = res.token;

        const data = res.data as ResourceResponse;

        if (!data?.items?.length) {
            console.warn("⚠ No user items returned. Breaking.");
            break;
        }

        allUsers.push(...data.items);

        console.log(`   ✔ Received ${data.items.length} users (Total: ${allUsers.length})`);

        if (offset + limit >= data.totalResults) break;
        offset += limit;
    }

    console.log("--------------------------------------------------");
    console.log(`🧩 Total users to process: ${allUsers.length}`);
    console.log("--------------------------------------------------");

 
    // 2. Fetch collaboration groups for each user
   
    const rows: Array<GroupItem & { login: string }> = [];

    for (const user of allUsers) {
        console.log(`👤 Fetching groups for ${user.login}`);

        if(user.status !== "active") {
            console.log(`   ⚠ Skipping inactive user ${user.login}`);
            continue;
        }

        try {
            const groupUrl = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/users/${user.login}/collaborationGroups`;
            const res = await fetchWithRetry(groupUrl, clientId, clientSecret, instanceUrl, token);

            token = res.token;

            const groupData = res.data as ResourceResponse;
            const groups = groupData?.items ?? [];

            if (groups.length === 0) {
                console.log(`   ⚠ No groups found for ${user.login}`);
                continue;
            }

            for (const group of groups) {
                rows.push({ ...group, login: user.login, userType: user.userType,timeZoneIANA: user.timeZoneIANA,userName: user.name });
            }

            console.log(`   ✔ Found ${groups.length} groups`);

        } catch (err) {
            console.error(`❌ Error fetching groups for ${user.login}:`, err);
        }
    }

    console.log("--------------------------------------------------");
    console.log(`📦 Total rows: ${rows.length}`);
    console.log("--------------------------------------------------");
    const ts = Math.floor(Date.now() / 1000);
    const filename = `collaborationGroups_${ts}.csv`;
    const fullPath = path.resolve(filename);
    saveCsv(rows, filename);
    console.log(`📁 CSV saved: ${fullPath}`);

}

