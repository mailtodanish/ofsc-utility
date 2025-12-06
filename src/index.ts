
// Export all methods grouped by category
export * as Activity from './activities';
export * as InventoryType from './inventoryTypes';
export * as OauthTokenService from './oauthTokenService';
export * as Resource from './resources';
export * as User from './users';
export * as WorkZone from './workZones';
// Export types
export * from './types';

// Export individual popular methods for convenience
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
  downloadAllUsersCSV
} from './users';

export {
  downloadAllInventoryTypesCSV, getInventoryTypesDetail, updateCreateInventoryType
} from './inventoryTypes';

export {
  getAllActivities
} from './activities';


// Default export with all functionality
const OfscUtility = {
  // Case converters
  getOAuthToken: require('./oauthTokenService').getOAuthToken,
  downloadWorkZoneCSV: require('./workZones').downloadWorkZoneCSV,
  downloadAllResourcesCSV: require('./resources').downloadAllResourcesCSV,
  downloadAllUsersCSV: require('./resources').downloadAllUsersCSV,
  downloadAllInventoryTypesCSV: require('./inventoryTypes').downloadAllInventoryTypesCSV,
  getInventoryTypesDetail: require('./inventoryTypes').getInventoryTypesDetail,
  updateInventoryType: require('./inventoryTypes').updateInventoryType,
  getAllActivities: require('./activities').getAllActivities

};

export default OfscUtility;