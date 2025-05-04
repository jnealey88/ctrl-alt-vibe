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
  'openid'
].join(' ');

// Generate a random state value for CSRF protection
function generateState(): string {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Initiate Google OAuth login flow
 * 
 * This uses the authorization code flow (rather than implicit flow) for better security
 */
export const initiateGoogleLogin = () => {
  // Log the redirect URL for debugging
  console.log('Using redirect URI:', REDIRECT_URI);
  
  // Generate and store a state value for CSRF protection
  const state = generateState();
  localStorage.setItem('googleAuthState', state);
  localStorage.setItem('googleAuthStartTime', Date.now().toString());
  
  // Construct Google OAuth URL
  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code'); // Using code flow instead of token
  authUrl.searchParams.append('scope', SCOPES);
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('prompt', 'select_account');
  authUrl.searchParams.append('access_type', 'online');
  
  // Redirect to Google OAuth page
  window.location.href = authUrl.toString();
};

/**
 * Handles Google OAuth redirect response
 * Returns the authorization code if present in URL parameters
 */
export const handleGoogleRedirect = (): string | null => {
  // Check for authorization code in query parameters (not hash fragment)
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');
  
  // The stored state for CSRF protection
  const storedState = localStorage.getItem('googleAuthState');
  
  // Remove the state immediately after checking
  localStorage.removeItem('googleAuthState');
  
  // Check for errors
  if (error) {
    console.error('Google OAuth error:', error);
    return null;
  }
  
  // If there's no state parameter, don't perform validation
  // This allows the function to be called on normal page loads
  if (!state) {
    return code;
  }
  
  // Validate state to prevent CSRF attacks when state is present
  if (state !== storedState) {
    console.error('Invalid state parameter, possible CSRF attack');
    return null;
  }
  
  // Return the authorization code
  return code;
};

/**
 * Exchange the authorization code for tokens via our backend
 * 
 * This calls our server which securely uses the client secret to exchange the code
 * for access and ID tokens, then returns the user information to us.
 */
export const exchangeCodeForTokens = async (code: string) => {
  try {
    const response = await fetch('/api/auth/google/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri: REDIRECT_URI })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Token exchange failed: ${response.status} - ${errorData}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw error;
  }
};

/**
 * Gets Google user profile information using the access token
 * 
 * Note: In the new flow, we typically don't need to call this directly
 * as the profile info comes back from the token exchange.
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
 * Checks if the current user has a valid Google session
 */
export const hasValidGoogleSession = (): boolean => {
  // With authorization code flow, we don't store tokens in localStorage
  // Instead, we rely on the server's session management
  return false;
};

/**
 * Removes Google authentication data from storage
 */
export const clearGoogleAuth = () => {
  localStorage.removeItem('googleAuthState');
  localStorage.removeItem('googleAuthStartTime');
};
