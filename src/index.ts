
// Export all methods grouped by category
export * as OauthTokenService from './oauthTokenService';
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



// Default export with all functionality
const OfscUtility = {
  // Case converters
  getOAuthToken: require('./oauthTokenService').getOAuthToken,
  downloadWorkZoneCSV: require('./workZones').downloadWorkZoneCSV,

};

export default OfscUtility;