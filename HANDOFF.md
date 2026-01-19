# Bloom — Project Handoff

## What this repo is
Bloom is a pregnancy + newborn companion app (mom + partner). It runs as:
- Web (Vite/React) for development
- Mobile via Capacitor (iOS/Android)

Core features include timeline/week guidance, journal, feeding tracker, appointments, partner access, and a premium subscription paywall.

## Current status (high-level)
- App works end-to-end for core flows (auth → onboarding → home/timeline/journal/settings).
- Premium is intended to be **server-authoritative** (RevenueCat → Supabase Edge Function → DB update).
- Partner access is derived from mom’s premium (partners should not be able to purchase premium themselves).

## Tech stack
- Frontend: React + Vite (client/)
- Mobile shell: Capacitor (ios/, android/)
- Backend: Supabase (Auth + Postgres + Edge Functions under supabase/functions/)
- Subscriptions: RevenueCat
- “Ivy” assistant: Supabase Edge Function (supabase/functions/ask-ivy)

## Golden rules / constraints (do not break)
### 1) Premium must be server-authoritative
The client must never set premium directly in the database.
- Client: reads premium state
- RevenueCat webhook: is the source of truth
- Supabase Edge Function uses service-role key to update premium state

### 2) Partner cannot buy premium
Partner access is granted only if mom is premium.
Partner screens may show a “partner paywall” state but should not expose purchase buttons.

## RevenueCat + Premium flow (expected architecture)
### Source of truth
RevenueCat events → Supabase Edge Function:
- Function: `supabase/functions/revenuecat-webhook/index.ts`

The function:
- Verifies requests via Authorization header (`Bearer <REVENUECAT_WEBHOOK_SECRET>`)
- Uses Supabase `service_role` to update `pregnancy_profiles.is_premium`
- Skips anonymous RC IDs (`$RCAnonymousID...`)
- Grants premium for purchase/renewal-like events
- Revokes premium for cancellation/expiration/billing issues
- Handles TRANSFER by revoking old and granting new

### Client behavior
Client should:
- Trigger purchase via RevenueCat SDK (see `client/src/lib/purchases.ts`)
- Never write `is_premium` directly
- Read premium state from Supabase and update UI accordingly (PremiumContext)

## Supabase content included in repo
This repo includes:
- Edge Functions under `supabase/functions/*` (including RevenueCat webhook + ask-ivy)
- Schema artifacts under `supabase/schema/` (if present)

What is NOT guaranteed to be represented fully in code:
- RLS policies
- Database triggers
- SQL functions/RPCs
- Production environment variables
These must be verified in the Supabase dashboard / migrations.

## Required environment variables (names only)
### App (web/mobile)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_REVENUECAT_API_KEY` (or platform-specific RC keys, depending on implementation)

### Supabase Edge Function (revenuecat-webhook)
- `REVENUECAT_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## What is intentionally excluded from the handoff zip (and why)
For security + portability, the shared zip/hand-off artifact excludes:
- `.env*` (secrets)
- `node_modules/` (reinstallable)
- `.git/`, `.idea/` (local tooling)
- build outputs (`dist/`, `build/`, gradle/Pods/DerivedData, etc.)
- generated mobile public asset bundles (`ios/App/App/public/`, `android/app/src/main/assets/public/`) to keep size down

If something “works on my machine” but not elsewhere, re-check these excluded/generated artifacts.

## Where to look first (key files)
- RevenueCat webhook: `supabase/functions/revenuecat-webhook/index.ts`
- Purchase helper: `client/src/lib/purchases.ts`
- Premium state: `client/src/contexts/PremiumContext.tsx`
- Paywall screens:
  - `client/src/pages/subscribe.tsx`
  - `client/src/pages/partner-paywall.tsx`
- Premium gating component: `client/src/components/premium-lock.tsx`
- Settings entrypoint: `client/src/pages/settings.tsx`
- App routing/root: `client/src/App.tsx`

## Run / dev commands
(Adjust if your package scripts differ.)
- Install: `npm ci`
- Web dev: `npm run dev`
- iOS (Capacitor): `npx cap sync ios && npx cap open ios`
- Android (Capacitor): `npx cap sync android && npx cap open android`

## Known risks / verification checklist (do this before shipping)
- Confirm RevenueCat webhook is configured to hit the deployed Supabase function URL.
- Confirm the webhook secret matches `REVENUECAT_WEBHOOK_SECRET`.
- Confirm DB rules prevent client-side writes to `pregnancy_profiles.is_premium` (RLS/trigger).
- Confirm partner cannot initiate purchase (no purchase button / no purchase call path).
- Confirm premium UI updates after webhook events (may not be “instant” depending on polling/realtime wiring).

