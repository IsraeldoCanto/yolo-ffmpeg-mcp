
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

// Log the firebaseConfig to help diagnose .env issues
console.log("Firebase Config being used for initialization:", firebaseConfig);

let app: FirebaseApp;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.error("CRITICAL_FIREBASE_INIT_ERROR: Failed to initialize Firebase.", error);
  console.error("This usually means your Firebase configuration (API Key, Project ID, etc.) is missing or incorrect in your .env.local file.");
  console.error("Please verify your .env.local file and ensure it contains the correct NEXT_PUBLIC_FIREBASE_... variables from your Firebase project settings.");
  console.error("After correcting .env.local, you MUST restart your Next.js development server.");
  // You might want to throw the error or handle it in a way that stops further app execution
  // if Firebase is essential for the app to run.
  // For now, we'll let it proceed so other console messages from config.ts might appear.
  // A more robust solution would be to display an error UI to the user.
  // Re-assign to satisfy TypeScript, but the app might not function.
  if (!getApps().length) {
    // This part is tricky because initializeApp might have already thrown
    // We'll just create a dummy app object to satisfy type checks if it truly fails,
    // but the console errors are the main diagnostic tool here.
    // @ts-ignore
    app = {} as FirebaseApp; 
  } else {
    app = getApp();
  }
}


const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();


export { app, auth, db, storage, googleProvider };
