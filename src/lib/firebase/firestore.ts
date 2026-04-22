// src/lib/firebase/firestore.ts
import {
  collection, doc, setDoc, getDoc, getDocs,
  query, where, orderBy, onSnapshot, deleteDoc,
  writeBatch, increment, serverTimestamp, arrayUnion, arrayRemove,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import type {
  NutritionLog, ActivityLog, SleepLog,
  DailySummary, UserProfile, UserPreferences,
} from '@/types/health.types';

// ── Path helpers ───────────────────────────────────────────────
const profilePath  = (uid: string)               => `users/${uid}/profile`;
const prefsPath    = (uid: string)               => `users/${uid}/preferences/settings`;
const nutLogPath   = (uid: string)               => `users/${uid}/nutrition_logs`;
const actLogPath   = (uid: string)               => `users/${uid}/activity_logs`;
const summaryPath  = (uid: string, date: string) => `users/${uid}/daily_summaries/${date}`;
const cachePath    = (slug: string)              => `nutrition_cache/${slug}`;

// ── User ────────────────────────────────────────────────────────
export async function createUserDocuments(uid: string, displayName: string, email: string) {
  const batch = writeBatch(db);
  batch.set(doc(db, profilePath(uid)), {
    displayName, email,
    createdAt: serverTimestamp(),
    subscriptionTier: 'free',
  }, { merge: true });
  batch.set(doc(db, prefsPath(uid)), {
    aiEnabled: true, firebaseAIConsent: true,
    preferLocalAI: false, notificationsEnabled: false, dataRetentionDays: 30,
  } as UserPreferences, { merge: true });
  await batch.commit();
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, profilePath(uid)));
  return snap.exists() ? snap.data() as UserProfile : null;
}

export async function getUserPreferences(uid: string): Promise<UserPreferences | null> {
  const snap = await getDoc(doc(db, prefsPath(uid)));
  return snap.exists() ? snap.data() as UserPreferences : null;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  await setDoc(doc(db, profilePath(uid)), data, { merge: true });
}

// ── Nutrition logs ──────────────────────────────────────────────
export async function logFoodEntry(
  uid: string,
  entry: Omit<NutritionLog, 'id' | 'loggedAt'>,
): Promise<string> {
  const batch      = writeBatch(db);
  const logRef     = doc(collection(db, nutLogPath(uid)));
  const summaryRef = doc(db, summaryPath(uid, entry.date));

  batch.set(logRef, { ...entry, id: logRef.id, loggedAt: serverTimestamp() });
  batch.set(summaryRef, {
    date: entry.date,
    nutrition: {
      totalCalories: increment(entry.calories),
      totalProtein:  increment(entry.protein),
      totalCarbs:    increment(entry.carbs),
      totalFat:      increment(entry.fat),
      mealCount:     increment(1),
    },
    netCalories: increment(entry.calories),
    lastUpdated: serverTimestamp(),
  }, { merge: true });

  await batch.commit();
  return logRef.id;
}

export async function deleteFoodEntry(
  uid: string,
  logId: string,
  entry: Pick<NutritionLog, 'date' | 'calories' | 'protein' | 'carbs' | 'fat'>,
) {
  const batch      = writeBatch(db);
  const summaryRef = doc(db, summaryPath(uid, entry.date));

  batch.delete(doc(db, `${nutLogPath(uid)}/${logId}`));
  batch.set(summaryRef, {
    nutrition: {
      totalCalories: increment(-entry.calories),
      totalProtein:  increment(-entry.protein),
      totalCarbs:    increment(-entry.carbs),
      totalFat:      increment(-entry.fat),
      mealCount:     increment(-1),
    },
    netCalories: increment(-entry.calories),
    lastUpdated: serverTimestamp(),
  }, { merge: true });

  await batch.commit();
}

export async function getNutritionLogs(uid: string, date: string): Promise<NutritionLog[]> {
  const q    = query(collection(db, nutLogPath(uid)), where('date', '==', date), orderBy('loggedAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as NutritionLog);
}

export function subscribeNutritionLogs(
  uid: string,
  date: string,
  cb: (logs: NutritionLog[]) => void,
): Unsubscribe {
  const q = query(collection(db, nutLogPath(uid)), where('date', '==', date), orderBy('loggedAt', 'asc'));
  return onSnapshot(q, snap => cb(snap.docs.map(d => d.data() as NutritionLog)));
}

// ── Activity logs ───────────────────────────────────────────────
export async function logActivityEntry(
  uid: string,
  entry: Omit<ActivityLog, 'id' | 'loggedAt'>,
): Promise<string> {
  const batch      = writeBatch(db);
  const logRef     = doc(collection(db, actLogPath(uid)));
  const summaryRef = doc(db, summaryPath(uid, entry.date));

  batch.set(logRef, { ...entry, id: logRef.id, loggedAt: serverTimestamp() });
  batch.set(summaryRef, {
    date: entry.date,
    activity: {
      totalCaloriesBurned: increment(entry.caloriesBurned),
      totalMinutes:        increment(entry.durationMinutes),
      sessionCount:        increment(1),
      activities:          arrayUnion(entry.activityName),  // ← correct: never overwrites array
    },
    netCalories: increment(-entry.caloriesBurned),
    lastUpdated: serverTimestamp(),
  }, { merge: true });

  await batch.commit();
  return logRef.id;
}

export async function deleteActivityEntry(
  uid: string,
  logId: string,
  entry: Pick<ActivityLog, 'date' | 'caloriesBurned' | 'durationMinutes' | 'activityName'>,
) {
  const batch      = writeBatch(db);
  const summaryRef = doc(db, summaryPath(uid, entry.date));

  batch.delete(doc(db, `${actLogPath(uid)}/${logId}`));
  batch.set(summaryRef, {
    activity: {
      totalCaloriesBurned: increment(-entry.caloriesBurned),
      totalMinutes:        increment(-entry.durationMinutes),
      sessionCount:        increment(-1),
      activities:          arrayRemove(entry.activityName),
    },
    netCalories: increment(entry.caloriesBurned),
    lastUpdated: serverTimestamp(),
  }, { merge: true });

  await batch.commit();
}

export function subscribeActivityLogs(
  uid: string,
  date: string,
  cb: (logs: ActivityLog[]) => void,
): Unsubscribe {
  const q = query(collection(db, actLogPath(uid)), where('date', '==', date), orderBy('loggedAt', 'asc'));
  return onSnapshot(q, snap => cb(snap.docs.map(d => d.data() as ActivityLog)));
}

// ── Daily summary ───────────────────────────────────────────────
export async function getDailySummary(uid: string, date: string): Promise<DailySummary | null> {
  const snap = await getDoc(doc(db, summaryPath(uid, date)));
  return snap.exists() ? snap.data() as DailySummary : null;
}

export function subscribeDailySummary(
  uid: string,
  date: string,
  cb: (summary: DailySummary | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db, summaryPath(uid, date)), snap =>
    cb(snap.exists() ? snap.data() as DailySummary : null)
  );
}

// ── Nutrition cache ─────────────────────────────────────────────
function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 100);
}

export async function getNutritionCache(foodName: string) {
  const snap = await getDoc(doc(db, cachePath(toSlug(foodName))));
  if (!snap.exists()) return null;
  const data = snap.data();
  return (data.expiresAt?.toMillis?.() ?? 0) > Date.now() ? data : null;
}

export async function setNutritionCache(foodName: string, payload: object) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await setDoc(doc(db, cachePath(toSlug(foodName))), {
    foodName, cachedAt: serverTimestamp(), expiresAt: expires, ...payload,
  });
}
