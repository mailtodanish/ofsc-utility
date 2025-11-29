
// Export all methods grouped by category
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



// Default export with all functionality
const OfscUtility = {
  // Case converters
  getOAuthToken: require('./oauthTokenService').getOAuthToken,
  downloadWorkZoneCSV: require('./workZones').downloadWorkZoneCSV,
  downloadAllResourcesCSV: require('./resources').downloadAllResourcesCSV,
  downloadAllUsersCSV: require('./resources').downloadAllUsersCSV

};

export default OfscUtility;