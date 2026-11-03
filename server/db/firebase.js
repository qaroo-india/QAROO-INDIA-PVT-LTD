import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyDgbjaDEw5EdgpBBil4aA6GYzGusJ7M_es',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'qaroo-india-pvt-ltd.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'qaroo-india-pvt-ltd',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'qaroo-india-pvt-ltd.firebasestorage.app',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '1089995119108',
  appId: process.env.FIREBASE_APP_ID || '1:1089995119108:web:6ee9d65e6bb15f05e33351',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || 'G-25106RDQQF',
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export default db;
