# Phase 2 — Firebase AI Logic (Gemini) Setup

**Goal:** Firebase AI Logic is installed. A real Gemini API response is confirmed through the Firebase proxy. Function calling works. Consent gate enforces `firebaseAIConsent`. No Tavily or Gemma involved.

**Prerequisite:** All Phase 1 tasks must be `[x]` in PROGRESS.md before starting.  
**Tasks:** T2.1 → T2.7  
**Mark progress in:** PROGRESS.md

---

## [ ] T2.1 — Enable Gemini Developer API
> ⚠️ **MANUAL STEP — Firebase console action required.**

Present to the user and wait for confirmation:

1. Open https://console.firebase.google.com → select your project
2. Go to **Build → AI Logic** (use the search bar if needed)
3. Click **Get started**
4. Select **Gemini Developer API** (not Vertex AI — this is the free tier)
5. Firebase enables the API and configures the proxy automatically
6. No API key is shown or needed — Firebase manages it via App Check

**VERIFY:** User confirms "Firebase AI Logic" shows as active in the console with "Gemini Developer API" selected.

---

## [ ] T2.2 — Confirm Firebase AI SDK Version

The `firebase` package already includes `firebase/ai`. Confirm the version is sufficient:

```bash
node -e "const v = require('./node_modules/firebase/package.json').version; console.log('firebase:', v)"
# Must be >= 10.12.0

# If below 10.12.0, upgrade:
npm install firebase@latest

# Confirm the module resolves
node -e "require('firebase/ai'); console.log('firebase/ai OK')"
# Must print: firebase/ai OK
```

**VERIFY:**
```bash
node -e "require('firebase/ai'); console.log('OK')" 2>&1
# Must print: OK
```

---

## [ ] T2.3 — Create Firebase AI Logic Client

Create `src/lib/ai/gemini.ts`:

```typescript
// src/lib/ai/gemini.ts
// Used in Next.js API routes (server-side) only.
// Never import from client components.
import { getAI, GoogleAIBackend } from 'firebase/ai';
import app from '@/lib/firebase/config';

const ai = getAI(app, { backend: new GoogleAIBackend() });

export function getGeminiModel(modelName = 'gemini-2.5-flash-lite') {
  return ai.getGenerativeModel({ model: modelName });
}

export async function generateText(prompt: string, modelName?: string): Promise<string> {
  const model  = getGeminiModel(modelName);
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateWithTools(prompt: string, tools: object[], modelName?: string) {
  const model = getGeminiModel(modelName);
  return model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    tools:    tools as any,
  });
}
```

**VERIFY:**
```bash
npx tsc --noEmit 2>&1 | grep "gemini.ts"
# Must print nothing
```

---

## [ ] T2.4 — Create Test API Route

Create `src/app/api/ai/test/route.ts`:

```typescript
// src/app/api/ai/test/route.ts
import { NextResponse } from 'next/server';
import { generateText }     from '@/lib/ai/gemini';
import { verifyToken, unauthorized } from '@/lib/firebase/verify-token';
import { checkFirebaseAIConsent }    from '@/lib/ai/consent';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const uid = await verifyToken(request);
  if (!uid) return unauthorized();

  const hasConsent = await checkFirebaseAIConsent(uid);
  if (!hasConsent) return NextResponse.json({ error: 'firebaseAIConsent is false' }, { status: 403 });

  try {
    const response = await generateText('In one sentence, name one benefit of tracking daily nutrition.');
    return NextResponse.json({ ok: true, response });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
```

**VERIFY:**
```bash
# With dev server running (npm run dev):
curl http://localhost:3000/api/ai/test
# Expected: {"error":"Unauthorized"}   ← confirms auth gate works

# With a valid Bearer token (get from browser after signing in):
# curl -H "Authorization: Bearer <token>" http://localhost:3000/api/ai/test
# Expected: {"ok":true,"response":"...some Gemini-generated text..."}
```

---

## [ ] T2.5 — Confirm Consent Gate

