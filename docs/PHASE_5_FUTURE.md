# Phase 5 — Future Implementation

> ⛔ **Do not start any task in this file until all Phase 4 tasks are `[x]` in PROGRESS.md and the app is confirmed stable in production.**

This file documents every feature deferred from the V1.0 implementation. When the time comes, treat each item below as a self-contained mini-phase: read it, create task breakdown sub-tasks, update PROGRESS.md, and implement in order.

The Firestore schema, Firebase AI Logic integration, and Tavily pipeline from Phases 1–4 already support all of these without any data migration.

---

## Feature Reference Table

| ID | Feature | Depends on | Complexity |
|---|---|---|---|
| T5.1 | Gemma 4 On-Device AI | Phase 4 stable | High |
| T5.2 | Rule-Based Health Insights | Phase 1 | Low |
| T5.3 | Weekly Health Summary | Phase 2 | Medium |
| T5.4 | Natural Language Health Entry | Phase 2 | Medium |
| T5.5 | Trend Explanation | Phase 1 | Low–Medium |
| T5.6 | Health Question Answering | Phase 2 | Medium |
| T5.7 | Anomaly Alerts (Cloud Function) | Phase 1 | Medium |
| T5.8 | SaaS Tier Enforcement | Phase 1 | Medium |
| T5.9 | Vertex AI Migration | Phase 2 | Low |
| T5.10 | Gemma Function Calling for Nutrition | T5.1 | High |

---

## [ ] T5.1 — Gemma 4 On-Device AI (E2B / E4B)

**Why last:** Requires stable Phases 1–4 as the fallback path. Adds significant download size (500 MB – 1.5 GB). Only relevant for users on capable devices who explicitly opt in.

**Key steps when implementing:**
```bash
npm install @huggingface/transformers
```

- Model: `onnx-community/gemma-4-E2B-it-ONNX` (q4f16, ~500 MB) — default
- Model: `onnx-community/gemma-4-E4B-it-ONNX` (q4f16, ~1.5 GB) — high-capability devices only
- Load via Transformers.js with `device: 'webgpu'`, fall back to WASM
- **Never load on app startup** — gate behind a user-visible "Enable On-Device AI" button
- Load in a Web Worker to avoid blocking the main thread
- Cache in browser IndexedDB / Cache Storage after first download

**Device capability gate before offering E4B:**
```typescript
const canUseE4B = 'gpu' in navigator &&
                  (navigator as any).deviceMemory >= 6 &&
                  navigator.hardwareConcurrency >= 8;
```

**Preference field:** `preferLocalAI` in `users/{uid}/preferences/settings` — already in schema.  
**UI:** Show download progress bar (percentage). Show "On-Device AI active" badge once loaded.

---

## [ ] T5.2 — Rule-Based Health Insights

**Why deferred:** Delivers value without any model. Fast to implement once Phase 1 data is stable.

**Implementation notes:**

Create `src/lib/insights/rules.ts` with pure statistical functions over `DailySummary` data:

```typescript
// Compares latest value against N-day rolling average
export function trendInsight(metric: string, values: number[]): string {
  if (values.length < 3) return `Log more ${metric} data to see trends.`;
  const avg    = values.reduce((a, b) => a + b, 0) / values.length;
  const latest = values[values.length - 1];
  const delta  = ((latest - avg) / avg) * 100;
  if (delta < -10) return `Your ${metric} last session was ${Math.abs(delta).toFixed(0)}% below your recent average.`;
  if (delta >  10) return `Your ${metric} last session was ${Math.abs(delta).toFixed(0)}% above your recent average — great work!`;
  return `Your ${metric} is consistent with your recent average.`;
}
```

Render insights in the Dashboard below the macro bars. Each insight is computed client-side from `useDailySummary` or last-7-days summaries — no API call.

Store computed insights to `users/{uid}/insights/{id}` with `source: 'rule_based'` for history.

---

## [ ] T5.3 — Weekly Health Summary

**Why deferred:** Requires stable Phase 2 (Firebase AI Logic) and a Cloud Function.

**Implementation notes:**

- **Trigger:** Cloud Function on schedule (Sunday 20:00 UTC) OR user taps "Generate Summary" button
- **Input:** Last 7 days of `daily_summaries` documents for the user
- **Output:** 3–5 sentence plain-English summary stored in `users/{uid}/insights/{id}` with `type: 'weekly_summary'`
- **Model:** Firebase AI Logic (Gemini) — same client as Phase 2
- **Prompt template:**
  ```
  You are a helpful health assistant. Summarise these 7 days of health data in 3–5 sentences.
  Highlight patterns, improvements, and one actionable suggestion. Do not mention names.
  Data: [JSON of last 7 daily summaries]
  ```
- **Cloud Function:** Add `weeklyHealthSummary` to `functions/index.js` using `pubsub.schedule`

---

## [ ] T5.4 — Natural Language Health Entry

**Why deferred:** Requires Phase 2 stable. High user value but needs careful JSON parsing.

