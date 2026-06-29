/**
 * buildSeed.mjs — converts the bundled training spreadsheet
 * `M_B_GY_5_M1_SN_FULL.xlsx` into `assets/seed.json`, which the app loads on
 * first launch to populate the database.
 *
 * Run with:  npm run build:seed   (or)   node scripts/buildSeed.mjs
 *
 * The spreadsheet is bilingual (Arabic labels, English exercise names) and was
 * authored by Mohammad Almarzouq (@M_almarzouq7). It contains two sheets:
 *   1. "Mesocycle 1"      — the programmed block (days → exercises → per-week sets)
 *   2. "قاعدة البيانات"    — the variation pool / swap deck, grouped by category
 *
 * Several cells in the spreadsheet's "muscle group sets" table are broken
 * (`#REF!`). We deliberately DO NOT import that table; weekly volume is
 * recomputed correctly in-app from the actual program (see src/engine/volume.ts).
 */

import * as XLSX from 'xlsx';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const XLSX_PATH = join(ROOT, 'M_B_GY_5_M1_SN_FULL.xlsx');
const OUT_PATH = join(ROOT, 'assets', 'seed.json');

// ----------------------------------------------------------------------------
// Arabic text helpers
// ----------------------------------------------------------------------------

/** Normalise Arabic text: strip nbsp, diacritics, unify alef/yaa, collapse spaces. */
function normAr(input) {
  return String(input ?? '')
    .replace(/ /g, ' ')
    .replace(/[ً-ْـ]/g, '') // harakat + tatweel
    .replace(/[أإآ]/g, 'ا') // أ إ آ -> ا
    .replace(/ى/g, 'ي') // ى -> ي
    .replace(/ة/g, 'ه') // ة -> ه
    .replace(/\s+/g, ' ')
    .trim();
}

const PATTERNS = {
  HORIZONTAL_PRESS: 'horizontal_press',
  HORIZONTAL_PULL: 'horizontal_pull',
  VERTICAL_PRESS: 'vertical_press',
  VERTICAL_PULL: 'vertical_pull',
  SQUAT: 'squat',
  HINGE: 'hinge',
  SIDE_DELTS: 'side_delts',
  REAR_DELTS: 'rear_delts',
  BICEPS: 'biceps',
  TRICEPS: 'triceps',
  CALVES: 'calves',
  ABS: 'abs',
  TRAPS: 'traps',
  FOREARMS: 'forearms',
};

const ISOLATION = new Set([
  'side_delts', 'rear_delts', 'biceps', 'triceps', 'calves', 'abs', 'traps', 'forearms',
]);

/** Map an Arabic muscle / category label to one of the six patterns + isolation tracks. */
function patternForMuscle(raw) {
  const s = normAr(raw);
  if (/سكوات/.test(s)) return PATTERNS.SQUAT;
  if (/رجلين امامي/.test(s)) return PATTERNS.SQUAT; // quads (leg press / extension)
  if (/رجل خلفي|خلفي عزل|حوض للوراء/.test(s)) return PATTERNS.HINGE; // hamstrings / deadlift
  if (/ارداف/.test(s)) return PATTERNS.HINGE; // glutes
  if (/سحب افقي/.test(s)) return PATTERNS.HORIZONTAL_PULL;
  if (/سحب راسي/.test(s)) return PATTERNS.VERTICAL_PULL;
  if (/ظهر/.test(s)) return PATTERNS.HORIZONTAL_PULL; // generic back rows (dumbbell back)
  if (/صدر/.test(s)) return PATTERNS.HORIZONTAL_PRESS;
  if (/اكتاف امامي/.test(s)) return PATTERNS.VERTICAL_PRESS;
  if (/اكتاف جانبي/.test(s)) return PATTERNS.SIDE_DELTS;
  if (/اكتاف خلفي/.test(s)) return PATTERNS.REAR_DELTS;
  if (/بايسيبس/.test(s)) return PATTERNS.BICEPS;
  if (/ترايسيبس/.test(s)) return PATTERNS.TRICEPS;
  if (/بطات/.test(s)) return PATTERNS.CALVES;
  if (/بطن/.test(s)) return PATTERNS.ABS;
  if (/مثلثات/.test(s)) return PATTERNS.TRAPS;
  if (/سواعد/.test(s)) return PATTERNS.FOREARMS;
  return 'unknown';
}

