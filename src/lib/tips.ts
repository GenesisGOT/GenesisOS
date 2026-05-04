/**
 * GenesisOS Tips System
 *
 * Curated tips shown throughout the app. Each tip is shown once —
 * dismissed state is persisted to localStorage.
 * Users can browse the full library in Settings → Tours & Help.
 */

export interface Tip {
  id: string;
  category: 'health' | 'habits' | 'schedule' | 'nutrition' | 'ai' | 'general';
  icon: string;
  title: string;
  body: string;
  /** Page where this tip is most relevant (undefined = show anywhere) */
  page?: string;
}

// ─── Tip Library ──────────────────────────────────────────────────────────────

export const ALL_TIPS: Tip[] = [
  // Health
  {
    id: 'health-weight-trend',
    category: 'health',
    icon: '📉',
    title: 'Track weekly, not daily',
    body: 'Weight fluctuates up to 2 kg per day from water and food. Log every day but judge your progress on 7-day averages.',
    page: '/health',
  },
  {
    id: 'health-sleep-consistency',
    category: 'health',
    icon: '😴',
    title: 'Same bedtime = better sleep',
    body: 'Going to bed within 30 min of the same time each night improves deep sleep quality more than sleeping longer.',
    page: '/health',
  },
  {
    id: 'health-water',
    category: 'health',
    icon: '💧',
    title: 'Hydration before coffee',
    body: 'Drink 500 ml of water within 10 min of waking. It re-hydrates cells after 7 hours without water and boosts morning energy.',
  },
  // Nutrition / Fasting
  {
    id: 'nutrition-if-window',
    category: 'nutrition',
    icon: '⏱️',
    title: 'Your 2pm eating window starts now',
    body: 'During your fast (before 2pm) black coffee and water are fine. They won\'t break the fast and help suppress hunger.',
    page: '/health',
  },
  {
    id: 'nutrition-protein-first',
    category: 'nutrition',
    icon: '🥩',
    title: 'Protein first in your eating window',
    body: 'Eating protein at the start of your 2pm–7pm window (30–40 g) reduces hunger for the rest of the day and protects muscle during fat loss.',
  },
  {
    id: 'nutrition-calorie-density',
    category: 'nutrition',
    icon: '🥗',
    title: '1500 cal can feel like a lot',
    body: 'Fill half your plate with volume foods (greens, cucumbers, broth soups) — they have almost no calories but make you feel full inside your window.',
  },
  // Habits
  {
    id: 'habits-streak-restart',
    category: 'habits',
    icon: '🔥',
    title: 'Missing once is fine — missing twice is a habit',
    body: 'One missed day barely affects a streak\'s momentum. The rule: never miss the same habit two days in a row.',
    page: '/habits',
  },
  {
    id: 'habits-anchor',
    category: 'habits',
    icon: '⚓',
    title: 'Anchor habits to existing routines',
    body: 'Do your morning stretches right after you brush your teeth — never "after I wake up". Vague triggers fail; specific ones stick.',
    page: '/habits',
  },
  {
    id: 'habits-cleaning-timer',
    category: 'habits',
    icon: '🧹',
    title: 'Set a 20-min timer for cleaning',
    body: 'Don\'t try to get the whole room perfect — set 20 min and stop when it goes off. The constraint makes it feel manageable every day.',
    page: '/habits',
  },
  // Schedule / Time-blocking
  {
    id: 'schedule-morning-buffer',
    category: 'schedule',
    icon: '🌅',
    title: 'Guard the hour before work',
    body: 'Your pre-work blocks (cleaning + stretches) set the tone for the day. Treat them as non-negotiable meetings with yourself.',
    page: '/schedule',
  },
  {
    id: 'schedule-gym-timing',
    category: 'schedule',
    icon: '🏋️',
    title: 'Morning gym > evening gym for fat loss',
    body: 'Fasted morning cardio burns 20% more fat. If gym is before your 2pm window, you\'re training fasted — a significant advantage.',
    page: '/schedule',
  },
  {
    id: 'schedule-sunday-prep',
    category: 'schedule',
    icon: '🗓️',
    title: 'Meal prep = calorie control on autopilot',
    body: 'Pre-portioned meals remove the daily decision of what to eat. No decision fatigue = fewer bad choices = consistent 1500 cal.',
  },
  // AI
  {
    id: 'ai-morning-brief',
    category: 'ai',
    icon: '🤖',
    title: 'Claude reads your data every morning',
    body: 'The AI morning brief pulls your last 7 days of habits, health, and schedule. The more you log, the smarter the brief gets.',
    page: '/',
  },
  {
    id: 'ai-weekly-review',
    category: 'ai',
    icon: '📊',
    title: 'Weekly reviews compound over time',
    body: 'Claude\'s weekly review compares this week to last week. After 4 weeks of data, the patterns it finds become genuinely useful.',
  },
  {
    id: 'ai-time-blocker',
    category: 'ai',
    icon: '⚡',
    title: 'Re-run the time-blocker any Monday',
    body: 'Your schedule changes week to week. Open Settings → Tours & Help → "Reset Week Block" to re-run the Monday time-blocker any time.',
    page: '/schedule',
  },
  // General
  {
    id: 'general-goals-progress',
    category: 'general',
    icon: '🎯',
    title: 'Update your goal progress weekly',
    body: 'GenesisOS can\'t auto-update goal % for weight loss goals. Log your weight in Health and manually bump the goal % each Sunday.',
    page: '/goals',
  },
  {
    id: 'general-journal',
    category: 'general',
    icon: '📓',
    title: 'Journal entries fuel AI context',
    body: 'Writing a 2-3 sentence journal entry daily gives Claude context for your mood and energy patterns — improving morning brief quality.',
  },
];

// ─── Read state helpers ───────────────────────────────────────────────────────

const KEY_PREFIX = 'genesisOS_tip_read_';

export function isTipRead(id: string): boolean {
  return !!localStorage.getItem(KEY_PREFIX + id);
}

export function markTipRead(id: string): void {
  localStorage.setItem(KEY_PREFIX + id, Date.now().toString());
}

export function resetAllTips(): void {
  for (const tip of ALL_TIPS) {
    localStorage.removeItem(KEY_PREFIX + tip.id);
  }
}

export function getUnreadTips(page?: string): Tip[] {
  return ALL_TIPS.filter(t => {
    if (isTipRead(t.id)) return false;
    if (t.page && page && t.page !== page) return false;
    return true;
  });
}

/** Get one unread tip relevant to the current page, or any unread tip */
export function getNextTip(page?: string): Tip | null {
  // Prefer page-specific tips first
  const pageTips = page ? ALL_TIPS.filter(t => t.page === page && !isTipRead(t.id)) : [];
  if (pageTips.length > 0) return pageTips[0];

  // Fall back to any unread tip with no page restriction
  const general = ALL_TIPS.filter(t => !t.page && !isTipRead(t.id));
  if (general.length > 0) return general[0];

  return null;
}

export function getReadCount(): number {
  return ALL_TIPS.filter(t => isTipRead(t.id)).length;
}
