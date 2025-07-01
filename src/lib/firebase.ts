'use client';

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import type { Crashlytics } from "firebase/crashlytics";


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

// Lazy-loaded Crashlytics instance and recordError function
let crashlyticsInstance: Crashlytics | null = null;
let recordErrorFunc: ((error: Error) => void) | null = null;

// Function to initialize Crashlytics on the client-side
const initializeCrashlytics = async (appInstance: FirebaseApp) => {
    if (typeof window !== 'undefined' && !crashlyticsInstance) {
        try {
            const isSupported = await isAnalyticsSupported();
            if (isSupported) {
                getAnalytics(appInstance); // Analytics is recommended for richer reports
            }

            const { getCrashlytics, recordError } = await import('firebase/crashlytics');
            crashlyticsInstance = getCrashlytics(appInstance);
            recordErrorFunc = recordError;
        } catch (error) {
            console.error("Failed to initialize Firebase Crashlytics:", error);
        }
    }
};

// Initialize it
initializeCrashlytics(app);


/**
 * Logs an error to the console and reports it to Firebase Crashlytics.
 * @param error The caught error object.
 * @param contextMessage A descriptive message providing context about where the error occurred.
 */
export const logAndReportError = (error: unknown, contextMessage: string) => {
    // Log to console for local development debugging
    console.error(contextMessage, error);

    // Report to Crashlytics if it has been initialized
    if (recordErrorFunc) {
        const errorToReport = error instanceof Error ? error : new Error(JSON.stringify(error));
        // It can be helpful to prepend context to the message for easier triage in Crashlytics
        errorToReport.message = `${contextMessage} | ${errorToReport.message}`;
        recordErrorFunc(errorToReport);
    }
};

export { db, auth };
