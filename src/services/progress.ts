import type { Mode } from '../types';

// Progress data structure
export interface UserProgress {
  streaks: {
    current: number;
    best: number;
    lastActiveDate: string;
  };
  modes: {
    [key in Mode]: ModeProgress;
  };
  badges: Badge[];
  totalSessions: number;
  gardenLevel: number;
}

export interface ModeProgress {
  level: number;
  xp: number;
  sessionsCompleted: number;
  bestScore: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

// Badge definitions
export const BADGE_DEFINITIONS: Record<string, Omit<Badge, 'earnedAt'>> = {
  first_step: {
    id: 'first_step',
    name: '最初の一歩',
    description: '初めてのセッションを完了',
    icon: '🌱',
  },
  streak_3: {
    id: 'streak_3',
    name: '三日坊主を超えて',
    description: '3日連続でログイン',
    icon: '🔥',
  },
  streak_7: {
    id: 'streak_7',
    name: '習慣の芽生え',
    description: '7日連続でログイン',
    icon: '🌟',
  },
  streak_30: {
    id: 'streak_30',
    name: '修行者',
    description: '30日連続でログイン',
    icon: '🏆',
  },
  empathy_master: {
    id: 'empathy_master',
    name: '共感マスター',
    description: 'Managerモードで信頼度80以上達成',
    icon: '💝',
  },
  quick_wit: {
    id: 'quick_wit',
    name: '即興の達人',
    description: 'Icebreakerモードでスコア5を獲得',
    icon: '⚡',
  },
  charisma: {
    id: 'charisma',
    name: 'カリスマ性',
    description: 'Socialiteモードでスコア90以上',
    icon: '✨',
  },
  deep_listener: {
    id: 'deep_listener',
    name: '深層リスナー',
    description: 'Mirrorモードでレベル5達成',
    icon: '🎧',
  },
  level_5: {
    id: 'level_5',
    name: '見習いの証',
    description: 'いずれかのモードでレベル5達成',
    icon: '📜',
  },
  level_10: {
    id: 'level_10',
    name: '熟練者の証',
    description: 'いずれかのモードでレベル10達成',
    icon: '🎖️',
  },
  all_modes: {
    id: 'all_modes',
    name: '万能の対話者',
    description: '全モードでセッションを完了',
    icon: '🌈',
  },
};

// XP required for each level
const XP_PER_LEVEL = 100;

// Initial progress state
const getInitialProgress = (): UserProgress => ({
  streaks: {
    current: 0,
    best: 0,
    lastActiveDate: '',
  },
  modes: {
    manager: { level: 1, xp: 0, sessionsCompleted: 0, bestScore: 0 },
    icebreaker: { level: 1, xp: 0, sessionsCompleted: 0, bestScore: 0 },
    socialite: { level: 1, xp: 0, sessionsCompleted: 0, bestScore: 0 },
    mirror: { level: 1, xp: 0, sessionsCompleted: 0, bestScore: 0 },
  },
  badges: [],
  totalSessions: 0,
  gardenLevel: 1,
});

const STORAGE_KEY = 'ripple_progress';

// Load progress from localStorage
export const loadProgress = (): UserProgress => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading progress:', e);
  }
  return getInitialProgress();
};

// Save progress to localStorage
export const saveProgress = (progress: UserProgress): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Error saving progress:', e);
  }
};

// Update streak on app open
export const updateStreak = (progress: UserProgress): UserProgress => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (progress.streaks.lastActiveDate === today) {
    return progress; // Already updated today
  }

  const newProgress = { ...progress };

  if (progress.streaks.lastActiveDate === yesterday) {
    // Consecutive day
    newProgress.streaks.current += 1;
  } else if (progress.streaks.lastActiveDate !== today) {
    // Streak broken
    newProgress.streaks.current = 1;
  }

  newProgress.streaks.lastActiveDate = today;
  newProgress.streaks.best = Math.max(newProgress.streaks.best, newProgress.streaks.current);

  // Check streak badges
  if (newProgress.streaks.current >= 3 && !hasBadge(newProgress, 'streak_3')) {
    newProgress.badges.push({ ...BADGE_DEFINITIONS.streak_3, earnedAt: today });
  }
  if (newProgress.streaks.current >= 7 && !hasBadge(newProgress, 'streak_7')) {
    newProgress.badges.push({ ...BADGE_DEFINITIONS.streak_7, earnedAt: today });
  }
  if (newProgress.streaks.current >= 30 && !hasBadge(newProgress, 'streak_30')) {
    newProgress.badges.push({ ...BADGE_DEFINITIONS.streak_30, earnedAt: today });
  }

  saveProgress(newProgress);
  return newProgress;
};

