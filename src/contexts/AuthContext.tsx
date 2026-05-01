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
        try {
          const { migrateLocalStorageToFirestore } = await import('@/lib/firebase/migration');
          await migrateLocalStorageToFirestore(firebaseUser.uid);
        } catch { /* no legacy data */ }
      }
      setUser(firebaseUser);
      setLoading(false);
    });
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => useContext(AuthContext);
