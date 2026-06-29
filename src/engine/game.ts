// Lightweight gamification: turn training into a game you level up. Pure helpers
// — all stats are derived from logged sessions (see store/selectors.gameProgress).

export const XP = {
  perWorkout: 40, // finishing a workout
  perWorkingSet: 8, // each working set logged
  perProgression: 12, // an exercise you beat vs last time (rating 1)
  perPR: 25, // a new all-time strength-score high
  perSwap: 80, // evolving a lift (completing a life cycle)
  perWeek: 120, // completing all training days in a week
};

// XP to advance FROM level L to L+1 is base*L, so levels get gradually harder.
const BASE = 120;

export function cumXpToReach(level: number): number {
  if (level <= 1) return 0;
  return (BASE * (level - 1) * level) / 2;
}

export interface LevelInfo {
  level: number;
  xpInLevel: number;
  xpForLevel: number;
  progress: number; // 0..1 toward next level
}

export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  while (cumXpToReach(level + 1) <= xp) level += 1;
  const floor = cumXpToReach(level);
  const xpForLevel = BASE * level;
  const xpInLevel = xp - floor;
  return { level, xpInLevel, xpForLevel, progress: Math.min(1, xpInLevel / xpForLevel) };
}

// A rank title per level band — a little flavour.
export function rankTitle(level: number): string {
  if (level >= 30) return 'Legend';
  if (level >= 22) return 'Elite';
  if (level >= 15) return 'Veteran';
  if (level >= 10) return 'Advanced';
  if (level >= 6) return 'Committed';
  if (level >= 3) return 'Rising';
  return 'Beginner';
}

export interface GameStats {
  xp: number;
  level: number;
  xpInLevel: number;
  xpForLevel: number;
  progress: number;
  rank: string;
  workouts: number;
  prs: number;
  swaps: number;
  streak: number;
  weeksCompleted: number;
  blocks: number;
}

export interface Badge {
  id: string;
  icon: string;
  en: string;
  ar: string;
  check: (s: GameStats) => boolean;
}

export const BADGES: Badge[] = [
  { id: 'first_workout', icon: '🎯', en: 'First session', ar: 'أول تمرين', check: (s) => s.workouts >= 1 },
  { id: 'workouts_10', icon: '🏋️', en: '10 workouts', ar: '١٠ تمارين', check: (s) => s.workouts >= 10 },
  { id: 'workouts_30', icon: '💪', en: '30 workouts', ar: '٣٠ تمرينًا', check: (s) => s.workouts >= 30 },
  { id: 'streak_3', icon: '🔥', en: '3 in a row', ar: '٣ متتالية', check: (s) => s.streak >= 3 },
  { id: 'streak_7', icon: '⚡', en: '7-streak', ar: 'سلسلة ٧', check: (s) => s.streak >= 7 },
  { id: 'pr_1', icon: '🥇', en: 'First record', ar: 'أول رقم قياسي', check: (s) => s.prs >= 1 },
  { id: 'pr_10', icon: '🏆', en: '10 records', ar: '١٠ أرقام', check: (s) => s.prs >= 10 },
  { id: 'first_swap', icon: '🔁', en: 'First evolution', ar: 'أول تطوّر', check: (s) => s.swaps >= 1 },
  { id: 'level_5', icon: '⭐', en: 'Level 5', ar: 'المستوى ٥', check: (s) => s.level >= 5 },
  { id: 'level_10', icon: '🌟', en: 'Level 10', ar: 'المستوى ١٠', check: (s) => s.level >= 10 },
  { id: 'week_done', icon: '📅', en: 'Full week', ar: 'أسبوع كامل', check: (s) => s.weeksCompleted >= 1 },
  { id: 'block_done', icon: '🧱', en: 'New block', ar: 'بلوك جديد', check: (s) => s.blocks >= 2 },
];

export function earnedBadges(stats: GameStats): Badge[] {
  return BADGES.filter((b) => b.check(stats));
}
