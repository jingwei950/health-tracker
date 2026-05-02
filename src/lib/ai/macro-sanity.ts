// src/lib/ai/macro-sanity.ts
export function macroSanityCheck(p: number, c: number, f: number, cal: number): boolean {
  if (cal <= 0) return false;
  const est = p * 4 + c * 4 + f * 9;
  return Math.abs(est - cal) / cal <= 0.20;
}
