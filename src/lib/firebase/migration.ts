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
