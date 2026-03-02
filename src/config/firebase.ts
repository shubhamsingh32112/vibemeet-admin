import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Firebase config — used ONLY for Storage (creator profile images)
// Auth is handled directly via backend /auth/admin-login endpoint
// All values are loaded from environment variables (VITE_ prefix required for Vite)

const getEnvVar = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Please check your .env file and ensure all Firebase configuration variables are set.`
    );
  }
  return value;
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
};

const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);
export default app;
