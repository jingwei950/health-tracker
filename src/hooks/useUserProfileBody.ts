'use client';

import { useCallback, useEffect, useState } from 'react';

import { subscribeUserProfile, updateUserBodyMetrics } from '@/lib/firebase/firestore';
import type { UserProfile } from '@/types/health.types';

function metricFromProfile(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return null;
}

function pickBodyMetrics(profile: UserProfile | null) {
  if (!profile) return { weightKg: null as number | null, heightCm: null as number | null };
  return {
    weightKg: metricFromProfile(profile.weightKg),
    heightCm: metricFromProfile(profile.heightCm),
  };
}

export function useUserProfileBody(uid: string | null) {
  const [weightKg, setWeightKgState] = useState<number | null>(null);
  const [heightCm, setHeightCmState] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      /* Reset when signed out; uid is null outside subscribe callback */
      /* eslint-disable react-hooks/set-state-in-effect */
      setWeightKgState(null);
      setHeightCmState(null);
      setLoading(false);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }
    setLoading(true);
    return subscribeUserProfile(uid, (profile) => {
      const m = pickBodyMetrics(profile);
      setWeightKgState(m.weightKg);
      setHeightCmState(m.heightCm);
      setLoading(false);
    });
  }, [uid]);

  const setWeightKg = useCallback(
    async (w: number | null) => {
      setWeightKgState(w);
      if (uid) await updateUserBodyMetrics(uid, { weightKg: w });
    },
    [uid],
  );

  const setHeightCm = useCallback(
    async (h: number | null) => {
      setHeightCmState(h);
      if (uid) await updateUserBodyMetrics(uid, { heightCm: h });
    },
    [uid],
  );

  return { weightKg, heightCm, setWeightKg, setHeightCm, loading };
}
