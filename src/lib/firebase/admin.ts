// src/lib/firebase/admin.ts
// Server-side only — never import from client components
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth }      from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function initAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) return initializeApp({ credential: cert(JSON.parse(json)) });
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (projectId) return initializeApp({ projectId }); // emulator / ADC with known project
  return initializeApp(); // ADC on GCP/Vercel/Cloud Run
}

const adminApp = initAdminApp();
export const adminAuth = getAuth(adminApp);
export const adminDb   = getFirestore(adminApp);
export default adminApp;

// ── Nutrition cache (admin — bypasses security rules) ──────────
function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 100);
}

export async function getAdminNutritionCache(foodName: string, uid?: string) {
  if (!uid) return null;
  const snap = await adminDb.doc(`users/${uid}/nutrition_cache/${toSlug(foodName)}`).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  const expiresMs = data.expiresAt?.toMillis?.() ?? (data.expiresAt?._seconds ?? 0) * 1000;
  return expiresMs > Date.now()
    ? data
    : null;
}

export async function setAdminNutritionCache(foodName: string, payload: object, uid?: string) {
  if (!uid) return;
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await adminDb.doc(`users/${uid}/nutrition_cache/${toSlug(foodName)}`).set({
    foodName,
    cachedAt: new Date(),
    expiresAt: expires,
    ...payload,
  });
}
