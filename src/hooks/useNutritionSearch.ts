'use client';
import { useState } from 'react';

export type SearchState = 'idle' | 'searching' | 'verifying' | 'ready' | 'error';

export interface VerifiedNutrition {
  foodName:         string;
  calories:         number;
  protein:          number;
  carbs:            number;
  fat:              number;
  servingSize:      number;
  servingUnit:      string;
  source:           string;
  sourceUrl:        string;
  dataVerified:     boolean;
  verificationNote: string;
}

export function useNutritionSearch() {
  const [state,  setState]  = useState<SearchState>('idle');
  const [result, setResult] = useState<VerifiedNutrition | null>(null);
  const [error,  setError]  = useState<string | null>(null);

  const search = async (query: string) => {
    setState('searching');
    setResult(null);
    setError(null);

    // Offline check — try cache only
    if (!navigator.onLine) {
      const cacheRes = await fetch(`/api/nutrition/search?q=${encodeURIComponent(query)}`).catch(() => null);
      if (cacheRes?.ok) {
        const cacheData = await cacheRes.json();
        if (cacheData.tier === 'cache' && cacheData.candidates.length > 0) {
          setResult({ ...cacheData.candidates[0], dataVerified: true, verificationNote: 'Cached result — offline mode' });
          setState('ready');
          return;
        }
      }
      setState('error');
      setError('You are offline. Previously searched foods may be available from cache.');
      return;
    }

    try {
      // Step 1: Fetch candidates
      const searchRes  = await fetch(`/api/nutrition/search?q=${encodeURIComponent(query)}`);
      const searchData = await searchRes.json();

      if (!searchData.candidates?.length) {
        setState('error');
        setError('No results found. Try a different spelling or enter manually.');
        return;
      }

      // Step 2: Gemini verification
      setState('verifying');
      const verifyRes  = await fetch('/api/nutrition/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query, candidates: searchData.candidates }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.ok) throw new Error(verifyData.error);

      setResult(verifyData.result);
      setState('ready');
    } catch (err: any) {
      setState('error');
      setError(err.message ?? 'Search failed. Please try again.');
    }
  };

  const reset = () => { setState('idle'); setResult(null); setError(null); };

  return { state, result, error, search, reset };
}
