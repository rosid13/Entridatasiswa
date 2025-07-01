'use client';

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);


/**
 * Logs an error to the console. 
 * Firebase Crashlytics and Analytics have been removed to resolve Vercel build issues.
 * @param error The caught error object.
 * @param contextMessage A descriptive message providing context about where the error occurred.
 */
export const logAndReportError = (error: unknown, contextMessage: string) => {
    // Always log to console for development debugging
    console.error(contextMessage, error);
};

export { db, auth };
