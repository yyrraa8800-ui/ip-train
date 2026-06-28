// The seed is generated from the spreadsheet by scripts/buildSeed.mjs and
// imported at build time, so it is embedded directly in the bundle (no runtime
// fetch — this is what lets the single-file build run from file:// in Koder).
import seedJson from '../../assets/seed.json';
import type { Seed } from './types';

export const seed = seedJson as unknown as Seed;
