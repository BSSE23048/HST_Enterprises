import { initializeApp } from 'firebase/app';
import { initializeAuth, browserSessionPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCvMfzmCoXgL7nXeAJMh9NM_q816Eq_HWs',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'hst-enterprises.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'hst-enterprises',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'hst-enterprises.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '12818053978',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:12818053978:web:361aa441fc0ea43e5e9163'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, { persistence: browserSessionPersistence });
export const db = getFirestore(app);
