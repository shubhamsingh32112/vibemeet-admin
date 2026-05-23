/**
 * Firebase app config (auth-related vars only).
 * Creator media uploads use Cloudflare Images — not Firebase Storage.
 */
import { initializeApp } from 'firebase/app';

const getEnvVar = (key: string, optional = false): string => {
  const value = import.meta.env[key];
  if (!value && !optional) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Please check your .env file.`,
    );
  }
  return value ?? '';
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', true) || undefined,
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
};

const app = initializeApp(firebaseConfig);

export default app;