**Implementation notes:**

- Add a text input to the Dashboard or a dedicated "Quick Log" button
- User types e.g. "I slept 7.5 hours last night and felt rested"
- Send to a new API route `/api/ai/parse-entry`
- Gemini returns structured JSON matching `NutritionLog`, `ActivityLog`, or `SleepLog` schema
- Show the parsed result as a review card (reuse `FoodReviewCard` pattern)
- User confirms or edits before writing to Firestore

**Key requirement:** If Gemini cannot determine the entry type, show manual entry fields rather than erroring.

---

## [ ] T5.5 — Trend Explanation

**Why deferred:** T5.2 rule-based trends are the prerequisite. This adds AI-generated natural language on top.

**Implementation notes:**

- For each metric with >= 5 data points from `daily_summaries`, compute a trend direction: `'improving' | 'stable' | 'declining'`
- Pass the trend direction and last 7 values to Gemini for a 1–2 sentence explanation
- Display the AI note below the trend chart
- Show source badge: "AI insight" vs "Statistical"

---

## [ ] T5.6 — Health Question Answering

**Why deferred:** Requires Phase 2 stable and careful data scoping to avoid hallucination.

**Key requirement from FRD:**
> Responses MUST be grounded only in the user's actual data. The AI MUST NOT hallucinate data points not present in the Firestore query results.

**Implementation notes:**

- Add a chat input to a dedicated Insights page
- Parse the user's question to determine which Firestore collections to query (date range, metric type)
- Query Firestore for the relevant data (max 90 days)
- Include query results as context in the Gemini prompt
- Gemini answers only from the provided data
- Limit context to avoid token overflow: 90-day window maximum

---

## [ ] T5.7 — Anomaly Alerts

**Why deferred:** Requires Phase 1 stable Firestore data. Runs server-side only.

**Implementation notes:**

Add to `functions/index.js`:

```javascript
exports.dailyAnomalyCheck = onSchedule('0 6 * * *', async () => {
  // For each user, query last 37 days of daily_summaries
  // Compute mean and standard deviation for sleep and vitals over 30 days
  // If latest value deviates > 2 SD: write anomaly insight to insights subcollection
  // If notificationsEnabled: send FCM notification
});
```

Anomaly insight document: `type: 'anomaly'`, `source: 'rule_based'`

---

## [ ] T5.8 — SaaS Tier Enforcement

**Why deferred:** Requires stable production data before monetisation decisions are finalised.

**Implementation notes:**

- `subscriptionTier` in `users/{uid}/profile` is already seeded as `'free'`
- It can only be written by Cloud Functions (Admin SDK) — the Firestore rule already blocks client writes
- Add tier limit checks to Cloud Functions before expensive operations:
  ```javascript
  const profile = await db.doc(`users/${uid}/profile`).get();
  const tier    = profile.data().subscriptionTier;
  if (tier === 'free' && monthlyCalls >= 500) {
    throw new Error('Monthly AI limit reached — upgrade to Pro');
  }
  ```
- Free tier limits per FRD: 500 Firebase AI Logic calls/month, 30-day data retention
- Do not implement billing or Stripe in this phase — just the enforcement gates

---

## [ ] T5.9 — Vertex AI Migration

**Why deferred:** Only needed when the Gemini Developer API free tier is insufficient for production scale.

**Why this is low effort:** It is literally one init line change.

In `src/lib/ai/gemini.ts`, change:

```typescript
// FROM (Gemini Developer API — free tier):
import { getAI, GoogleAIBackend } from 'firebase/ai';
const ai = getAI(app, { backend: new GoogleAIBackend() });

// TO (Vertex AI Gemini API — pay-as-you-go, enterprise):
import { getAI, VertexAIBackend } from 'firebase/ai';
const ai = getAI(app, { backend: new VertexAIBackend() });
```

No other code changes required. The `getGeminiModel()`, `generateText()`, and `generateWithTools()` functions all remain identical.

**Prerequisites before switching:**
- Project must be on the Firebase Blaze (pay-as-you-go) plan
- Vertex AI API must be enabled in Google Cloud console
- Budget alerts should be configured in GCP

---

## [ ] T5.10 — Gemma 4 Function Calling for Nutrition

**Why deferred:** Depends on T5.1 (Gemma on-device) being stable first.

**What it does:** For users who have opted in to `preferLocalAI`, replace the `/api/nutrition/verify` Gemini call with an on-device Gemma 4 function calling loop. Tavily search still runs server-side; only the verification step moves to the device.

**Benefit:** Zero Gemini API credits consumed for verification. Fully private — verified result never leaves the device.

**Implementation:** Mirror the existing Gemini function calling flow from Phase 2 using the Gemma 4 client from T5.1. The `FoodReviewCard` component, `logFoodEntry` write, and macro sanity check are all unchanged.

---

*End of Phase 5 reference. Return to PROGRESS.md to track when these are started.*
