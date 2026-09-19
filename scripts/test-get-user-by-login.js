// npx dotenv -e .env -- node scripts/test-get-user-by-login.js <login>
/*
 * Usage:
 *   npm run build
 *   source scripts/.env
 *   node scripts/test-get-user-by-login.js some.user@company.com
 */
const { getUserByLogin } = require("../dist/index.js");

const login = process.argv[2] || process.env.USER_LOGIN;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const instanceUrl = process.env.INSTANCE_URL;

if (!login) {
  console.error("Missing user login. Pass it as the first argument or set USER_LOGIN in the environment.");
  process.exit(1);
}

if (!clientId || !clientSecret || !instanceUrl) {
  console.error(
    "Missing required env vars: CLIENT_ID, CLIENT_SECRET, INSTANCE_URL",
  );
  process.exit(1);
}

(async () => {
  try {
    console.log(`Fetching user details for login: ${login}`);

    const start = Date.now();
    const user = await getUserByLogin(login, clientId, clientSecret, instanceUrl);
    const elapsedMs = Date.now() - start;

    console.log(`Fetched user in ${elapsedMs}ms`);
    console.log(JSON.stringify(user, null, 2));
  } catch (err) {
    console.error(`Error fetching user for login "${login}":`, err);
    process.exit(2);
  }
})();
