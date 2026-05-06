// Server-side only — never import from client components or pages
// General web search fallback — HPB data is fetched directly via src/lib/search/hpb.ts
import { tavily } from '@tavily/core';

import {
  isNutritionSourceUrlBlocked,
  TAVILY_NUTRITION_EXCLUDE_DOMAINS,
} from './tavily-nutrition-blocklist';

if (!process.env.TAVILY_API_KEY) {
  throw new Error('TAVILY_API_KEY is not set in .env.local (must not have NEXT_PUBLIC_ prefix)');
}

const client = tavily({ apiKey: process.env.TAVILY_API_KEY! });

export interface TavilyResult {
  title:   string;
  url:     string;
  content: string;
  score:   number;
}

const NUTRITION_MAX_RESULTS = 5;

export async function searchNutrition(foodName: string): Promise<TavilyResult[]> {
  const response = await client.search(
    `${foodName} nutrition calories protein carbs fat Singapore`,
    {
      searchDepth:       'basic',
      maxResults:        12,
      includeRawContent: false,
      includeImages:     false,
      excludeDomains:    [...TAVILY_NUTRITION_EXCLUDE_DOMAINS],
    } as const,
  );
  return response.results
    .filter(r => !isNutritionSourceUrlBlocked(r.url))
    .slice(0, NUTRITION_MAX_RESULTS)
    .map(r => ({
      title:   r.title,
      url:     r.url,
      content: r.content,
      score:   r.score ?? 0,
    }));
}
