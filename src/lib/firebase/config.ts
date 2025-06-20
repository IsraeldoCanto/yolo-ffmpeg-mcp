
// TODO: Add your Firebase project configuration here
// See: https://firebase.google.com/docs/web/setup#available-libraries

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

if (!apiKey || apiKey === "YOUR_API_KEY" || apiKey.startsWith("YOUR_API_KEY")) {
  console.error(
    "CRITICAL_FIREBASE_CONFIG_ERROR: Firebase API Key is missing or using a placeholder value. " +
    "Please ensure NEXT_PUBLIC_FIREBASE_API_KEY is correctly set in your .env.local file " +
    "and that you have restarted your development server."
  );
}
if (!projectId || projectId === "YOUR_PROJECT_ID" || projectId.startsWith("YOUR_PROJECT_ID")) {
  console.error(
    "CRITICAL_FIREBASE_CONFIG_ERROR: Firebase Project ID is missing or using a placeholder value. " +
    "Please ensure NEXT_PUBLIC_FIREBASE_PROJECT_ID is correctly set in your .env.local file " +
    "and that you have restarted your development server."
  );
}

export const firebaseConfig = {
  apiKey: apiKey || "ERROR_API_KEY_NOT_SET",
  authDomain: authDomain || "ERROR_AUTH_DOMAIN_NOT_SET",
  projectId: projectId || "ERROR_PROJECT_ID_NOT_SET",
  storageBucket: storageBucket || "ERROR_STORAGE_BUCKET_NOT_SET",
  messagingSenderId: messagingSenderId || "ERROR_MESSAGING_SENDER_ID_NOT_SET",
  appId: appId || "ERROR_APP_ID_NOT_SET",
};
