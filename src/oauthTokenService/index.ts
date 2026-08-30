interface OAuthTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    [key: string]: unknown;
}

interface OAuthTokenOptions {
    /** Max retry attempts for transient (5xx) failures. Default: 2 */
    maxRetries?: number;
    /** Base delay in ms between retries (exponential backoff). Default: 1000 */
    retryDelayMs?: number;
    /** Request timeout in ms. Default: 10000 */
    timeoutMs?: number;
}

/**
 * Fetches an OAuth access token from OFSC.
 */
export async function getOAuthToken(
    clientId: string,
    clientSecret: string,
    instanceUrl: string,
    options: OAuthTokenOptions = {}
): Promise<string> {
    const { maxRetries = 3, retryDelayMs = 1000, timeoutMs = 10_000 } = options;

    const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/oauthTokenService/v2/token`;
    const credentials = btoa(`${clientId}@${instanceUrl}:${clientSecret}`);
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
    };
    const body = new URLSearchParams({ grant_type: 'client_credentials' });

    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {

        //AbortController is a built-in browser/Node API for cancelling async operations 
        // controller.signal & controller.abort() are used to cancel the fetch request if it takes too long
        const controller = new AbortController();

        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body,
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (response.ok) {
                const data = (await response.json()) as OAuthTokenResponse;
                if (!data.access_token) {
                    throw new Error('OAuth response did not contain an access_token');
                }
                return data.access_token;
            }

            // Retry only on server-side / transient errors
            if (response.status >= 500 && response.status < 600 && attempt < maxRetries) {
                lastError = new Error(`OAuth token request failed with status ${response.status}`);
                await delay(retryDelayMs * 2 ** attempt);
                continue;
            }

            // Non-retriable (4xx) or out of retries — fail fast
            const bodyText = await response.text().catch(() => '');
            throw new Error(
                `OAuth token request failed: ${response.status} ${response.statusText}${bodyText ? ` - ${bodyText}` : ''}`
            );
        } catch (error) {
            clearTimeout(timeout);
            lastError = error;

            const isAbort = error instanceof Error && error.name === 'AbortError';
            const isNetworkError = error instanceof TypeError;

            if ((isAbort || isNetworkError) && attempt < maxRetries) {
                await delay(retryDelayMs * 2 ** attempt);
                continue;
            }

            throw new Error(
                `Failed to fetch OAuth token after ${attempt + 1} attempt(s): ${error instanceof Error ? error.message : String(error)
                }`
            );
        }
    }

    throw lastError instanceof Error ? lastError : new Error('Failed to fetch OAuth token');
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}