// Export all methods grouped by category
export * as OauthTokenService from './oauthTokenService';

// Export types
export * from './types';

// Export individual popular methods for convenience
export {
    getOAuthToken
} from './oauthTokenService';


// Default export with all functionality
const OfscUtility = {
  // Case converters
  getOAuthToken: require('./oauthTokenService').getOAuthToken,
  
};

export default OfscUtility;