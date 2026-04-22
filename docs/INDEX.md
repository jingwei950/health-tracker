# HealthTrack SG — Agent Task Index

**Project:** HealthTrack SG  
**Stack:** Next.js (App Router) · TypeScript · Firebase · Firebase AI Logic (Gemini) · Tavily · Gemma 4 (Phase 5)  
**FRD Version:** 1.6  
**Task Doc Version:** 1.1

---

## START HERE — HOW TO USE THIS DOCUMENT SET

You are an AI agent implementing the HealthTrack SG project. Read this entire INDEX.md before opening any phase file. It tells you everything you need to know to navigate the task set.

### Rules you must follow

1. **Read PROGRESS.md first** before starting any work. It shows which tasks are already done.
2. **Complete phases in order.** Do not open Phase 2 until all Phase 1 tasks are checked off.
3. **Every task has a VERIFY block.** Do not mark a task done until its VERIFY passes.
4. **Mark tasks done** by changing `[ ]` to `[x]` in PROGRESS.md when the VERIFY passes.
5. **Tokens marked `[REPLACE:...]`** are the only things you cannot auto-fill. Stop and ask the user for those values.
6. **Manual steps** are clearly labelled. Present the instructions to the user and wait before continuing.
7. **Never expose `TAVILY_API_KEY`** in client-side code. It must stay server-side only.

---

## FILES IN THIS TASK SET

| File | Purpose | Read when |
|---|---|---|
| `INDEX.md` | ← You are here. Master overview and navigation | First, always |
| `PROGRESS.md` | Checkbox tracker — one line per task | Before starting; update after each VERIFY |
| `PHASE_1_FIREBASE.md` | Tasks T1.1–T1.18 — Firebase setup | When starting Phase 1 |
| `PHASE_2_GEMINI.md` | Tasks T2.1–T2.7 — Firebase AI Logic + Gemini | After Phase 1 complete |
| `PHASE_3_TAVILY.md` | Tasks T3.1–T3.5 — Tavily search layer | After Phase 2 complete |
| `PHASE_4_INTEGRATION.md` | Tasks T4.1–T4.11 — End-to-end integration + smoke test | After Phase 3 complete |
| `PHASE_5_FUTURE.md` | Future features reference — Gemma 4, summaries, Q&A | Do not start until Phase 4 all green |

---

## PHASE OVERVIEW

### Phase 1 — Firebase Installation and Setup
**18 tasks · T1.1 → T1.18**  
Goal: The existing Next.js app is fully connected to Firebase. Auth, Firestore, Storage, Security Rules, Cloud Functions emulator, and the full data layer are working locally before anything AI-related is touched.

**Manual steps required:** T1.1 (Firebase project creation), T1.15 (service account key)  
**Done when:** `npx tsc --noEmit` exits 0 · Emulator starts on all 4 ports · Test sign-in creates Firestore user doc · Cross-user read returns permission-denied

---

### Phase 2 — Firebase AI Logic (Gemini) Setup
**7 tasks · T2.1 → T2.7**  
Goal: Firebase AI Logic is installed. A real Gemini API call works through the Firebase proxy. Function calling is confirmed working. No Tavily, no Gemma involved.

**Manual steps required:** T2.1 (enable Gemini Developer API in Firebase console)  
**Done when:** `/api/ai/test` returns real Gemini text · `/api/ai/test-tools` returns `functionName: "get_nutrition_data"` · Consent gate returns 403 when disabled

---

### Phase 3 — Tavily Installation and Setup
**5 tasks · T3.1 → T3.5**  
Goal: Tavily is installed server-side only. The 3-tier nutrition search route works. The Firestore nutrition cache is functional. No UI wiring yet — pure data pipeline.

**Manual steps required:** T3.1 (Tavily sign-up and API key)  
**Done when:** `GET /api/nutrition/search?q=Chicken+Rice` returns `tier: "local_hpb"` · `GET /api/nutrition/search?q=Avocado+Toast` returns `tier: "tavily"` · `TAVILY_API_KEY` absent from all browser network requests

---

### Phase 4 — End-to-End Integration and Testing
**11 tasks · T4.1 → T4.11**  
Goal: The complete food search pipeline works — Tavily → Gemini verification → user review card → Firestore write. Real-time UI updates. Delete wiring. Full smoke test.

**Manual steps required:** T4.6 (privacy network inspection in browser DevTools), T4.11 step 7 (console error check)  
**Done when:** All 8 smoke test checks in T4.11 pass

---

### Phase 5 — Future Implementation
**Reference only — do not implement until Phase 4 is confirmed stable in production**  
Contains: Gemma 4 on-device AI, rule-based insights, weekly summaries, health Q&A, anomaly alerts, SaaS tier enforcement, Vertex AI migration.