Create `src/lib/ai/consent.ts`:

```typescript
// src/lib/ai/consent.ts
import { getUserPreferences } from '@/lib/firebase/firestore';

export async function checkFirebaseAIConsent(uid: string): Promise<boolean> {
  const prefs = await getUserPreferences(uid);
  return prefs?.firebaseAIConsent ?? false;
}
```

**VERIFY:**
```bash
npx tsc --noEmit 2>&1 | grep "consent.ts"
# Must print nothing

# Functional test: In Firestore Emulator UI, set firebaseAIConsent to false for a test user
# Then call the test route with that user's token
# Expected: {"error":"firebaseAIConsent is false"}  (HTTP 403)
```

---

## [ ] T2.6 — Test Function Calling

Create `src/app/api/ai/test-tools/route.ts`:

```typescript
// src/app/api/ai/test-tools/route.ts
import { NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/ai/gemini';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const model = getGeminiModel();
    const tools = [{
      functionDeclarations: [{
        name:        'get_nutrition_data',
        description: 'Retrieve nutritional information for a food item',
        parameters: {
          type: 'object',
          properties: {
            food_name: { type: 'string', description: 'Name of the food item' },
          },
          required: ['food_name'],
        },
      }],
    }];

    const result   = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Get nutrition data for Chicken Rice' }] }],
      tools:    tools as any,
    });
    const content  = result.response.candidates?.[0]?.content;
    const toolCall = content?.parts?.find((p: any) => p.functionCall);

    return NextResponse.json({
      ok:           !!toolCall,
      functionName: toolCall?.functionCall?.name ?? null,
      functionArgs: toolCall?.functionCall?.args ?? null,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
```

**VERIFY:**
```bash
# With dev server running:
curl http://localhost:3000/api/ai/test-tools
# Expected: {"ok":true,"functionName":"get_nutrition_data","functionArgs":{"food_name":"Chicken Rice"}}
# functionName must be exactly "get_nutrition_data" — confirms function calling works
```

---

## [ ] T2.7 — Fix Admin SDK Usage Across All API Routes

Ensure every API route uses `adminAuth` from `src/lib/firebase/admin.ts` via `src/lib/firebase/verify-token.ts`. No route should import directly from `firebase-admin`.

```bash
# Find any direct firebase-admin imports that should use the singleton instead
grep -r "from 'firebase-admin/auth'" src/app/api/ 2>/dev/null
# Must print nothing — all routes use verify-token.ts
```

If any files are found, update them:

```typescript
// REMOVE direct firebase-admin imports like:
// import { getAuth } from 'firebase-admin/auth';
// import { initializeApp } from 'firebase-admin/app';

// REPLACE with:
import { verifyToken, unauthorized } from '@/lib/firebase/verify-token';

// REPLACE all token verification with:
const uid = await verifyToken(request);
if (!uid) return unauthorized();
```

**VERIFY:**
```bash
grep -r "from 'firebase-admin/auth'" src/app/api/ 2>/dev/null
# Must print nothing

npx tsc --noEmit 2>&1 | grep -E "admin\.ts|verify-token\.ts"
# Must print nothing
```

---

## ✅ Phase 2 Complete When

All 4 of these pass:

```bash
# 1. No TypeScript errors
npx tsc --noEmit && echo "TypeScript OK"

# 2. Test route returns real Gemini text (requires valid auth token)
# curl -H "Authorization: Bearer <token>" http://localhost:3000/api/ai/test
# Expected: {"ok":true,"response":"..."}

# 3. Function calling confirmed
curl http://localhost:3000/api/ai/test-tools | grep '"functionName":"get_nutrition_data"'
# Must match

# 4. No direct firebase-admin/auth imports in API routes
grep -r "from 'firebase-admin/auth'" src/app/api/ 2>/dev/null | wc -l
# Must print 0
```

**Mark all Phase 2 tasks `[x]` in PROGRESS.md, then open PHASE_3_TAVILY.md.**
