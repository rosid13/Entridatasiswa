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

// A flag to ensure we only try to initialize once.
let crashlyticsInitialized = false;
let recordErrorFunc: ((error: Error) => void) | null = null;

// This function will only be called on the client side from within logAndReportError.
const initializeAndGetCrashlytics = async () => {
    if (crashlyticsInitialized) return; // Already initialized or failed, don't try again.
    crashlyticsInitialized = true; // Set flag immediately to prevent re-entry.

    if (typeof window !== 'undefined') {
        try {
            // Dynamically import client-side libs
            const { getAnalytics, isSupported } = await import("firebase/analytics");
            const { getCrashlytics, recordError } = await import('firebase/crashlytics');

            const analyticsSupported = await isSupported();
            if (analyticsSupported) {
                getAnalytics(app);
            }

            getCrashlytics(app); // This initializes it.
            recordErrorFunc = recordError; // Store the function for later use.
        } catch (error) {
            console.error("Firebase Crashlytics initialization failed:", error);
            // If it fails, recordErrorFunc will remain null, and we won't report.
        }
    }
};

/**
 * Logs an error to the console and reports it to Firebase Crashlytics.
 * This function is fire-and-forget.
 * @param error The caught error object.
 * @param contextMessage A descriptive message providing context about where the error occurred.
 */
export const logAndReportError = (error: unknown, contextMessage: string) => {
    // Always log to console for local development debugging
    console.error(contextMessage, error);

    // Fire-and-forget the async part which handles reporting
    (async () => {
        // Only run the rest on the client
        if (typeof window === 'undefined') {
            return;
        }

        // Initialize if not already done.
        if (!recordErrorFunc && !crashlyticsInitialized) {
            await initializeAndGetCrashlytics();
        }

        // Report to Crashlytics if initialization was successful.
        if (recordErrorFunc) {
            const errorToReport = error instanceof Error ? error : new Error(JSON.stringify(error));
            errorToReport.message = `${contextMessage} | ${errorToReport.message}`;
            recordErrorFunc(errorToReport);
        }
    })();
};

export { db, auth };