/** Canonical English muscle bucket used by the weekly-volume table. */
function muscleKeyForMuscle(raw) {
  const s = normAr(raw);
  if (/صدر/.test(s)) return 'Chest';
  if (/ظهر/.test(s)) return 'Back';
  if (/اكتاف امامي/.test(s)) return 'Front delts';
  if (/اكتاف جانبي/.test(s)) return 'Side delts';
  if (/اكتاف خلفي/.test(s)) return 'Rear delts';
  if (/بايسيبس/.test(s)) return 'Biceps';
  if (/ترايسيبس/.test(s)) return 'Triceps';
  if (/سكوات|رجلين امامي/.test(s)) return 'Quads';
  if (/خلفي عزل|رجل خلفي|حوض للوراء/.test(s)) return 'Hamstring';
  if (/ارداف/.test(s)) return 'Glutes';
  if (/بطات/.test(s)) return 'Calves';
  if (/سواعد/.test(s)) return 'Forearms';
  if (/بطن/.test(s)) return 'Abs';
  if (/مثلثات/.test(s)) return 'Traps';
  return 'Other';
}

/**
 * Heuristic: which weak point(s) does this variation bias toward?
 * Used by the swap engine to recommend a variation that attacks the failure the
 * previous one exposed. Tags are pattern-relative failure modes.
 */
function inferWeakPoints(nameEn, pattern) {
  const n = String(nameEn ?? '').toLowerCase();
  const tags = new Set();
  const press = pattern === 'horizontal_press' || pattern === 'vertical_press';
  if (press) {
    if (/close.?grip|jm|skull|tricep|board|pin|floor/.test(n)) tags.add('lockout');
    if (/incline|upper/.test(n)) tags.add('off_chest');
    if (/decline|dip/.test(n)) tags.add('lockout');
    if (/pause|spoto|deficit|deep|larsen/.test(n)) tags.add('off_chest');
    if (/overhead|shoulder|ohp|military|arnold/.test(n)) tags.add('midrange');
  }
  if (pattern === 'squat') {
    if (/front|high.?bar|deficit|pause|goblet|ssb/.test(n)) tags.add('bottom');
    if (/hack|leg.?press|v-?squat|smith|leg ext/.test(n)) tags.add('midrange');
    if (/box|pin|low.?bar|sumo/.test(n)) tags.add('lockout');
    if (/bulgarian|split|lunge/.test(n)) tags.add('bottom');
  }
  if (pattern === 'hinge') {
    if (/stiff|romanian|rdl|good.?morning|deficit|snatch/.test(n)) tags.add('stretch');
    if (/rack|block|sumo|hip thrust|pull.?through|kickback/.test(n)) tags.add('lockout');
    if (/back raise|45|leg curl|nordic/.test(n)) tags.add('stretch');
  }
  if (pattern === 'horizontal_pull' || pattern === 'vertical_pull') {
    if (/pullover|straight.?arm|stretch/.test(n)) tags.add('stretch');
    if (/row|pull.?to|chest supported|seal/.test(n)) tags.add('contraction');
    if (/wide|lat|pulldown|pull.?up|chin/.test(n)) tags.add('stretch');
    if (/cable|face pull|shrug/.test(n)) tags.add('contraction');
  }
  return [...tags];
}

/**
 * The variation library is grouped by muscle category, but a few exercises in a
 * "back" group are really hinges (deadlifts) and some "row" groups contain
 * pull-ups (vertical). Refine each exercise's pattern from its name so the
 * Change-exercise list only ever shows true same-pattern movements.
 */
function refineExercisePattern(groupPattern, nameEn) {
  const n = String(nameEn ?? '').toLowerCase();
  if (/deadlift|good ?morning|stiff.?leg|romanian|\brdl\b|back raise|hyperext|hip thrust|pull.?through|glute|kickback|nordic/.test(n))
    return PATTERNS.HINGE;
  if (/pulldown|pull.?ups?|pullups?|chin.?ups?/.test(n)) return PATTERNS.VERTICAL_PULL;
  if (/\brows?\b|bent.?over|t-?bar|seal row|chest supported|inverted row/.test(n))
    return PATTERNS.HORIZONTAL_PULL;
  return groupPattern;
}

// ----------------------------------------------------------------------------
// Spreadsheet access helpers (1-based row/col, like the inspection above)
// ----------------------------------------------------------------------------

function makeCellGetter(ws) {
  return (row, col) => {
    const addr = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
    const cell = ws[addr];
    if (!cell) return null;
    // cell.v is the (cached) value; for formula cells this is the computed result.
    return cell.v ?? null;
  };
}

