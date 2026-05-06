import { describe, expect, it } from 'vitest';

import {
  isAbsoluteHttpUrl,
  resolveSourceUrlFromCandidates,
} from './nutrition-source-url';

describe('isAbsoluteHttpUrl', () => {
  it('accepts http and https', () => {
    expect(isAbsoluteHttpUrl('https://example.com/x')).toBe(true);
    expect(isAbsoluteHttpUrl('http://localhost:3000/')).toBe(true);
  });

  it('rejects relative paths and bare labels', () => {
    expect(isAbsoluteHttpUrl('HPB FoodID')).toBe(false);
    expect(isAbsoluteHttpUrl('/foo')).toBe(false);
    expect(isAbsoluteHttpUrl('')).toBe(false);
  });
});

describe('resolveSourceUrlFromCandidates', () => {
  const hpbUrl = 'https://pphtpc.hpb.gov.sg/web/sgfoodid/tools/food-search/details/abc123';

  it('keeps an absolute URL from the model', () => {
    expect(
      resolveSourceUrlFromCandidates(
        {
          source: 'HPB FoodID',
          foodName: 'Chicken Rice',
          sourceUrl: hpbUrl,
        },
        [{ foodName: 'Other', source: 'HPB FoodID', url: 'https://other.test/' }],
      ),
    ).toBe(hpbUrl);
  });

  it('replaces a bogus label with the HPB candidate URL matching source', () => {
    expect(
      resolveSourceUrlFromCandidates(
        {
          source: 'HPB FoodID',
          foodName: 'Chicken Rice',
          sourceUrl: 'HPB FoodID',
        },
        [
          {
            foodName: 'Chicken Rice',
            source: 'HPB FoodID',
            url:      hpbUrl,
          },
        ],
      ),
    ).toBe(hpbUrl);
  });

  it('falls back to food name when source differs', () => {
    expect(
      resolveSourceUrlFromCandidates(
        {
          source: 'Mislabeled',
          foodName: 'Chicken Rice',
          sourceUrl: '',
        },
        [{ foodName: 'Chicken Rice', source: 'HPB FoodID', url: hpbUrl }],
      ),
    ).toBe(hpbUrl);
  });

  it('uses the sole candidate URL when unambiguous', () => {
    expect(
      resolveSourceUrlFromCandidates(
        {
          source: 'x',
          foodName: 'y',
          sourceUrl: 'not a url',
        },
        [{ foodName: 'Chicken Rice', source: 'HPB FoodID', url: hpbUrl }],
      ),
    ).toBe(hpbUrl);
  });

  it('returns empty when URL cannot be recovered', () => {
    expect(
      resolveSourceUrlFromCandidates(
        {
          source: 'A',
          foodName: 'B',
          sourceUrl: 'bad',
        },
        [
          { foodName: 'X', source: 'S1', url: 'also-bad' },
          { foodName: 'Y', source: 'S2' },
        ],
      ),
    ).toBe('');
  });
});
