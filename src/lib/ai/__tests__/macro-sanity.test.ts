import { describe, expect, it } from 'vitest';
import { macroSanityCheck } from '@/lib/ai/macro-sanity';

describe('Macro sanity check — 20% tolerance', () => {
  it('passes for valid Chicken Rice macros (607 kcal)', () => {
    expect(macroSanityCheck(32, 78, 18, 607)).toBe(true);
  });

  it('fails when calories are grossly incorrect', () => {
    expect(macroSanityCheck(32, 78, 18, 200)).toBe(false);
  });

  it('fails when more than 20% over estimated', () => {
    const est  = (32 * 4) + (78 * 4) + (18 * 9);   // 602
    const over = Math.round(est * 1.25);
    expect(macroSanityCheck(32, 78, 18, over)).toBe(false);
  });

  it('passes at exactly 20% boundary', () => {
    const est      = (32 * 4) + (78 * 4) + (18 * 9);
    const boundary = Math.round(est * 1.20);
    expect(macroSanityCheck(32, 78, 18, boundary)).toBe(true);
  });
});
