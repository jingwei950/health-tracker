/**
 * Domains excluded from nutrition web search: UGC / social and video pages that
 * are not usable as macro references. Passed to Tavily as `excludeDomains` and
 * applied again after search in case the API still returns a match.
 */
export const TAVILY_NUTRITION_EXCLUDE_DOMAINS: readonly string[] = [
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'pinterest.com',
  'reddit.com',
  'snapchat.com',
  'threads.net',
  'tumblr.com',
  'youtube.com',
  'youtu.be',
];

export function isNutritionSourceUrlBlocked(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return TAVILY_NUTRITION_EXCLUDE_DOMAINS.some(
      d => host === d || host.endsWith(`.${d}`),
    );
  } catch {
    return true;
  }
}
