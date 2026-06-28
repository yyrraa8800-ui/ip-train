# RESEARCH — evidence base for Infinite

This document grounds the app in published training science rather than one
influencer's framing. Where the IP Method's marketing overpromises, we keep the
mechanics and drop the hype. None of this is medical advice (see the
disclaimer at the end).

---

## 1. Progressive overload & double progression

**Progressive overload** — gradually increasing the demand on a muscle over
time — is the primary driver of hypertrophy and strength. The most common
practical implementation in a fixed rep range is **double progression**: keep
the load constant and add reps until you reach the top of the range across all
sets, then add the smallest possible load increment and let reps drop back to
the bottom of the range. This program uses a **6–12** rep range.

- Because both *load* and *reps* move, neither one alone is a clean progression
  signal. We use **estimated 1RM (e1RM)** as the single signal so that a
  session where weight goes up but reps go down is still scored correctly.
- Smallest-jump loading (micro-plates / 1.25 kg or 2.5 lb) keeps progression
  alive longer than large jumps.

Sources: Schoenfeld, *Science and Development of Muscle Hypertrophy* (2nd ed.);
ACSM progression position stand (2009); Helms et al., *The Muscle & Strength
Pyramid: Training* (2nd ed.).

## 2. Volume landmarks — MEV / MAV / MRV

Renaissance Periodization (Mike Israetel et al.) popularised weekly-set
"landmarks" per muscle:

- **MV** — maintenance volume.
- **MEV** — minimum effective volume (least that still grows the muscle).
- **MAV** — maximum *adaptive* volume (the productive working window).
- **MRV** — maximum recoverable volume (above this is "junk volume").

The app computes **weekly hard sets per muscle** from the actual program and
flags each muscle as **below MEV / in range / above MRV**. Default landmark
ranges used in `src/engine/volume.ts` are intermediate-oriented and
conservative; they are starting points, not gospel — individual recovery
varies. (RP themselves stress these are estimates to be auto-regulated.)

Sources: Israetel, Hoffmann, Smith — *Renaissance Periodization* volume-landmark
articles & *Scientific Principles of Hypertrophy Training*.

## 3. Proximity to failure — RIR / RPE

For hypertrophy, most working sets should be taken to roughly **0–3 reps in
reserve (RIR)** (RPE ~7–10). Sets stopped well short of failure under-stimulate;
constant training to absolute failure inflates fatigue and impairs recovery
without proportional growth benefit. The logger supports an optional RIR field;
the warm-up protocol explicitly stays **away** from failure.

Sources: Refalo et al. meta-analysis on proximity-to-failure (2023);
Zourdos et al. RPE/RIR scale (2016); Schoenfeld & Grgic reviews.

## 4. Mesocycle periodization & deloads

Training is organised into **mesocycles**: volume ramps from around MEV toward
MRV across several weeks, accumulating fatigue, then a **deload** (reduced
volume/intensity) dissipates fatigue so adaptations are realised and a fresh
block can start. This program's spreadsheet ramps **sets** across the block
(e.g. 3 → 4) and ends with an explicit **deload** week (≈ half the reps at the
prior load). The app preserves this ramp per exercise (`setsByWeek`) and tracks
the deload separately.

Sources: RP mesocycle design; Helms *Pyramid*; classic periodization literature
(Zatsiorsky & Kraemer).

## 5. Exercise rotation / stimulus variation — and the counterpoint

The IP Method's central idea is **rotating exercise variations** to keep
providing a novel, productive stimulus once a given variation stalls. There is a
reasonable basis for variation (e.g. regional hypertrophy, avoiding staleness,
managing joint stress), and some evidence that *some* exercise variation can
benefit hypertrophy (e.g. Baz-Valle et al., 2019).

**The crucial counterpoint the app enforces:** rotating too often makes
progressive overload impossible to track — you can't tell whether you're getting
stronger if the lift keeps changing. So the evidence-aligned rule is **rotate on
stagnation, not on a whim.** The engine only surfaces a swap once a variation's
life cycle has genuinely **ended** (see §7), never arbitrarily.

