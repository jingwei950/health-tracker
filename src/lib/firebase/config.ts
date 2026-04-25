// src/lib/firebase/config.ts
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  type Firestore,
  connectFirestoreEmulator,
} from "firebase/firestore";
import {
  getStorage,
  type FirebaseStorage,
  connectStorageEmulator,
} from "firebase/storage";

const firebaseConfig = {
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

// Guard: skip initialization during SSR/build when Firebase config is absent.
// useEffect in AuthContext ensures services are only called in the browser.
const configured = Boolean(firebaseConfig.apiKey);
const app: FirebaseApp = configured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : (null as unknown as FirebaseApp);

export const auth: Auth = configured ? getAuth(app) : (null as unknown as Auth);

export const db: Firestore = configured
  ? getFirestore(app)
  : (null as unknown as Firestore);

export const storage: FirebaseStorage = configured
  ? getStorage(app)
  : (null as unknown as FirebaseStorage);

export default app;

// Use static imports (not require()) so all connect*Emulator functions share
// the same module instance as auth/db/storage — prevents "Firestore$1" mismatch.
// Guard ensures we only call connect* once (safe across HMR re-evaluations).
let emulatorsConnected = false;
if (
  typeof window !== "undefined" &&
  !emulatorsConnected &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" &&
  process.env.NODE_ENV === "development"
) {
  emulatorsConnected = true;
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "localhost", 8080);
  connectStorageEmulator(storage, "localhost", 9199);
}
