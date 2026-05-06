import { describe, expect, it } from 'vitest';

import {
  isNutritionSourceUrlBlocked,
  TAVILY_NUTRITION_EXCLUDE_DOMAINS,
} from './tavily-nutrition-blocklist';

describe('isNutritionSourceUrlBlocked', () => {
  it('blocks instagram and subdomains', () => {
    expect(isNutritionSourceUrlBlocked('https://www.instagram.com/p/abc/')).toBe(true);
    expect(isNutritionSourceUrlBlocked('https://l.instagram.com/foo')).toBe(true);
  });

  it('blocks other UGC hosts', () => {
    expect(isNutritionSourceUrlBlocked('https://tiktok.com/@x/video/1')).toBe(true);
    expect(isNutritionSourceUrlBlocked('https://www.reddit.com/r/sg/comments/1')).toBe(true);
    expect(isNutritionSourceUrlBlocked('https://youtu.be/abc')).toBe(true);
  });

  it('allows normal reference sites', () => {
    expect(isNutritionSourceUrlBlocked('https://www.healthhub.sg/eat-sleep-store/healthy-eating')).toBe(
      false,
    );
    expect(isNutritionSourceUrlBlocked('https://fdc.nal.usda.gov/')).toBe(false);
    expect(isNutritionSourceUrlBlocked('https://pphtpc.hpb.gov.sg/web/sgfoodid/')).toBe(false);
  });

  it('domain list has no duplicates', () => {
    expect(new Set(TAVILY_NUTRITION_EXCLUDE_DOMAINS).size).toBe(
      TAVILY_NUTRITION_EXCLUDE_DOMAINS.length,
    );
  });
});
