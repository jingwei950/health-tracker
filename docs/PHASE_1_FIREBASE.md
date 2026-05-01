# Phase 1 — Firebase Installation and Setup

**Goal:** The existing Next.js app is fully connected to Firebase. Auth, Firestore, Storage, Security Rules, Cloud Functions emulator, and the full data layer are working locally before any AI work begins.

**Tasks:** T1.1 → T1.18  
**Gate:** All 18 tasks verified before opening PHASE_2_GEMINI.md  
**Mark progress in:** PROGRESS.md

---

## [ ] T1.1 — Create Firebase Project
> ⚠️ **MANUAL STEP — user action required. Do not proceed to T1.2 until the user provides the `firebaseConfig` object.**

Present these instructions to the user and wait:

1. Go to https://console.firebase.google.com
2. Click **Add project** → name it `healthtrack-sg`
3. Enable Google Analytics if prompted (optional)
4. Go to **Build → Firestore Database** → Create database → **production mode** → region `asia-southeast1` (Singapore)
5. Go to **Build → Authentication** → Get started → enable **Email/Password** and **Google**
6. Go to **Build → Storage** → Get started → production mode
7. Go to **Project settings** (gear icon) → **Your apps** → Add a **Web app** → Register → copy the `firebaseConfig` object
8. Provide the `firebaseConfig` values to the agent

**VERIFY:** User has provided a `firebaseConfig` object with all 6 keys: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.

---

## [ ] T1.2 — Install Firebase SDK and CLI

```bash
npm install firebase
npm install -g firebase-tools
npx firebase login

# When prompted during init, select:
# Services: Firestore, Authentication, Storage, Functions, Emulators
# Functions language: JavaScript
# Emulators: Auth, Functions, Firestore, Storage
npx firebase init
```

**VERIFY:**
```bash
ls firebase.json && ls .firebaserc && ls firestore.rules && ls firestore.indexes.json && ls -d functions/
# All 5 must exist — no "No such file" errors
```

---

## [ ] T1.3 — Create Environment Variables

Create `.env.local` using the `firebaseConfig` values from T1.1. Replace every `[REPLACE:...]` token.

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_FIREBASE_API_KEY=[REPLACE:firebaseConfig.apiKey]
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=[REPLACE:firebaseConfig.authDomain]
NEXT_PUBLIC_FIREBASE_PROJECT_ID=[REPLACE:firebaseConfig.projectId]
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=[REPLACE:firebaseConfig.storageBucket]
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=[REPLACE:firebaseConfig.messagingSenderId]
NEXT_PUBLIC_FIREBASE_APP_ID=[REPLACE:firebaseConfig.appId]
EOF

grep -q ".env.local" .gitignore || echo ".env.local" >> .gitignore
echo "firebase-service-account*.json" >> .gitignore
```

**VERIFY:**
```bash
grep "NEXT_PUBLIC_FIREBASE_API_KEY" .env.local | grep -v "\[REPLACE"
# Must print a line with a real value
```

---

## [ ] T1.4 — Create Firebase Config Singleton

Create `src/lib/firebase/config.ts`:

```typescript
// src/lib/firebase/config.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth               = getAuth(app);
export const db: Firestore            = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export default app;
```

**VERIFY:**
```bash
npx tsc --noEmit 2>&1 | grep "config.ts"
# Must print nothing
```

---

## [ ] T1.5 — Deploy Firestore Security Rules

Replace the full contents of `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }

    match /nutrition_cache/{docId} {
      allow read:  if request.auth != null;
      allow write: if false;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

```bash
npx firebase deploy --only firestore:rules
```

**VERIFY:**
```bash
npx firebase deploy --only firestore:rules 2>&1 | grep -i "error"
# Must print nothing — no errors
```

---

## [ ] T1.6 — Create Firestore Indexes

Replace the full contents of `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "nutrition_logs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date",      "order": "ASCENDING"  },
        { "fieldPath": "loggedAt",  "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "nutrition_logs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date",      "order": "DESCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "activity_logs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date",     "order": "DESCENDING" },
        { "fieldPath": "loggedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "daily_summaries",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date",        "order": "DESCENDING" },
        { "fieldPath": "lastUpdated", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "insights",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "generatedAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

```bash
npx firebase deploy --only firestore:indexes
```

**VERIFY:**
```bash
npx firebase deploy --only firestore:indexes 2>&1 | grep -i "error"
# Must print nothing
```

---

## [ ] T1.7 — Implement Authentication

Create `src/lib/firebase/auth.ts`:

```typescript
// src/lib/firebase/auth.ts
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User,
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle  = () => signInWithPopup(auth, googleProvider);
export const signInWithEmail   = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);
export const registerWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);
export const logOut            = () => signOut(auth);
export const onAuthChange      = (cb: (user: User | null) => void) =>
  onAuthStateChanged(auth, cb);
