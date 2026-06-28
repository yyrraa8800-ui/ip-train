# Infinite — a hypertrophy training app built on the IP Method

A calm, dark, data-forward training app that runs the **IP Method** loop for you:
push each of the six movement patterns with double progression, detect when a
lift **stalls**, and recommend the next variation that fixes the weak point it
exposed — carrying your strength forward.

It is a **single self-contained web app**. No App Store, no Mac, no Apple
Developer fee, no expiry. It runs in the **Koder** code editor on your iPhone,
in **Safari**, and as a real **home-screen app** (Add to Home Screen) that works
**offline**.

> Program by **Mohammad Almarzouq** (Instagram **@M_almarzouq7**) — the bundled
> 11-week mesocycle (+ deload). This app is a training tool, **not medical
> advice**; see the disclaimer in the app and in `RESEARCH.md`.

---

## Get it on your iPhone (free, ~2 minutes)

The whole app is one file: **`dist/index.html`**. You don't need to build
anything — it's ready to run.

### Step 1 — Get the file onto your phone
On your iPhone, open this repository, go to **`dist/index.html`**, and tap
**“Download raw file”**. It saves into the **Files** app (e.g. *Downloads*).

### Step 2 — Run it, two ways

**A) In Koder (what you asked for):**
1. Open **Koder**.
2. Open `index.html` from **Files** (Koder can browse the Files app / iCloud).
3. Tap **Preview / Run**. The app opens. That's it.

**B) As a home-screen app (recommended — feels like a real app):**
1. In the **Files** app, tap `index.html` so it opens in a browser (or
   long-press → **Share** → **Safari**).
2. In **Safari**, tap the **Share** button (the square with an arrow).
3. Tap **Add to Home Screen** → **Add**.
4. Launch **“Infinite”** from your home screen. It runs **full-screen and
   offline**, like a normal app.

> **Backing up your log.** Your workouts are stored on the device. Open
> **Settings → Export data** now and then and keep the text somewhere safe
> (Notes, email). To move to a new phone or restore, use **Settings → Import
> data**. Tip: use the *same* launch method consistently (e.g. always the
> home-screen icon) so the data stays in one place.

That's everything you need to **use** the app. The rest of this README is for
editing or rebuilding it.

---

## Why a web app (and not TestFlight)?

TestFlight / the App Store require the **paid Apple Developer Program ($99/yr)**
and (for the App Store) a Mac. A free Apple-ID sideload expires every 7 days and
also needs a Mac/AltStore. **Koder runs web apps, not React Native.** So the app
is built as a Progressive Web App that runs in Koder and Safari, installs to the
home screen, and never expires — fully free. The portable parts (the spreadsheet
parser, the IP engine, the research, the design) would also back a native build
later if you ever pay for the Apple program.

---

## What's inside

- **Movement-Pattern Hub** — the six patterns as a vertical “skill” list with
  progress rings and life-cycle status dots; isolation tracks below.
- **Today + Logger** — big thumb-friendly weight/rep steppers, last-time “ghost”
  targets, warm-up guidance, an integrated rest timer (circular countdown +
  beep/vibrate), warm-up toggles, and an automatic **0/1 progression rating**.
- **Exercise detail** — the signature **life-cycle “runway” bar** (green →
  amber → red), an e1RM sparkline, and full set history.
- **Swap flow** — “Where do you usually fail?” → 3 ranked same-pattern
  variations that target that weak point, each with a tappable video and a
  pre-filled **carry-forward** starting load.
- **Pattern roster** — your best variations ranked by **effectiveness**
  (strength gained ÷ life-cycle weeks).
- **Weekly volume** — sets per muscle vs **MEV/MAV/MRV** landmark bands,
  recomputed correctly from the program (the spreadsheet’s broken `#REF!` cells
  are ignored).
- **Analytics, Library** (search/filter ~400 variations with videos),
  **Mesocycle** (deload + next-block generator), **Settings**, **About**.
- **English + Arabic** with full **RTL**.

---

## Develop / rebuild it

Requires **Node.js 18+** (only for building — the app itself needs nothing).

```bash
npm install            # install dev tools (esbuild, vitest, TypeScript, SheetJS)

npm run build:seed     # regenerate assets/seed.json from the .xlsx  (optional)
npm run build          # bundle everything -> dist/index.html (the deliverable)

npm run dev            # rebuild on change + serve at http://localhost:8080
npm test               # run the IP-engine unit tests (vitest)
npm run typecheck      # TypeScript, no emit
```

`npm run build` writes a single, self-contained `dist/index.html` (~300 KB) with
the JS, CSS, seed data, and app icon all inlined.

---

## Architecture

The **IP engine is a pure, UI-independent, fully unit-tested TypeScript module**
— the logic is separate from the screens so it’s portable and testable.

```
M_B_GY_5_M1_SN_FULL.xlsx   the source program (committed)
assets/seed.json           generated seed (program + variation library)
scripts/
  buildSeed.mjs            xlsx -> seed.json   (SheetJS)
  build.mjs                bundle -> dist/index.html  (esbuild, inlines everything)
src/
  data/        types + the embedded seed loader
  engine/      e1rm · lifecycle · swap · roster · volume · tuning  (+ tests)
  store/       local-first store (localStorage), seeding, selectors
  i18n/        en/ar dictionary + RTL helpers
  ui/          theme, components (SVG rings/bars/sparklines), screens, App, nav
dist/index.html            ← the app you put on your phone
RESEARCH.md  PROGRESS.md
```

**Data model (local-first):** sessions → logged exercises → set entries; per
program *slot* the engine derives an **ExerciseLifeCycle** (status, e1RM series,
strength gained, duration); accepted swaps write **VariationRosterEntry** records
scored by effectiveness; weekly **volume** is computed per muscle and compared to
landmarks. Everything persists to `localStorage` with an in-memory fallback and a
JSON Export/Import backup.

**The IP loop, concretely** (`src/engine`, thresholds in `tuning.ts`):
e1RM via Epley (Brzycki cross-check) → auto 0/1 rating → `alive`/`slowing`/`ended`
detection → on `ended`, map your failure point to a weak point and rank
same-pattern library variations (weak-point match + your historical
effectiveness − recently used) → carry-forward load near the top of 6–12 →
roster scoring → deload / next-block generation.

---

## Credits & disclaimer

- **App:** Yaqoub Alhadad.
- **Training program** (Mesocycle 1, the bundled spreadsheet): **Mohammad
  Almarzouq (@M_almarzouq7)**.
- **Method:** the IP Method (Jon Walland).

An in-app **“How it works”** guide (Settings → How it works) explains the IP
Method, the evidence behind it, and how to apply it week to week. This app
presents realistic, evidence-based expectations and is **not medical advice** —
train within your limits and consult a professional. See `RESEARCH.md` for
sources.
