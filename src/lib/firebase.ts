import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Firebase is used for exactly one thing: proving "this browser really is signed in to a Google account" (the
// Sign in with Google button). Every value here is a public client id, safe to ship in the bundle — the secret
// half (the service account key that verifies tokens) lives only on the server, in server/.env.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const firebaseEnabled = !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
const app = firebaseEnabled ? initializeApp(firebaseConfig) : null;
const provider = new GoogleAuthProvider();

/** Opens the Google account picker and returns a Firebase ID token for the backend to verify, or null if cancelled. */
export async function signInWithGoogle(): Promise<string | null> {
  if (!app) throw new Error("Google sign-in is not configured for this environment.");
  try {
    const result = await signInWithPopup(getAuth(app), provider);
    return await result.user.getIdToken();
  } catch (e) {
    // The visitor closing the popup or clicking it twice is normal, not an error to show them.
    const code = (e as { code?: string }).code;
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return null;
    throw e;
  }
}