Sources: Baz-Valle et al. (2019) on exercise variation; Schoenfeld on
overload-vs-variation trade-offs.

## 6. Estimated 1RM (e1RM)

Two standard formulas from weight × reps:

- **Epley:** `1RM = w · (1 + reps/30)` — used as the primary signal.
- **Brzycki:** `1RM = w · 36 / (37 − reps)` — stored as a cross-check.

Both are most accurate at lower rep counts (≤ ~10) and diverge at very high
reps, so the engine relies on **top-set** e1RM within the 6–12 range.

Sources: Epley (1985); Brzycki (1993); LeSuer et al. validation (1997).

## 7. The IP Method — mechanics we model (hype removed)

Jon Walland's "IP Method / Infinite Progression" frames training around **six
movement patterns** (horizontal/vertical press, horizontal/vertical pull, squat,
hinge), with isolation work tracked separately. Each variation has a **life
cycle**: productive while you keep adding load/reps ("alive"), then it stalls
("ended"). The loop:

1. Run one variation with double progression.
2. Detect the stall → life cycle ended.
3. Swap to a **same-pattern** variation that attacks the **weak point** the last
   one exposed (e.g. bench failing at lockout → triceps → close-grip bench).
4. **Carry strength forward** — start the new variation from a load scaled off
   the prior e1RM, near the top of the rep range.
5. Build a **roster** of proven variations per pattern, scored by
   **effectiveness = strength gained ÷ life-cycle weeks**, and cycle the best
   ones back in.

We implement this literally in `src/engine/` with tunable thresholds. We make
**no** "steroid-level results" claims — progress is realistic and individual.

## 8. Web / PWA implementation notes (why this stack)

The original briefs targeted native iOS (SwiftUI) or Expo. The chosen
distribution is **free, no-Mac, no-App-Store**, runnable in the **Koder** iOS
editor and as a Safari **Add-to-Home-Screen** app — so the app is built as a
**single self-contained Progressive Web App**:

- **No build step required to run.** `scripts/build.mjs` bundles everything
  (JS, CSS, the seed data, and a generated app icon) into one
  `dist/index.html` via **esbuild** (IIFE/classic script + inlined data), so it
  runs from `file://` — no server, no network, fully offline. This is what makes
  it work in Koder's preview and from the home screen.
- **Charts** are hand-drawn **SVG** (rings, the life-cycle "runway" bar,
  sparklines, volume bars) — zero chart dependencies, works everywhere,
  tiny bundle. (A native Expo build would have used `react-native-gifted-charts`
  or Swift Charts; SVG is the portable equivalent.)
- **Persistence** is `localStorage` with an in-memory fallback (some `file://`
  / private-mode contexts throw), plus **Export/Import** JSON backup as a safety
  net. (The native equivalents were SwiftData or `expo-sqlite`+Drizzle.)
- **i18n / RTL**: a lightweight dictionary (`src/i18n`) with English + Arabic and
  full **RTL** via the document `dir` attribute and CSS logical properties.
- **Seeding**: **SheetJS** (`scripts/buildSeed.mjs`) converts the bilingual
  `.xlsx` into `assets/seed.json`, embedded at build time.
- **Notifications**: real push isn't reliable for an offline iOS PWA, so the
  rest timer uses an in-app countdown with a Web-Audio beep and (where
  supported) vibration, instead of OS notifications.

The **IP engine is a pure, UI-independent, unit-tested TypeScript module** —
identical logic could back a future native build.

---

## Disclaimer

This app provides **general fitness information, not medical advice**. Train
within your limits, use good technique, warm up, and consult a qualified
professional before starting any program — especially if you have injuries or
health conditions. Results depend on training, nutrition, sleep, genetics and
consistency; expect **realistic, evidence-based** progress, not overnight
transformation.
