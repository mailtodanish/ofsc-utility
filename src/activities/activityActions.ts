import { fetchWithRetry, deleteWithRetry, fetchPostWithRetry, log } from "../utilities";

export async function startActivity(
  clientId: string,
  clientSecret: string,
  instanceUrl: string,
  activityId: number,
  token: string = ""

): Promise<{ token: string; data: any }> {

  if (!activityId || isNaN(activityId)) {
    throw new Error("Invalid activityId. It must be a valid number.");
  }

  const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/activities/${Number(activityId)}/custom-actions/start`;

  log.blue(`Starting activity by ID: ${url}`);

  const response = await fetchPostWithRetry(url, clientId, clientSecret, instanceUrl, token, {});

  return response;

}

export async function cancelActivity(
  clientId: string,
  clientSecret: string,
  instanceUrl: string,
  activityId: number,
  token: string = ""

): Promise<{ token: string; data: any }> {
  if (!activityId || isNaN(activityId)) {
    throw new Error("Invalid activityId. It must be a valid number.");
  }

  const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/activities/${Number(activityId)}/custom-actions/cancel`;

  log.red(`Cancelling activity by ID: ${url}`);

  const response = await fetchPostWithRetry(url, clientId, clientSecret, instanceUrl, token,{});

  return response;

}

export async function completeActivity(
  clientId: string,
  clientSecret: string,
  instanceUrl: string,
  activityId: number,
  token: string = ""

): Promise<{ token: string; data: any }> {

  if (!activityId || isNaN(activityId)) {
    throw new Error("Invalid activityId. It must be a valid number.");
  }

  const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/activities/${Number(activityId)}/custom-actions/complete`;

  log.green(`Completing activity by ID: ${url}`);

  const response = await fetchPostWithRetry(url, clientId, clientSecret, instanceUrl, token,{});

  return response;

}

export async function deleteActivity(
  clientId: string,
  clientSecret: string,
  instanceUrl: string,
  activityId: number,
  token: string = ""

): Promise<{ token: string; data: any }> {

  if (!activityId || isNaN(activityId)) {
    throw new Error("Invalid activityId. It must be a valid number.");
  }

  const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/activities/${Number(activityId)}`;

  log.yellow(`Deleting activity by ID: ${url}`);

  const response = await deleteWithRetry(url, clientId, clientSecret, instanceUrl, token);

  return response;

}

