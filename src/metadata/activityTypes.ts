import { fetchWithRetry } from "../utilities";

type SheetData = Record<string, any[]>;
export async function getActivityTypesMetaData(
  clientId: string, clientSecret: string, instanceUrl: string, token: string = ""
): Promise<SheetData> {


  let responsedata: any[] = [];
  let offset = 0;
  const limit = 100;


  while (true) {
    const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscMetadata/v1/activityTypes?offset=${offset}&limit=${limit}`;

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

function transformData(data: any[]): any {
  const sheets: any = {};

  // Sheet 1: Activity Type Groups Overview
  const overview = data.map(d => ({
    "Label": d.label,
    "Name": d.name,
    "Status": d.active ? "Active" : "Inactive",
    "Group Label": d.groupLabel,
    "Default Duration": d.defaultDuration,
    'Allow Mass Activities': d.features.allowMassActivities ? 'Active' : '',
    'Teamwork Available': d.features.isTeamworkAvailable? 'Active' : '',
    'Segmenting Enabled': d.features.isSegmentingEnabled? 'Active' : '',
    'Allow Move Between Resources': d.features.allowMoveBetweenResources? 'Active' : '',
    'Allow Creation in Buckets': d.features.allowCreationInBuckets? 'Active' : '',
    'Allow Reschedule': d.features.allowReschedule? 'Active' : '',
    'Support Not Ordered Activities': d.features.supportOfNotOrderedActivities? 'Active' : '',
    'Allow Non-Scheduled Activities': d.features.allowNonScheduled? 'Active' : '',
    'Support Work Zones': d.features.supportOfWorkZones? 'Active' : '',
    'Support Work Skills': d.features.supportOfWorkSkills? 'Active' : '',
    'Support Time Slots': d.features.supportOfTimeSlots? 'Active' : '',
    'Support Inventory': d.features.supportOfInventory? 'Active' : '',
    'Support Links': d.features.supportOfLinks? 'Active' : '',
    'Support Preferred Resources': d.features.supportOfPreferredResources? 'Active' : '',
    'Allow Repeating Activities': d.features.allowRepeatingActivities? 'Active' : '',
    'Calculate Travel': d.features.calculateTravel? 'Active' : '',
    'Calculate Activity Duration Using Statistics':
      d.features.calculateActivityDurationUsingStatistics? 'Active' : '',
    'Allow Search': d.features.allowToSearch? 'Active' : '',
    'Allow Creation from Incoming Interface':
      d.features.allowToCreateFromIncomingInterface? 'Active' : '',
    'Enable Day Before Trigger': d.features.enableDayBeforeTrigger? 'Active' : '',
    'Enable Reminder and Change Triggers':
      d.features.enableReminderAndChangeTriggers? 'Active' : '',
    'Enable Not Started Trigger': d.features.enableNotStartedTrigger? 'Active' : '',
    'Enable SW Warning Trigger': d.features.enableSwWarningTrigger? 'Active' : '',
    'Calculate Delivery Window': d.features.calculateDeliveryWindow? 'Active' : '',
    'SLA & Service Window Use Customer Time Zone':
      d.features.slaAndServiceWindowUseCustomerTimeZone? 'Active' : '',
    'Support Required Inventory': d.features.supportOfRequiredInventory? 'Active' : '',
    'Disable Location Tracking': d.features.disableLocationTracking? 'Active' : '',

  }));
  sheets['Activity Type Overview'] = overview;

  // Sheet 2: Activity Type Time Slots
  const timeSlots: any[] = [];
  data.forEach(d => {
    if (!d.timeSlots) return;
    d.timeSlots.forEach((ts: any) => {
      timeSlots.push({
        "Label": d.label,
        "Name": d.name,
        'Time Slot Label': ts.label,

      });
    });
  });
  sheets['Activity Type TimeSlots'] = timeSlots;

  return sheets;
}