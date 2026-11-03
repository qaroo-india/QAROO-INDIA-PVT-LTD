import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyCxaABFscGMDzIblR2zd_ekNMJeJc1ENhE',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'crm-qaroo.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'crm-qaroo',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'crm-qaroo.firebasestorage.app',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '467452778873',
  appId: process.env.FIREBASE_APP_ID || '1:467452778873:web:e386a701d0cdc92b1fb7a8',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || 'G-5GR44G1Q8S',
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export default db;
