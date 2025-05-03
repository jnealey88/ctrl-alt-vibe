import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";

// Debug: Check environment variables
const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const FIREBASE_APP_ID = import.meta.env.VITE_FIREBASE_APP_ID;

console.log('Firebase Config Environment Variables Status:', {
  apiKey: FIREBASE_API_KEY ? 'Defined' : 'Undefined', 
  projectId: FIREBASE_PROJECT_ID ? 'Defined' : 'Undefined',
  appId: FIREBASE_APP_ID ? 'Defined' : 'Undefined'
});

// Validate required environment variables
if (!FIREBASE_API_KEY || !FIREBASE_PROJECT_ID || !FIREBASE_APP_ID) {
  console.error('Missing required Firebase configuration. Check your environment variables.');
}

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_PROJECT_ID ? `${FIREBASE_PROJECT_ID}.firebaseapp.com` : '',
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_PROJECT_ID ? `${FIREBASE_PROJECT_ID}.appspot.com` : '',
  appId: FIREBASE_APP_ID,
  // Add any other required config properties
};

// Initialize Firebase with error handling
let app;
let auth;
let googleProvider;

try {
  console.log('Initializing Firebase with config:', {
    apiKey: FIREBASE_API_KEY ? '******' : undefined,
    projectId: FIREBASE_PROJECT_ID,
    appId: FIREBASE_APP_ID ? 'Provided' : undefined
  });
  
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

// Sign in with Google popup
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Sign in with Google redirect (for mobile)
export const signInWithGoogleRedirect = () => {
  signInWithRedirect(auth, googleProvider);
};

// Handle redirect result
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      return result.user;
    }
    return null;
  } catch (error) {
    console.error("Error handling redirect result:", error);
    throw error;
  }
};

export { auth };