export const getCurrentUser    = () => auth.currentUser;

export const deleteAccount = async (password: string) => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('No authenticated user');
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
  await deleteUser(user);
};
```

Create `src/hooks/useAuth.ts`:

```typescript
// src/hooks/useAuth.ts
'use client';
import { useState, useEffect } from 'react';
import { type User } from 'firebase/auth';
import { onAuthChange } from '@/lib/firebase/auth';

interface AuthState {
  user:    User | null;
  loading: boolean;
  uid:     string | null;
}

export function useAuth(): AuthState {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange((u) => { setUser(u); setLoading(false); });
    return unsub;
  }, []);

  return { user, loading, uid: user?.uid ?? null };
}
```

**VERIFY:**
```bash
npx tsc --noEmit 2>&1 | grep -E "auth\.ts|useAuth\.ts"
# Must print nothing
```

---

## [ ] T1.8 — Create TypeScript Types

Create `src/types/health.types.ts`:

```typescript
// src/types/health.types.ts
import { type Timestamp } from 'firebase/firestore';

export interface NutritionLog {
  id:           string;
  foodName:     string;
  mealType:     'breakfast' | 'lunch' | 'dinner' | 'snack';
  servingSize:  number;
  servingUnit:  string;
  servings:     number;
  calories:     number;
  protein:      number;
  carbs:        number;
  fat:          number;
  fiber?:       number;
  sugar?:       number;
  sodium?:      number;
  source:       string;
  dataVerified: boolean;
  estimated:    boolean;
  logSource:    'search' | 'quick_add' | 'manual' | 'barcode';
  date:         string;
  loggedAt:     Timestamp;
}

export interface ActivityLog {
  id:              string;
  activityName:    string;
  category:        'sport' | 'cardio' | 'strength' | 'flexibility' | 'other';
  durationMinutes: number;
  durationHours:   number;
  intensityLevel:  'low' | 'medium' | 'high';
  met:             number;
  caloriesBurned:  number;
  notes?:          string;
  heartRateAvg?:   number;
  heartRateMax?:   number;
  distanceKm?:     number;
  estimated:       boolean;
  date:            string;
  loggedAt:        Timestamp;
  source:          'manual' | 'apple_watch' | 'import';
}

export interface SleepLog {
  id:          string;
  date:        string;
  totalHours:  number;
  quality:     'poor' | 'fair' | 'good' | 'excellent';
  stages?: { core: number; deep: number; rem: number; awake: number };
  heartRateAvg?: number;
  notes?:        string;
  loggedAt:      Timestamp;
  source:        'manual' | 'apple_watch' | 'import';
}

export interface DailySummary {
  date: string;
  nutrition: {
    totalCalories: number;
    totalProtein:  number;
    totalCarbs:    number;
    totalFat:      number;
    mealCount:     number;
  };
  activity: {
    totalCaloriesBurned: number;
    totalMinutes:        number;
    sessionCount:        number;
    activities:          string[];
  };
  sleep?: { totalHours: number; quality: string };
  netCalories: number;
  lastUpdated: Timestamp;
}

export interface UserProfile {
  displayName:      string;
  email:            string;
  createdAt:        Timestamp;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  age?:             number;
  heightCm?:        number;
  weightKg?:        number;
  timezone?:        string;
  goals?: {
    dailyCalories?:   number;
    dailyProtein?:    number;
    dailyCarbs?:      number;
    dailyFat?:        number;
    weeklyWorkouts?:  number;
    dailySleepHours?: number;
  };
}

export interface UserPreferences {
  aiEnabled:             boolean;
  firebaseAIConsent:     boolean;
  preferLocalAI:         boolean;
  notificationsEnabled:  boolean;
  dataRetentionDays:     number;
}

