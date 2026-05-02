// Server-side only — never import from client components or pages
// General web search fallback — HPB data is fetched directly via src/lib/search/hpb.ts
import { tavily } from '@tavily/core';

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

export async function searchNutrition(foodName: string): Promise<TavilyResult[]> {
  const response = await client.search(
    `${foodName} nutrition calories protein carbs fat Singapore`,
    {
      searchDepth:       'basic',
      maxResults:        5,
      includeRawContent: false,
      includeImages:     false,
    } as const,
  );
  return response.results.map(r => ({
    title:   r.title,
    url:     r.url,
    content: r.content,
    score:   r.score ?? 0,
  }));
}
