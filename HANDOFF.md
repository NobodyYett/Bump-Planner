# Bump Planner — Handover Notes (Jan 2026)

## Current status
- OAuth: stable on Capacitor 7 (avoid changing Capacitor major without re-testing OAuth)
- Premium UX: "glass" lock previews via PremiumLock component
- /subscribe page: implemented (web shows fallback; native shows RevenueCat offerings)
- Partner security: partner_access RLS audited + fixed (blind claim; no pending invite data leak)
- Calendar: Add-to-Calendar via RFC 5545 ICS export (web download, iOS/Android share sheet)
- Task suggestions: toggle exists in Settings, stored in localStorage (defaults ON)
- FLO limits: Free 2/day, Premium 5/day (constants in aiLimits.ts)
- Weekly Insights detailed stats: Premium-only (summary text visible to free)

## Important files
- Premium lock UI: client/src/components/premium-lock.tsx
- Premium state: client/src/contexts/PremiumContext.tsx
- Purchases abstraction: client/src/lib/purchases.ts (RevenueCat wrapper)
- Subscribe page: client/src/pages/subscribe.tsx
- Calendar export: client/src/lib/calendarExport.ts
- AI limits: client/src/lib/aiLimits.ts

## Monetization decisions (locked)
- Partner access/invite: Premium-only (free sees locked preview)
- Task suggestions: Premium-only
- Weekly Insights detailed stats: Premium-only
- Free tier: full solo app + AI 2/day + summary insights
- Premium: AI 5/day + partner coordination + detailed insights

## Subscription integration
- RevenueCat Capacitor plugin: @revenuecat/purchases-capacitor@9.2.2 installed using legacy peer deps
- NOTE: This version has a peer mismatch with Capacitor 7; project uses legacy-peer-deps to allow install.
- iOS: RevenueCat native SDK integrated via CocoaPods (open ios/App/App.xcworkspace)
- Entitlement name: "premium" (defined in purchases.ts)
- Products must be created in App Store Connect / Google Play Console and mapped in RevenueCat dashboard

## Environment variables
- .env is gitignored. Do NOT commit keys.
- Required:
  - VITE_REVENUECAT_IOS_API_KEY=appl_***
  - VITE_REVENUECAT_ANDROID_API_KEY=goog_***

## How to run
- Web: npm install && npm run dev
- Native (after build): npm run build && npx cap sync
- iOS: npx cap open ios  (open App.xcworkspace due to CocoaPods)
- Android: npx cap open android

## Known tradeoffs / TODOs
- RevenueCat entitlement is “placeholder” until products are configured in stores + RevenueCat
- Task suggestions toggle is localStorage-based (consider Supabase settings for cross-device sync)
- iOS may show SPM warnings for RevenueCat plugin; CocoaPods is the active integration method