export interface NutritionCacheEntry {
  foodName:     string;
  cachedAt:     Timestamp;
  expiresAt:    Timestamp;
  source:       string;
  calories:     number;
  protein:      number;
  carbs:        number;
  fat:          number;
  servingSize:  number;
  servingUnit:  string;
  dataVerified: boolean;
}
```

**VERIFY:**
```bash
npx tsc --noEmit 2>&1 | grep "health.types.ts"
# Must print nothing
```

---

## [ ] T1.9 — Implement Firestore Data Layer

Create `src/lib/firebase/firestore.ts`:

```typescript
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
```

**VERIFY:**
```bash
npx tsc --noEmit 2>&1 | grep "firestore.ts"
# Must print nothing
```

---

## [ ] T1.10 — Create Auth Context Provider

Create `src/contexts/AuthContext.tsx`:

```typescript
// src/contexts/AuthContext.tsx
'use client';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type User } from 'firebase/auth';
import { onAuthChange } from '@/lib/firebase/auth';
import { createUserDocuments } from '@/lib/firebase/firestore';

interface AuthContextType { user: User | null; loading: boolean; }

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await createUserDocuments(
            firebaseUser.uid,
            firebaseUser.displayName ?? firebaseUser.email ?? 'User',
            firebaseUser.email ?? '',
          );
        } catch { /* already exists */ }
      }
      setUser(firebaseUser);
      setLoading(false);
    });
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => useContext(AuthContext);
```

Open `src/app/layout.tsx` and wrap the body children with `AuthProvider`:

```typescript
// Add at the top of layout.tsx:
import { AuthProvider } from '@/contexts/AuthContext';

