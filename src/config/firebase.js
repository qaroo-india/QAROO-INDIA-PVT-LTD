import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCxaABFscGMDzIblR2zd_ekNMJeJc1ENhE',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'crm-qaroo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'crm-qaroo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'crm-qaroo.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '467452778873',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:467452778873:web:e386a701d0cdc92b1fb7a8',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-5GR44G1Q8S',
};

// Initialize Firebase (guards against re-initialization during HMR)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics asynchronously and safely (ensures browser environment and indexedDB/storage support)
let analyticsInstance = null;
export const analyticsPromise = typeof window !== 'undefined'
  ? isSupported()
      .then((yes) => {
        if (yes) {
          analyticsInstance = getAnalytics(app);
          return analyticsInstance;
        }
        return null;
      })
      .catch(() => null)
  : Promise.resolve(null);

export const getAnalyticsInstance = () => analyticsInstance;
export default app;