// Record a completed session
export const recordSession = (
  progress: UserProgress,
  mode: Mode,
  score: number
): { progress: UserProgress; newBadges: Badge[] } => {
  const today = new Date().toISOString().split('T')[0];
  const newProgress = { ...progress };
  const newBadges: Badge[] = [];

  // Update mode progress
  const modeProgress = { ...newProgress.modes[mode] };
  modeProgress.sessionsCompleted += 1;
  modeProgress.bestScore = Math.max(modeProgress.bestScore, score);

  // Add XP based on score
  const xpGained = Math.floor(score * 0.5) + 10;
  modeProgress.xp += xpGained;

  // Level up check
  while (modeProgress.xp >= XP_PER_LEVEL) {
    modeProgress.xp -= XP_PER_LEVEL;
    modeProgress.level += 1;

    // Check level badges
    if (modeProgress.level >= 5 && !hasBadge(newProgress, 'level_5')) {
      const badge = { ...BADGE_DEFINITIONS.level_5, earnedAt: today };
      newProgress.badges.push(badge);
      newBadges.push(badge);
    }
    if (modeProgress.level >= 10 && !hasBadge(newProgress, 'level_10')) {
      const badge = { ...BADGE_DEFINITIONS.level_10, earnedAt: today };
      newProgress.badges.push(badge);
      newBadges.push(badge);
    }
  }

  newProgress.modes[mode] = modeProgress;
  newProgress.totalSessions += 1;

  // First session badge
  if (newProgress.totalSessions === 1 && !hasBadge(newProgress, 'first_step')) {
    const badge = { ...BADGE_DEFINITIONS.first_step, earnedAt: today };
    newProgress.badges.push(badge);
    newBadges.push(badge);
  }

  // Mode-specific badges
  if (mode === 'icebreaker' && score >= 5 && !hasBadge(newProgress, 'quick_wit')) {
    const badge = { ...BADGE_DEFINITIONS.quick_wit, earnedAt: today };
    newProgress.badges.push(badge);
    newBadges.push(badge);
  }
  if (mode === 'socialite' && score >= 90 && !hasBadge(newProgress, 'charisma')) {
    const badge = { ...BADGE_DEFINITIONS.charisma, earnedAt: today };
    newProgress.badges.push(badge);
    newBadges.push(badge);
  }
  if (mode === 'mirror' && modeProgress.level >= 5 && !hasBadge(newProgress, 'deep_listener')) {
    const badge = { ...BADGE_DEFINITIONS.deep_listener, earnedAt: today };
    newProgress.badges.push(badge);
    newBadges.push(badge);
  }

  // All modes badge
  const allModesCompleted = Object.values(newProgress.modes).every(m => m.sessionsCompleted > 0);
  if (allModesCompleted && !hasBadge(newProgress, 'all_modes')) {
    const badge = { ...BADGE_DEFINITIONS.all_modes, earnedAt: today };
    newProgress.badges.push(badge);
    newBadges.push(badge);
  }

  // Update garden level based on total progress
  const totalLevels = Object.values(newProgress.modes).reduce((sum, m) => sum + m.level, 0);
  newProgress.gardenLevel = Math.floor(totalLevels / 4) + 1;

  saveProgress(newProgress);
  return { progress: newProgress, newBadges };
};

// Check if user has a badge
const hasBadge = (progress: UserProgress, badgeId: string): boolean => {
  return progress.badges.some(b => b.id === badgeId);
};

// Get garden state based on level and streak
export const getGardenState = (progress: UserProgress): {
  bloomLevel: number;
  rippleCount: number;
  isGlowing: boolean;
} => {
  return {
    bloomLevel: Math.min(progress.gardenLevel, 10),
    rippleCount: Math.min(progress.streaks.current, 7),
    isGlowing: progress.streaks.current >= 3,
  };
};
