/** Shape needed to recover a canonical source URL from search results. */
export type SourceUrlCandidate = {
  foodName: string;
  source: string;
  url?: string;
};

/** True if the string is safe to use as an external link href (absolute http(s)). */
export function isAbsoluteHttpUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim());
}

/**
 * If the model returned a non-URL (e.g. source label "HPB FoodID"), recover the real
 * URL from the matching search candidate so browsers do not resolve relative paths on the app origin.
 */
export function resolveSourceUrlFromCandidates(
  parsed: { source: string; foodName: string; sourceUrl: string },
  candidates: SourceUrlCandidate[],
): string {
  const trimmed = (parsed.sourceUrl ?? '').trim();
  if (isAbsoluteHttpUrl(trimmed)) return trimmed;

  const norm = (x: string) => x.trim().toLowerCase();
  const src = norm(parsed.source);
  const fn = norm(parsed.foodName);

  for (const c of candidates) {
    if (c.url && isAbsoluteHttpUrl(c.url) && norm(c.source) === src)
      return c.url.trim();
  }
  for (const c of candidates) {
    if (c.url && isAbsoluteHttpUrl(c.url) && norm(c.foodName) === fn)
      return c.url.trim();
  }

  const withUrl = candidates.filter(c => c.url && isAbsoluteHttpUrl(c.url));
  if (withUrl.length === 1) return withUrl[0].url!.trim();

  return '';
}
