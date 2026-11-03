import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDgbjaDEw5EdgpBBil4aA6GYzGusJ7M_es',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'qaroo-india-pvt-ltd.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'qaroo-india-pvt-ltd',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'qaroo-india-pvt-ltd.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1089995119108',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1089995119108:web:6ee9d65e6bb15f05e33351',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-25106RDQQF',
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
