// src/lib/firebase/admin.ts
// Server-side only — never import from client components
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth }      from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function initAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) return initializeApp({ credential: cert(JSON.parse(json)) });
  return initializeApp(); // ADC on GCP/Vercel/Cloud Run
}

const adminApp = initAdminApp();
export const adminAuth = getAuth(adminApp);
export const adminDb   = getFirestore(adminApp);
export default adminApp;
