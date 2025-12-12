
// Export all methods grouped by category
export * as Activity from './activities';
export * as ActivityInventories from './activityInventories';
export * as Events from './events';
export * as Inventory from './inventory';
export * as InventoryType from './inventoryTypes';
export * as OauthTokenService from './oauthTokenService';
export * as Resource from './resources';
export * as User from './users';
export * as CSV from './utilities';
export * as WorkZone from './workZones';
// Export types
export * from './types';

export {
  generateAllOnHandInventoryOfAllResourcesCSV
} from './inventory';
export {
  getOAuthToken
} from './oauthTokenService';

export {
  downloadWorkZoneCSV
} from './workZones';

export {
  downloadAllResourcesCSV
} from './resources';

export {
  downloadAllUsersCSV, generateUsersCollaborationCSV
} from './users';

export {
  downloadAllInventoryTypesCSV, getInventoryTypesDetail, updateCreateInventoryType
} from './inventoryTypes';

export {
  getAllActivities
} from './activities';

export { createActivityCustomerInventories, getActivityCustomerInventories } from './activityInventories';

export { downloadAllEventsOfDay, downloadAllEventsOfDayCSV } from './events';


// Default export with all functionality
const OfscUtility = {
  getOAuthToken: require('./oauthTokenService').getOAuthToken,
  downloadWorkZoneCSV: require('./workZones').downloadWorkZoneCSV,
  downloadAllResourcesCSV: require('./resources').downloadAllResourcesCSV,
  downloadAllUsersCSV: require('./resources').downloadAllUsersCSV,
  downloadAllInventoryTypesCSV: require('./inventoryTypes').downloadAllInventoryTypesCSV,
  getInventoryTypesDetail: require('./inventoryTypes').getInventoryTypesDetail,
  updateInventoryType: require('./inventoryTypes').updateInventoryType,
  getAllActivities: require('./activities').getAllActivities,
  getActivityCustomerInventories: require('./activityInventories').getActivityCustomerInventories,
  createActivityCustomerInventories: require('./activityInventories').createActivityCustomerInventories,
  downloadAllEventsOfDayCSV: require('./events').downloadAllEventsOfDayCSV,
  downloadAllEventsOfDay: require('./events').downloadAllEventsOfDay,
  generateUsersCollaborationCSV: require('./users').generateUsersCollaborationCSV,
  generateAllOnHandInventoryOfAllResourcesCSV: require('./inventory').generateAllOnHandInventoryOfAllResourcesCSV

};

export default OfscUtility;