import { NextResponse } from "next/server";

import {
  foodSearchSystemPrompt,
  parseFoodResponseText,
} from "@/lib/health-track/parse-food-response";
import type { FoodSearchResult } from "@/lib/health-track/types";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

type AnthropicContentBlock = {
  type: string;
  text?: string;
};

type AnthropicMessagesResponse = {
  content?: AnthropicContentBlock[];
  error?: { message?: string; type?: string };
};

function extractTextFromMessage(data: AnthropicMessagesResponse): string {
  const blocks = data.content ?? [];
  return blocks
    .filter((b): b is AnthropicContentBlock & { text: string } => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("");
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const q =
    typeof body === "object" && body !== null && "query" in body
      ? String((body as { query: unknown }).query ?? "").trim()
      : "";
  if (!q) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is not configured for food search (missing ANTHROPIC_API_KEY)." },
      { status: 503 },
    );
  }

  const model =
    process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";

  const payload = {
    model,
    max_tokens: 1024,
    system: foodSearchSystemPrompt,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [
      {
        role: "user" as const,
        content: `Nutritional information for: ${q}`,
      },
    ],
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  };
  const beta = process.env.ANTHROPIC_BETA_HEADERS;
  if (beta) {
    headers["anthropic-beta"] = beta;
  }

  let res: Response;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach nutrition service. Try again." },
      { status: 502 },
    );
  }

  const raw = (await res.json()) as AnthropicMessagesResponse;

  if (!res.ok) {
    const msg =
      raw.error?.message ??
      (typeof raw === "object" && raw !== null ? JSON.stringify(raw) : "API error");
    return NextResponse.json(
      { error: msg.length > 200 ? "Nutrition lookup failed." : msg },
      { status: res.status >= 400 && res.status < 600 ? res.status : 502 },
    );
  }

  const text = extractTextFromMessage(raw);
  if (!text.trim()) {
    return NextResponse.json(
      { error: "No text response from model. Try again." },
      { status: 502 },
    );
  }

  let result: FoodSearchResult;
  try {
    result = parseFoodResponseText(text);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid response from nutrition service.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ result });
}
