# PROGRESS

Running log of how Infinite was built, in phases.

## Decision: target & stack

- The original briefs offered native iOS (SwiftUI) and Expo. The stated goal was
  to run on iPhone **for free** — first via TestFlight, then (once the $99
  Apple Developer fee was a blocker) via the **Koder** iOS editor.
- **Koder runs web apps (HTML/JS), not React Native.** So the app is built as a
  **single self-contained Progressive Web App**: it opens in Koder's preview,
  in Safari, and installs to the home screen via "Add to Home Screen" — offline,
  no Mac, no App Store, no fee, no expiry.
- The hard, portable work (spreadsheet parsing, the IP engine, research, design)
  is stack-independent and carried straight over.

## Phase 1 — Research ✅

- `RESEARCH.md`: progressive overload & double progression, MEV/MAV/MRV, RIR/RPE,
  mesocycle periodization & deloads, exercise rotation + the "rotate on stall,
  not on a whim" counterpoint, Epley/Brzycki e1RM, the IP Method mechanics, and
  PWA implementation notes. Includes a fitness disclaimer.

## Phase 2 — Data / seed ✅

- Inspected `M_B_GY_5_M1_SN_FULL.xlsx` (two sheets, bilingual). The program is
  actually **11 progressive weeks + 1 deload** (not 6) — preserved faithfully.
- `scripts/buildSeed.mjs` (SheetJS) → `assets/seed.json`:
  - 7 days (5 training + 2 rest), 30 program exercises, all with video URLs.
  - Per-exercise `setsByWeek` ramp + `deloadSets`, rep range, rest, muscle,
    pattern, and weak-point tags.
  - Variation library: **50 categories, ~409 variations** with videos (swap deck).
  - Arabic muscle labels → six movement patterns (+ isolation) mapping.
  - The broken `#REF!` "muscle group sets" cells are **ignored**; weekly volume
    is recomputed in-app from the real program.

## Phase 3 — IP engine (pure TS) ✅

- `src/engine/`: `e1rm`, `lifecycle` (alive/slowing/ended + runway),
  `swap` (failure → weak point → ranked same-pattern candidates + carry-forward
  load), `roster` (effectiveness = gain/week, pattern level), `volume`
  (recompute + MEV/MAV/MRV), `tuning` (all thresholds).
- **31 unit tests pass** (`vitest`), including the volume recompute that fixes
  the spreadsheet's `#REF!` Calves/Abs/Totals/Traps cells.

## Phase 4 — Store ✅

- Local-first store (`src/store`) with `useSyncExternalStore`, `localStorage`
  persistence + in-memory fallback, and pure selectors. Tracks sessions, set
  logging, per-slot life cycles, swaps, week/block, and roster. Export/Import
  backup.

## Phase 5 — UI + design system + i18n ✅

- Dark "training instrument" theme; semantic life-cycle colours
  (lime/amber/red) everywhere with labels (never colour alone).
- Screens: Onboarding (IP-loop cards), **Movement-Pattern Hub** (signature),
  Today, **Logger** (steppers, ghost targets, warm-up guidance, rest timer,
  auto 0/1 rating, haptics/beep), Exercise detail (life-cycle bar + sparkline +
  history), **Swap flow** (failure → 3 ranked cards → carry-forward), Pattern
  detail + roster, **Volume** dashboard (landmark bands), Analytics, Library
  (search/filter, 323 variations), Mesocycle (+ deload / next-block), Settings,
  About (credits Mohammad Almarzouq + disclaimer).
- English + Arabic with full **RTL**. Verified rendering end-to-end in headless
  Chromium (onboarding → hub → logger → stats → library → Arabic RTL), **no JS
  errors**.

## Phase 6 — Build + docs ✅

- `scripts/build.mjs` → one **301 KB** self-contained `dist/index.html`
  (inlined JS/CSS/seed + procedurally generated PNG app icon).
- `README.md` with plain-language Koder + Safari run instructions and a dev guide.

## Possible next steps

- Per-set RIR entry UI; richer next-block rotation (auto-pick highest-effectiveness
  variation per slot); CSV/Health export; optional hosted PWA with a service
  worker for installable updates.
