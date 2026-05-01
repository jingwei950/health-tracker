import { getUserPreferences } from '@/lib/firebase/firestore';

export async function checkFirebaseAIConsent(uid: string): Promise<boolean> {
  const prefs = await getUserPreferences(uid);
  return prefs?.firebaseAIConsent ?? false;
}
