import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBkGuPwXEVEgUJn78VcGIK0HotU9c6Nkt4',
  authDomain: 'vidcall-f853e.firebaseapp.com',
  projectId: 'vidcall-f853e',
  storageBucket: 'vidcall-f853e.firebasestorage.app',
  messagingSenderId: '684129603620',
  appId: '1:684129603620:android:8cc8c3662e4931e10248b1',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
