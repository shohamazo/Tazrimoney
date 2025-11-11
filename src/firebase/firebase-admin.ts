// IMPORTANT: This file should not be used on the client.
import * as admin from 'firebase-admin';

// This is a singleton to ensure we only initialize the admin app once.
let firebaseAdmin: admin.app.App | null = null;

export async function getFirebaseAdmin() {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  // Check if the service account key is available in environment variables
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set. This is required for server-side admin operations.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    
    // Check if the app is already initialized
    if (!admin.apps.length) {
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      firebaseAdmin = admin.app();
    }
    
    return firebaseAdmin;

  } catch (error) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY or initialize Firebase Admin SDK.", error);
    throw new Error("Could not initialize Firebase Admin SDK. Check your service account key.");
  }
}
