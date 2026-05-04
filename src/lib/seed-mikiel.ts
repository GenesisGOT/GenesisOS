/**
 * GenesisOS — Mikiel Profile Seed
 *
 * Auto-runs once on first boot. Populates:
 *   - User profile (name, height, weight, goals)
 *   - 5 daily/weekly habits
 *   - Health baseline entry
 *   - Nutrition preferences (1500-1600 cal, 2pm-7pm IF window)
 *   - AI settings (OpenRouter → Claude Sonnet)
 *
 * Guarded by localStorage key so it only ever runs once.
 */

import { localInsert, localUpdate, localGet } from './local-db';

const SEED_KEY = 'genesisOS_seeded_mikiel_v2';
const AI_SETTINGS_KEY = 'genesisOS-ai-settings';

function uid(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function getLocalUserId(): string {
  return (
    localStorage.getItem('genesisOS_local_user_id') || 'local-user-001'
  );
}

export async function seedMikielProfile(): Promise<void> {
  if (localStorage.getItem(SEED_KEY)) return;

  const userId = getLocalUserId();
  const ts = now();

  // ── 1. AI Settings (OpenRouter → Claude Sonnet) ──────────────────────────
  const apiKey =
    (import.meta as any).env?.VITE_OPENROUTER_API_KEY || '';

  localStorage.setItem(
    AI_SETTINGS_KEY,
    JSON.stringify({
      provider: 'openrouter',
      model: 'anthropic/claude-sonnet-4',
      apiKey,
      enabled: true,
      proxyUrl: '',
    }),
  );

  // ── 2. User Profile ───────────────────────────────────────────────────────
  const preferences = {
    display_name: 'Mikiel',
    nutrition: {
      daily_calories_min: 1500,
      daily_calories_max: 1600,
      eating_window_start: '14:00', // 2 pm
      eating_window_end: '19:00',   // 7 pm
      intermittent_fasting: true,
    },
    health: {
      height_cm: 172.72,       // 5'8"
      current_weight_kg: 83.91, // 185 lbs
      goal_weight_kg: 74.84,   // 165 lbs
      sleep_goal_hours: 7,
    },
    ai: {
      morning_brief: true,
      weekly_review: true,
      pattern_learning: true,
    },
  };

  try {
    const existing = await localGet<any>('user_profile', userId);
    if (existing) {
      await localUpdate('user_profile', userId, {
        display_name: 'Mikiel',
        occupation: 'Personal',
        primary_focus: 'Health & Productivity',
        onboarding_complete: true,
        preferences,
        updated_at: ts,
      });
    } else {
      await localInsert('user_profile', {
        user_id: userId,
        display_name: 'Mikiel',
        occupation: 'Personal',
        primary_focus: 'Health & Productivity',
        onboarding_complete: true,
        preferences,
        created_at: ts,
        updated_at: ts,
        synced: false,
      });
    }
  } catch (e) {
    console.warn('[seed] profile update failed:', e);
  }

  // ── 3. Habits ─────────────────────────────────────────────────────────────
  const habits = [
    {
      id: uid(),
      user_id: userId,
      title: '20 min room cleaning',
      description: 'Keep your space clean — 20 minutes daily',
      icon: '🧹',
      frequency: 'daily' as const,
      target_count: 1,
      duration_minutes: 20,
      category: 'lifestyle',
      color: '#4ECDC4',
      time_of_day: 'evening',
      streak_current: 0,
      streak_best: 0,
      is_active: true,
      is_deleted: false,
      created_at: ts,
      updated_at: ts,
      synced: false,
    },
    {
      id: uid(),
      user_id: userId,
      title: 'No smoking',
      description: 'Stay smoke-free today',
      icon: '🚭',
      frequency: 'daily' as const,
      target_count: 1,
      category: 'health',
      color: '#FF6B6B',
      streak_current: 0,
      streak_best: 0,
      is_active: true,
      is_deleted: false,
      created_at: ts,
      updated_at: ts,
      synced: false,
    },
    {
      id: uid(),
      user_id: userId,
      title: 'No gooning',
      description: 'Protect your energy and focus',
      icon: '🧠',
      frequency: 'daily' as const,
      target_count: 1,
      category: 'mindset',
      color: '#A29BFE',
      streak_current: 0,
      streak_best: 0,
      is_active: true,
      is_deleted: false,
      created_at: ts,
      updated_at: ts,
      synced: false,
    },
    {
      id: uid(),
      user_id: userId,
      title: 'Morning stretches',
      description: 'Mandatory morning stretch routine',
      icon: '🧘',
      frequency: 'daily' as const,
      target_count: 1,
      category: 'health',
      color: '#FDCB6E',
      time_of_day: 'morning',
      streak_current: 0,
      streak_best: 0,
      is_active: true,
      is_deleted: false,
      created_at: ts,
      updated_at: ts,
      synced: false,
    },
    {
      id: uid(),
      user_id: userId,
      title: 'Sunday meal prep',
      description: '2-hour meal prep every Sunday for the week',
      icon: '🥗',
      frequency: 'weekly' as const,
      target_count: 1,
      duration_minutes: 120,
      category: 'nutrition',
      color: '#55EFC4',
      streak_current: 0,
      streak_best: 0,
      is_active: true,
      is_deleted: false,
      created_at: ts,
      updated_at: ts,
      synced: false,
    },
  ];

  for (const habit of habits) {
    try {
      await localInsert('habits', habit);
    } catch (e) {
      console.warn('[seed] habit insert failed (may exist):', habit.title);
    }
  }

  // ── 4. Health baseline ────────────────────────────────────────────────────
  try {
    await localInsert('health_metrics', {
      id: uid(),
      user_id: userId,
      date: today(),
      weight_kg: 83.91, // 185 lbs starting weight
      sleep_hours: 7,
      energy_score: 3,
      mood_score: 3,
      water_glasses: 0,
      notes: 'Starting baseline — goal: 165 lbs',
      created_at: ts,
      updated_at: ts,
      synced: false,
    });
  } catch (e) {
    console.warn('[seed] health baseline failed (may exist):', e);
  }

  // ── 5. Weight-loss goal ───────────────────────────────────────────────────
  try {
    await localInsert('goals', {
      id: uid(),
      user_id: userId,
      title: 'Reach 165 lbs',
      description:
        'Drop from 185 lbs to 165 lbs through IF (2pm–7pm), 1500–1600 cal/day and daily habits.',
      category: 'health',
      status: 'active',
      priority: 'high',
      progress: 0,
      target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      is_deleted: false,
      created_at: ts,
      updated_at: ts,
      synced: false,
    });
  } catch (e) {
    console.warn('[seed] goal insert failed:', e);
  }

  // ── 6. Morning brief journal entry (welcome message) ─────────────────────
  try {
    await localInsert('journal_entries', {
      id: uid(),
      user_id: userId,
      date: today(),
      title: 'Welcome to GenesisOS, Mikiel 👋',
      content:
        "Your personal AI life OS is ready. Here's your setup:\n\n" +
        '**Daily Habits:** Room cleaning · No smoking · No gooning · Morning stretches\n' +
        '**Weekly:** Sunday meal prep (2 hrs)\n' +
        '**Nutrition:** 1500–1600 cal/day · Eating window 2pm–7pm\n' +
        '**Goal:** 185 lbs → 165 lbs\n' +
        '**Sleep target:** 7+ hours\n\n' +
        'Claude is monitoring your patterns and will generate daily morning briefs and weekly reviews. Start logging your habits today!',
      mood: 'motivated',
      energy_level: 4,
      tags: ['setup', 'welcome'],
      is_deleted: false,
      created_at: ts,
      updated_at: ts,
      synced: false,
    });
  } catch (e) {
    console.warn('[seed] welcome journal failed:', e);
  }

  localStorage.setItem(SEED_KEY, 'true');
  console.log('[GenesisOS] ✅ Mikiel profile seeded — AI ready, habits loaded');
}
