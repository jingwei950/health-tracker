// functions/index.js
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onCall }            = require('firebase-functions/v2/https');
const { initializeApp }     = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth }           = require('firebase-admin/auth');

initializeApp();
const db = getFirestore();

exports.onUserCreated = onDocumentCreated('users/{uid}', async (event) => {
  const uid = event.params.uid;
  const profileRef = db.doc(`users/${uid}/profile`);
  if ((await profileRef.get()).exists) return;

  const batch = db.batch();
  batch.set(profileRef, { subscriptionTier: 'free', createdAt: FieldValue.serverTimestamp() }, { merge: true });
  batch.set(db.doc(`users/${uid}/preferences/settings`), {
    aiEnabled: true, firebaseAIConsent: true,
    preferLocalAI: false, notificationsEnabled: false, dataRetentionDays: 30,
  }, { merge: true });
  await batch.commit();
  console.log(`User documents created for ${uid}`);
});

exports.deleteUserData = onCall(async (request) => {
  if (!request.auth) throw new Error('Unauthenticated');
  const uid = request.auth.uid;
  const cols = ['nutrition_logs', 'activity_logs', 'sleep_logs', 'daily_summaries', 'insights'];
  for (const col of cols) {
    const snap = await db.collection(`users/${uid}/${col}`).get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
  await db.doc(`users/${uid}/profile`).delete();
  await db.doc(`users/${uid}/preferences/settings`).delete();
  await getAuth().deleteUser(uid);
  return { success: true };
});
