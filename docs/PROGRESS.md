# HealthTrack SG — Task Progress Tracker

**Instructions for the agent:** Change `[ ]` to `[x]` when a task's VERIFY block passes. Never mark a task done before its VERIFY. Update this file after every completed task.

**Instructions for the user:** This file shows the current implementation status. Tasks marked `[x]` are complete and verified. Tasks marked `[ ]` are pending.

---

## Prerequisites

- [x] `node --version` >= 18.0.0
- [x] `package.json` exists in project root
- [x] `tsconfig.json` exists
- [x] `src/` directory exists

---

## Phase 1 — Firebase Installation and Setup

- [x] **T1.1** — Create Firebase Project *(manual — user action required)*
- [x] **T1.2** — Install Firebase SDK and CLI
- [x] **T1.3** — Create Environment Variables
- [x] **T1.4** — Create Firebase Config Singleton
- [x] **T1.5** — Deploy Firestore Security Rules
- [x] **T1.6** — Create Firestore Indexes
- [x] **T1.7** — Implement Authentication
- [x] **T1.8** — Create TypeScript Types
- [x] **T1.9** — Implement Firestore Data Layer
- [x] **T1.10** — Create Auth Context Provider
- [x] **T1.11** — Set Up Firebase Emulator
- [x] **T1.12** — Create Cloud Function: New User Setup
- [x] **T1.13** — LocalStorage Migration Script
- [x] **T1.14** — Verify TypeScript Path Alias
- [ ] **T1.15** — Firebase Admin SDK Initialisation *(deferred — future implementation)*
- [ ] **T1.16** — Deploy Firebase Storage Rules *(deferred — future implementation)*
- [x] **T1.17** — Fix `arrayUnion` in `logActivityEntry`
- [x] **T1.18** — Next.js Route Protection Middleware

**Phase 1 gate:** T1.15 and T1.16 are deferred to future implementation — Phase 2 may proceed.

---

## Phase 2 — Firebase AI Logic (Gemini) Setup

- [x] **T2.1** — Enable Gemini Developer API *(manual — Firebase console action required)*
- [x] **T2.2** — Install Firebase AI SDK
- [x] **T2.3** — Create Firebase AI Logic Client
- [x] **T2.4** — Create Test API Route
- [x] **T2.5** — Confirm Consent Gate
- [x] **T2.6** — Test Function Calling
- [x] **T2.7** — Fix Admin SDK Usage Across All API Routes

**Phase 2 gate:** All 7 tasks above must be `[x]` before opening PHASE_3_TAVILY.md

---

## Phase 3 — Tavily Installation and Setup

- [x] **T3.1** — Get Tavily API Key *(manual — tavily.com sign-up required)*
- [x] **T3.2** — Install Tavily SDK
- [x] **T3.3** — Create Tavily Client
- [x] **T3.4** — Build the 3-Tier Nutrition Search Route

**Phase 3 gate:** All 4 tasks above must be `[x]` before opening PHASE_4_INTEGRATION.md

---

## Phase 4 — End-to-End Integration and Testing

- [x] **T4.1** — Build the Nutrition Verification Route
- [x] **T4.2** — Macro Sanity Check Unit Test
- [x] **T4.3** — Build the Nutrition Search Hook
- [x] **T4.4** — Build the Food Review Card Component
- [x] **T4.5** — Wire Search into Nutrition Tab
- [ ] **T4.6** — Privacy Network Inspection Test *(manual — browser DevTools inspection)*
- [ ] **T4.7** — Offline Degradation Test
- [x] **T4.8** — Real-Time Nutrition Log Display Hook
- [x] **T4.9** — Delete Entry UI Wiring
- [x] **T4.10** — Dashboard Real-Time Summary Wiring
- [ ] **T4.11** — Final End-to-End Smoke Test *(partial manual — browser console check)*

**Phase 4 gate:** All 11 tasks above must be `[x]` — implementation is complete

---

## Phase 5 — Future Implementation

> Do not start any Phase 5 work until all Phase 4 tasks are `[x]` and the app is confirmed stable.

- [ ] **T5.1** — Gemma 4 On-Device AI (E2B/E4B)
- [ ] **T5.2** — Rule-Based Health Insights
- [ ] **T5.3** — Weekly Health Summary (Gemini + Cloud Function)
- [ ] **T5.4** — Natural Language Health Entry
- [ ] **T5.5** — Trend Explanation
- [ ] **T5.6** — Health Question Answering
- [ ] **T5.7** — Anomaly Alerts (Cloud Function)
- [ ] **T5.8** — SaaS Tier Enforcement
- [ ] **T5.9** — Vertex AI Migration
- [ ] **T5.10** — Gemma 4 Function Calling for Nutrition

---

## Progress Summary

| Phase | Tasks | Done | Remaining |
|---|---|---|---|
| Prerequisites | 4 | 4 | 0 |
| Phase 1 — Firebase | 18 | 16 | 2 |
| Phase 2 — Gemini | 7 | 7 | 0 |
| Phase 3 — Tavily | 5 | 5 | 0 |
| Phase 4 — Integration | 11 | 8 | 3 |
| Phase 5 — Future | 10 | 0 | 10 |
| **Total** | **55** | **0** | **55** |

> **Agent:** Update the Done/Remaining counts in this table as you complete tasks.

---

*Last updated: 2026-05-02 — Phase 3 complete. Phase 4: T4.1–T4.5, T4.8–T4.10 done. T4.6, T4.7, T4.11 pending manual verification.*
