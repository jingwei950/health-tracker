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
