/**
 * Google OAuth Authentication Service
 */

// The Google OAuth client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Google OAuth endpoints
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const REDIRECT_URI = `${window.location.origin}/auth`; // Redirect back to our auth page

// Required Google OAuth scopes
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

/**
 * Initiate Google OAuth login flow
 */
export const initiateGoogleLogin = () => {
  // Log the redirect URL for debugging
  console.log('Using redirect URI:', REDIRECT_URI);
  
  // Construct Google OAuth URL
  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'token');
  authUrl.searchParams.append('scope', SCOPES);
  authUrl.searchParams.append('prompt', 'select_account');
  authUrl.searchParams.append('access_type', 'online');
  
  // Store the current time to handle expiration
  localStorage.setItem('googleAuthStartTime', Date.now().toString());
  
  // Redirect to Google OAuth page
  window.location.href = authUrl.toString();
};

/**
 * Handles Google OAuth redirect response
 * Returns the access token if present in URL fragment
 */
export const handleGoogleRedirect = (): string | null => {
  if (!window.location.hash) {
    return null;
  }
  
  // Parse hash fragment
  const params = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = params.get('access_token');
  const expiresIn = params.get('expires_in'); // in seconds
  
  if (accessToken && expiresIn) {
    // Store token with expiration
    const expirationTime = Date.now() + (parseInt(expiresIn) * 1000);
    localStorage.setItem('googleAccessToken', accessToken);
    localStorage.setItem('googleTokenExpiration', expirationTime.toString());
    return accessToken;
  }
  
  return null;
};

/**
 * Gets Google user profile information using the access token
 */
export const getGoogleUserInfo = async (accessToken: string) => {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Google user info:', error);
    throw error;
  }
};

/**
 * Checks if the current user has a valid Google access token
 */
export const hasValidGoogleToken = (): boolean => {
  const accessToken = localStorage.getItem('googleAccessToken');
  const expirationTime = localStorage.getItem('googleTokenExpiration');
  
  if (!accessToken || !expirationTime) {
    return false;
  }
  
  return Date.now() < parseInt(expirationTime);
};

/**
 * Removes Google authentication data from local storage
 */
export const clearGoogleAuth = () => {
  localStorage.removeItem('googleAccessToken');
  localStorage.removeItem('googleTokenExpiration');
  localStorage.removeItem('googleAuthStartTime');
};
