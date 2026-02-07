import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Firebase config — used ONLY for Storage (creator profile images)
// Auth is handled directly via backend /auth/admin-login endpoint
const firebaseConfig = {
  apiKey: "AIzaSyBCLsex6af5oBBJLmuK8lnzOCg67TfktD8",
  authDomain: "matchvibe-d55f9.firebaseapp.com",
  projectId: "matchvibe-d55f9",
  storageBucket: "matchvibe-d55f9.firebasestorage.app",
  messagingSenderId: "911372372113",
  appId: "1:911372372113:web:7f02bc51b2751ad44d1730",
};

const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);
export default app;