---

## PREREQUISITES CHECKLIST

Run these before Task T1.1. If any fail, stop and report to the user.

```bash
node --version      # Must be >= 18.0.0
ls package.json     # Must exist — confirms you are in the project root
ls tsconfig.json    # Must exist — confirms TypeScript is configured
ls src/             # Must exist — confirms Next.js src directory structure
```

---

## ALL FILES CREATED BY THIS TASK SET

```
src/
├── app/
│   ├── api/
│   │   ├── ai/
│   │   │   ├── test/route.ts              ← T2.4, T2.7
│   │   │   └── test-tools/route.ts        ← T2.6
│   │   └── nutrition/
│   │       ├── search/route.ts            ← T3.5
│   │       └── verify/route.ts            ← T4.1, T2.7
│   └── layout.tsx                         ← T1.10 (modified — add AuthProvider)
├── components/
│   └── nutrition/
│       └── FoodReviewCard.tsx             ← T4.4
├── contexts/
│   └── AuthContext.tsx                    ← T1.10
├── data/
│   └── sg-foods.json                      ← T3.4
├── hooks/
│   ├── useAuth.ts                         ← T1.7
│   ├── useDailySummary.ts                 ← T4.10
│   ├── useNutritionSearch.ts              ← T4.3, T4.7
│   └── useTodayLogs.ts                    ← T4.8
├── lib/
│   ├── ai/
│   │   ├── consent.ts                     ← T2.5
│   │   └── gemini.ts                      ← T2.3
│   ├── firebase/
│   │   ├── admin.ts                       ← T1.15
│   │   ├── auth.ts                        ← T1.7
│   │   ├── config.ts                      ← T1.4, T1.11
│   │   ├── firestore.ts                   ← T1.9, T1.17, T4.8
│   │   ├── migration.ts                   ← T1.13
│   │   └── verify-token.ts               ← T2.7
│   └── search/
│       ├── sg-foods.ts                    ← T3.4
│       └── tavily.ts                      ← T3.3
├── middleware.ts                          ← T1.18
└── types/
    └── health.types.ts                    ← T1.8

functions/
└── index.js                               ← T1.12

.env.local                                 ← T1.3, T1.11, T1.15, T3.1
firestore.rules                            ← T1.5
firestore.indexes.json                     ← T1.6
storage.rules                              ← T1.16
```

---

## ENVIRONMENT VARIABLES REFERENCE

| Variable | Phase | Has `NEXT_PUBLIC_`? | Who uses it |
|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | T1.3 | ✅ Yes | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | T1.3 | ✅ Yes | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | T1.3 | ✅ Yes | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | T1.3 | ✅ Yes | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | T1.3 | ✅ Yes | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | T1.3 | ✅ Yes | Firebase client SDK |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` | T1.11 | ✅ Yes | Emulator connect (dev only) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | T1.15 | ❌ No | Admin SDK — server only |
| `TAVILY_API_KEY` | T3.1 | ❌ No — CRITICAL | Tavily client — server only |

> ⚠️ **`TAVILY_API_KEY` must never have a `NEXT_PUBLIC_` prefix.** This is verified in T3.1 and T4.11.

---

## KEY DECISIONS TO REMEMBER

- **Firebase AI Logic is the default AI path.** Gemma 4 is opt-in and Phase 5 only.
- **Nutrition verification priority:** Local HPB JSON (instant) → Firestore cache → Tavily → Open Food Facts.
- **Single HPB match skips Gemini entirely** — no API call, written as `dataVerified: true` immediately.
- **All Tavily calls happen server-side** in API routes. The browser never calls Tavily directly.
- **Macro sanity check overrides Gemini** — if `|(P×4 + C×4 + F×9) - calories| / calories > 20%`, `dataVerified` is forced to `false` regardless of what Gemini says.
- **Batch writes keep daily_summaries in sync** — every `logFoodEntry` and `logActivityEntry` uses a Firestore batch to update the summary atomically. Delete operations reverse the increment.
- **`arrayUnion`/`arrayRemove` must be used** for the `activities` array in `daily_summaries` — never overwrite it directly.

---

## MANUAL STEPS SUMMARY

There are exactly 4 moments where you must pause and involve the user:

| Task | What the user must do | What you need back |
|---|---|---|
| T1.1 | Create Firebase project in console | `firebaseConfig` object (6 values) |
| T1.15 | Download service account JSON from Firebase console | JSON contents as single-line string |
| T2.1 | Enable Gemini Developer API in Firebase console | Confirmation it's active |
| T3.1 | Sign up at tavily.com | API key starting with `tvly-` |

---

*Begin with PROGRESS.md to check current status, then open the relevant phase file.*
