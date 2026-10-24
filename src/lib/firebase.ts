import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Firebase Client Configuration using environment variables.
 * In Vite/React apps, environment variables must be prefixed with VITE_.
 * Default fallbacks are provided for local development.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKey-BalWalaProd0001',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'bal-wala.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'bal-wala',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'bal-wala.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '152972169713',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:152972169713:web:20ada7c028f146d6861012',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};

// Initialize or reuse existing Firebase App instance
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Export initialized Auth instance
export const auth: Auth = getAuth(app);

// Export initialized Firestore instance (both as 'firestore' and alias 'db')
export const firestore: Firestore = getFirestore(app);
export const db: Firestore = firestore;

export default app;