// Column indices for each week block's "sets" column (الجولات).
// Week blocks start at: K(11) R(18) Z(26) AH(34) AP(42) AX(50) BF(58) BN(66)
// BV(74) CD(82) CL(90) and the deload at CT(98). Sets sits one column right.
const WEEK_START_COLS = [11, 18, 26, 34, 42, 50, 58, 66, 74, 82, 90];
const DELOAD_START_COL = 98;

// ----------------------------------------------------------------------------
// Sheet 1 — "Mesocycle 1"
// ----------------------------------------------------------------------------

function parseProgram(wb) {
  const ws = wb.Sheets['Mesocycle 1'];
  const get = makeCellGetter(ws);
  const range = XLSX.utils.decode_range(ws['!ref']);
  const maxRow = range.e.r + 1;

  // Find day-title rows (column D / index 4 contains "اليوم").
  const dayRows = [];
  for (let r = 1; r <= maxRow; r++) {
    const v = get(r, 4);
    if (v && String(v).includes('اليوم')) dayRows.push(r);
  }

  const days = [];
  dayRows.forEach((headerRow, i) => {
    const title = String(get(headerRow, 4));
    const nameAr = title.split('-').slice(1).join('-').trim() || title.trim();
    const isRest = /راحة/.test(title);
    const nameEn = dayNameEn(i + 1, isRest);
    const day = { index: i + 1, nameEn, nameAr, isRest, exercises: [] };

    if (!isRest) {
      // Exercise rows: header at headerRow+1, then rows where col A is a number.
      let order = 0;
      for (let r = headerRow + 2; r <= headerRow + 9; r++) {
        const num = get(r, 1);
        const nm = get(r, 7); // col G — English exercise name
        if (typeof num !== 'number' || !nm) continue;
        order += 1;
        const muscleAr = String(get(r, 5) ?? '').replace(/ /g, ' ').trim();
        const pattern = patternForMuscle(muscleAr);
        const muscleKey = muscleKeyForMuscle(muscleAr);
        const videoUrl = resolveUrl(get(r, 8));
        const setsByWeek = WEEK_START_COLS.map((c) => toInt(get(r, c + 1))).filter((x) => x != null);
        const deloadSets = toInt(get(r, DELOAD_START_COL + 1));
        day.exercises.push({
          order,
          nameEn: String(nm).trim(),
          muscleAr,
          muscleKey,
          category: normKey(muscleAr),
          pattern,
          isIsolation: ISOLATION.has(pattern),
          videoUrl,
          repRange: [6, 12],
          restSeconds: [60, 120],
          setsByWeek,
          deloadSets: deloadSets ?? 2,
          weakPoints: inferWeakPoints(nm, pattern),
        });
      }
    }
    days.push(day);
  });

  // weeks = the longest progressive setsByWeek we found (deload tracked separately).
  const weeks = Math.max(
    1,
    ...days.flatMap((d) => d.exercises.map((e) => e.setsByWeek.length)),
  );

  return {
    name: 'Mesocycle 1',
    author: 'Mohammad Almarzouq (@M_almarzouq7)',
    weeks,
    hasDeload: true,
    days,
  };
}

function dayNameEn(index, isRest) {
  if (isRest) return 'Rest';
  return (
    {
      1: 'Push',
      2: 'Pull',
      3: 'Lower + Side Delts',
      5: 'Upper',
      6: 'Shoulders + Legs',
    }[index] ?? `Day ${index}`
  );
}

// ----------------------------------------------------------------------------
// Sheet 2 — "قاعدة البيانات" (the variation library / swap deck)
// ----------------------------------------------------------------------------

