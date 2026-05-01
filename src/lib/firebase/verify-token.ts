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
