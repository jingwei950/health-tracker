// functions/index.js
import { getAuth } from "firebase-admin/auth";
import { initializeApp } from "firebase-admin/app";
import { onCall } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

// Triggered when a new user document is created in Firestore. Bootstraps the
// user's profile (free tier) and default preferences if they don't exist yet.
export const onUserCreated = onDocumentCreated("users/{uid}", async (event) => {
  const uid = event.params.uid;
  const userRef = db.doc(`users/${uid}`);

  const batch = db.batch();
  batch.set(
    userRef,
    { subscriptionTier: "free", createdAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  batch.set(
    db.doc(`users/${uid}/preferences/settings`),
    {
      aiEnabled: true,
      firebaseAIConsent: true,
      preferLocalAI: false,
      notificationsEnabled: false,
      dataRetentionDays: 30,
    },
    { merge: true },
  );
  await batch.commit();
  console.log(`User documents created for ${uid}`);
});

// Callable function that wipes all data for the authenticated user: clears
// every log/summary/insight sub-collection, deletes profile and preferences
// documents, then removes the Firebase Auth account.
export const deleteUserData = onCall(async (request) => {
  if (!request.auth) throw new Error("Unauthenticated");
  const uid = request.auth.uid;
  const cols = [
    "nutrition_logs",
    "activity_logs",
    "sleep_logs",
    "daily_summaries",
    "insights",
  ];
  for (const col of cols) {
    const snap = await db.collection(`users/${uid}/${col}`).get();
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  await db.doc(`users/${uid}`).delete();
  await db.doc(`users/${uid}/preferences/settings`).delete();
  await getAuth().deleteUser(uid);
  return { success: true };
});