function parseVariationLibrary(wb) {
  const ws = wb.Sheets['قاعدة البيانات'];
  const get = makeCellGetter(ws);
  const range = XLSX.utils.decode_range(ws['!ref']);
  const maxRow = range.e.r + 1;

  // The library is a series of category blocks: col A carries the category
  // label (once per group), col B the exercise name, col C the video URL.
  // Below the library sit helper/formula tables — we stop importing once col C
  // stops being a real URL pattern paired with a plausible exercise name.
  const byCategory = new Map();
  let currentCat = null;

  for (let r = range.s.r + 1; r <= maxRow; r++) {
    const a = get(r, 1);
    const b = get(r, 2);
    const c = get(r, 3);

    if (a && String(a).trim() && !/^http/i.test(String(a))) {
      currentCat = String(a).replace(/ /g, ' ').trim();
    }
    // A real library row: an English-ish name in B and a video link in C.
    const name = b ? String(b).trim() : '';
    const url = c ? String(c).trim() : '';
    const isHeader = name === 'التمرين' || url === 'الرابط';
    // Real library rows always carry an English exercise name in col B. The
    // first Arabic name (other than the 'التمرين' header) marks the start of
    // the helper / formula tables that sit below the library — stop there so we
    // don't slurp the master links table into the last category.
    if (currentCat && name && name !== 'التمرين' && /[؀-ۿ]/.test(name)) break;
    const looksLikeUrl = /^https?:\/\//i.test(url);
    if (!currentCat || isHeader || !name || !looksLikeUrl) continue;

    if (!byCategory.has(currentCat)) byCategory.set(currentCat, new Set());
    const list = byCategory.get(currentCat);
    list.add(JSON.stringify({ nameEn: name, videoUrl: url }));
  }

  const variationLibrary = [];
  for (const [category, set] of byCategory) {
    const pattern = patternForMuscle(category);
    if (pattern === 'unknown') continue;
    const exercises = [...set]
      .map((s) => JSON.parse(s))
      .map((e) => {
        const exPattern = refineExercisePattern(pattern, e.nameEn);
        return {
          nameEn: e.nameEn,
          videoUrl: e.videoUrl,
          pattern: exPattern,
          weakPoints: inferWeakPoints(e.nameEn, exPattern),
        };
      });
    // Deduplicate by name within a category.
    const seen = new Set();
    const unique = exercises.filter((e) => {
      const k = e.nameEn.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    variationLibrary.push({
      category,
      categoryKey: normKey(category),
      muscleKey: muscleKeyForMuscle(category),
      pattern,
      isIsolation: ISOLATION.has(pattern),
      exercises: unique,
    });
  }
  return variationLibrary;
}

// ----------------------------------------------------------------------------
// misc helpers
// ----------------------------------------------------------------------------

function normKey(s) {
  return normAr(s).replace(/\s+/g, '_');
}
function toInt(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}
function resolveUrl(v) {
  if (!v) return null;
  const s = String(v).trim();
  if (/^https?:\/\//i.test(s)) return s;
  return null; // formula that wasn't cached — leave null, library may still have it
}

// ----------------------------------------------------------------------------
// main
// ----------------------------------------------------------------------------

function main() {
  if (!existsSync(XLSX_PATH)) {
    console.error(`Spreadsheet not found at ${XLSX_PATH}`);
    process.exit(1);
  }
  const wb = XLSX.read(readFileSync(XLSX_PATH), { type: 'buffer', cellFormula: true });
  const program = parseProgram(wb);
  const variationLibrary = parseVariationLibrary(wb);

  // Back-fill missing program video URLs from the library where names match.
  const urlByName = new Map();
  for (const grp of variationLibrary)
    for (const ex of grp.exercises)
      if (ex.videoUrl) urlByName.set(ex.nameEn.toLowerCase(), ex.videoUrl);
  for (const day of program.days)
    for (const ex of day.exercises)
      if (!ex.videoUrl) ex.videoUrl = urlByName.get(ex.nameEn.toLowerCase()) ?? null;

  const seed = {
    meta: {
      generatedAt: new Date().toISOString(),
      source: 'M_B_GY_5_M1_SN_FULL.xlsx',
      author: 'Mohammad Almarzouq (@M_almarzouq7)',
      note: 'Weekly volume is recomputed in-app; broken #REF! cells are ignored.',
    },
    program,
    variationLibrary,
  };

  writeFileSync(OUT_PATH, JSON.stringify(seed, null, 2));

  // Summary
  const dayCount = program.days.length;
  const exCount = program.days.reduce((n, d) => n + d.exercises.length, 0);
  const libCount = variationLibrary.reduce((n, g) => n + g.exercises.length, 0);
  console.log(`✓ Wrote ${OUT_PATH}`);
  console.log(`  program: ${dayCount} days, ${exCount} exercises, ${program.weeks} weeks (+deload)`);
  console.log(`  library: ${variationLibrary.length} categories, ${libCount} variations`);
  const missing = program.days.flatMap((d) => d.exercises).filter((e) => !e.videoUrl);
  if (missing.length) console.log(`  ⚠ ${missing.length} program exercises missing a video URL`);
}

main();
