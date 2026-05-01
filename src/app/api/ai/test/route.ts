import { NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/gemini';
import { verifyToken, unauthorized } from '@/lib/firebase/verify-token';
import { checkFirebaseAIConsent } from '@/lib/ai/consent';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const uid = await verifyToken(request);
  if (!uid) return unauthorized();

  const hasConsent = await checkFirebaseAIConsent(uid);
  if (!hasConsent) return NextResponse.json({ error: 'firebaseAIConsent is false' }, { status: 403 });

  try {
    const response = await generateText('In one sentence, name one benefit of tracking daily nutrition.');
    return NextResponse.json({ ok: true, response });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
