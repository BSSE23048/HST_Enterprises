import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Paste the exact object Firebase gave you here:
const firebaseConfig = {
  apiKey: "AIzaSyCvMfzmCoXgL7nXeAJMh9NM_q816Eq_HWs",
  authDomain: "hst-enterprises.firebaseapp.com",
  projectId: "hst-enterprises",
  storageBucket: "hst-enterprises.firebasestorage.app",
  messagingSenderId: "12818053978",
  appId: "1:12818053978:web:361aa441fc0ea43e5e9163"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);