// Inside the return, wrap children:
// <body>
//   <AuthProvider>{children}</AuthProvider>
// </body>
```

**VERIFY:**
```bash
npx tsc --noEmit 2>&1 | grep "AuthContext"
# Must print nothing
```

---

## [ ] T1.11 — Set Up Firebase Emulator

Add to `firebase.json` under the top-level object:

```json
"emulators": {
  "auth":      { "port": 9099 },
  "firestore": { "port": 8080 },
  "functions": { "port": 5001 },
  "storage":   { "port": 9199 },
  "ui":        { "enabled": true, "port": 4000 }
}
```

Append to `.env.local`:
```bash
echo "" >> .env.local
echo "# Emulator — remove in production" >> .env.local
echo "NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true" >> .env.local
```

Append to `src/lib/firebase/config.ts` after the exports:

```typescript
if (
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' &&
  process.env.NODE_ENV === 'development'
) {
  const { connectAuthEmulator }      = require('firebase/auth');
  const { connectFirestoreEmulator } = require('firebase/firestore');
  const { connectStorageEmulator }   = require('firebase/storage');
  connectAuthEmulator(auth,    'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

**VERIFY:**
```bash
npx firebase emulators:start --only auth,firestore,storage
# Must reach "All emulators ready" — UI available at http://localhost:4000
```

---

## [ ] T1.12 — Create Cloud Function: New User Setup

Edit `functions/index.js`:

```javascript
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
```

```bash
cd functions && npm install firebase-admin firebase-functions && cd ..
```

**VERIFY:**
```bash
npx firebase emulators:start --only functions 2>&1 | grep "onUserCreated"
# Must show the function listed as available
```

---

## [ ] T1.13 — LocalStorage Migration Script

Create `src/lib/firebase/migration.ts`:

```typescript
// src/lib/firebase/migration.ts
import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

export async function migrateLocalStorageToFirestore(uid: string): Promise<void> {
  const KEY = 'healthtrack-migrated-v1';
  if (localStorage.getItem(KEY)) return;

  const legacyKeys = ['healthtrack-logs', 'healthEntries', 'nutritionLogs'];
  const allEntries: any[] = [];
  for (const k of legacyKeys) {
    try { const r = localStorage.getItem(k); if (r) allEntries.push(...JSON.parse(r)); } catch {}
  }

  if (!allEntries.length) { localStorage.setItem(KEY, 'true'); return; }

  for (let i = 0; i < allEntries.length; i += 499) {
    const batch = writeBatch(db);
    allEntries.slice(i, i + 499).forEach(entry => {
      batch.set(doc(collection(db, `users/${uid}/nutrition_logs`)), {
        ...entry, migratedAt: serverTimestamp(), source: entry.source ?? 'user_input',
      });
    });
    await batch.commit();
  }

  for (const k of legacyKeys) localStorage.removeItem(k);
  localStorage.setItem(KEY, 'true');
  console.log(`Migrated ${allEntries.length} entries for ${uid}`);
}
```

In `src/contexts/AuthContext.tsx`, call `migrateLocalStorageToFirestore(firebaseUser.uid)` after `createUserDocuments`.

**VERIFY:**
```bash
npx tsc --noEmit 2>&1 | grep "migration.ts"
# Must print nothing
```

---

## [ ] T1.14 — Verify TypeScript Path Alias

Open `tsconfig.json`. Confirm or add inside `compilerOptions`:

```json
"baseUrl": ".",
"paths": {
  "@/*": ["./src/*"]
}
```

**VERIFY:**
```bash
npx tsc --noEmit 2>&1 | grep -c "Cannot find module '@/"
# Must print 0 — no unresolved @/ imports
```

---

## [ ] T1.15 — Firebase Admin SDK Initialisation
> ⚠️ **MANUAL STEP — service account key required for local dev.**

Present to user:
1. Firebase console → Project settings → Service accounts
2. Click **Generate new private key** → download JSON
3. Do NOT commit this file
4. Add contents as a single-line string to `.env.local`:
   `FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}`

Create `src/lib/firebase/admin.ts`:

```typescript
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
```

Create `src/lib/firebase/verify-token.ts`:

```typescript
// src/lib/firebase/verify-token.ts
import { NextResponse } from 'next/server';
import { adminAuth } from './admin';

export async function verifyToken(request: Request): Promise<string | null> {
  try {
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) return null;
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

export const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

```bash
npm install firebase-admin
```

**VERIFY:**
```bash
npx tsc --noEmit 2>&1 | grep -E "admin\.ts|verify-token\.ts"
# Must print nothing
```

---

## [ ] T1.16 — Deploy Firebase Storage Rules

Create or replace `storage.rules`:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId
                         && (resource == null || resource.size < 10 * 1024 * 1024)
                         && (request.resource == null ||
                             request.resource.contentType.matches('image/.*') ||
                             request.resource.contentType == 'application/pdf');
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

```bash
npx firebase deploy --only storage
```

**VERIFY:**
```bash
npx firebase deploy --only storage 2>&1 | grep "Deploy complete"
# Must print "Deploy complete!"
```

---

## [ ] T1.17 — Fix `arrayUnion` in `logActivityEntry`

This task is already completed in T1.9 — the `firestore.ts` written in T1.9 uses `arrayUnion` and `arrayRemove` correctly. Confirm it is in place:

**VERIFY:**
```bash
grep "arrayUnion" src/lib/firebase/firestore.ts
# Must print a line containing "arrayUnion(entry.activityName)"

grep "arrayRemove" src/lib/firebase/firestore.ts
# Must print a line containing "arrayRemove(entry.activityName)"
```

---

## [ ] T1.18 — Next.js Route Protection Middleware

Create `src/middleware.ts` in the `src` directory (not inside `src/app`):

```typescript
// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_ROUTES      = ['/', '/login', '/signup', '/forgot-password'];
const PUBLIC_API_PREFIXES = ['/api/auth', '/api/health'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ROUTES.includes(pathname))                                    return NextResponse.next();
  if (PUBLIC_API_PREFIXES.some(p => pathname.startsWith(p)))               return NextResponse.next();
  if (pathname.startsWith('/_next') || pathname.includes('.'))             return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    if (!request.headers.get('Authorization')?.startsWith('Bearer '))
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.next();
  }

  const session = request.cookies.get('__session') ?? request.cookies.get('firebase_auth_token');
  if (!session) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

**VERIFY:**
```bash
ls src/middleware.ts
npx tsc --noEmit 2>&1 | grep "middleware.ts"
# Both: file exists + no TypeScript errors
```

---

## ✅ Phase 1 Complete When

All of these are true:

```bash
# 1. Zero TypeScript errors
npx tsc --noEmit
echo "Exit code: $?"   # Must be 0

# 2. All Firebase config files exist
ls firebase.json .firebaserc firestore.rules firestore.indexes.json storage.rules

# 3. Emulator starts clean
npx firebase emulators:start --only auth,firestore,storage 2>&1 | grep "All emulators ready"

# 4. Security: cross-user read blocked (test manually in Emulator UI)
echo "Manual: attempt to read users/other-uid/profile — must return permission-denied"
```

**Mark all Phase 1 tasks `[x]` in PROGRESS.md, then open PHASE_2_GEMINI.md.**
