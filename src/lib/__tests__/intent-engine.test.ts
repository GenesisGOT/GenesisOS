import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock heavy dependencies
vi.mock('../supabase', () => ({ supabase: {} }))
vi.mock('../../stores/useUserStore', () => ({
  useUserStore: { getState: () => ({ getSessionCached: () => Promise.resolve({ data: { session: null } }) }) },
}))
vi.mock('../../stores/useScheduleStore', () => ({
  useScheduleStore: { getState: () => ({ fetchAll: vi.fn(), tasks: [], events: [] }) },
}))
vi.mock('../../stores/useGoalsStore', () => ({
  useGoalsStore: { getState: () => ({ fetchAll: vi.fn(), goals: [], businesses: [] }) },
}))
vi.mock('../../stores/useHabitsStore', () => ({
  useHabitsStore: { getState: () => ({ fetchAll: vi.fn(), habits: [] }) },
}))
vi.mock('../../stores/useFinanceStore', () => ({
  useFinanceStore: { getState: () => ({ fetchAll: vi.fn(), expenses: [], categories: [] }) },
}))
vi.mock('../../stores/useHealthStore', () => ({
  useHealthStore: { getState: () => ({ fetchToday: vi.fn(), todayMetrics: null }) },
}))
vi.mock('../schedule-events', () => ({ createScheduleEvent: vi.fn() }))
vi.mock('../smart-scheduler', () => ({ scheduleObjectiveTasks: vi.fn() }))
vi.mock('../life-planner', () => ({ schedulePreloadedTasks: vi.fn() }))
vi.mock('../llm/response-patterns', () => ({
  quickClassify: vi.fn().mockReturnValue(null),
  validateIntentResult: vi.fn((r: any) => r),
}))
vi.mock('../sync-engine', () => ({
  syncNow: vi.fn(),
  syncNowImmediate: vi.fn(),
  waitForInitialSync: vi.fn(),
}))
vi.mock('../../utils/error', () => ({ getErrorMessage: (e: any) => String(e) }))
vi.mock('../../utils/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() } }))

import { buildSystemPrompt, getAISettings, saveAISettings } from '../intent-engine'
import type { IntentContext } from '../intent-engine'

function makeContext(overrides: Partial<IntentContext> = {}): IntentContext {
  return {
    userId: 'user-123',
    userName: 'Teddy',
    today: '2026-03-29',
    tomorrow: '2026-03-30',
    currentTime: '10:30',
    utcOffset: '+11:00',
    timezone: 'Australia/Melbourne',
    categories: [],
    businesses: [],
    topGoals: [],
    goalTree: [],
    recentTasks: [],
    recentEvents: [],
    recentExpenses: [],
    activeGroceryLists: [],
    todayHealth: null,
    habits: [],
    ...overrides,
  }
}

describe('buildSystemPrompt', () => {
  it('returns a string containing the user name', () => {
    const prompt = buildSystemPrompt(makeContext({ userName: 'TestUser' }))
    expect(prompt).toContain('TestUser')
  })

  it('includes the current date context', () => {
    const prompt = buildSystemPrompt(makeContext({ today: '2026-03-29' }))
    expect(prompt).toContain('2026-03-29')
  })

  it('includes timezone offset in time rules', () => {
    const prompt = buildSystemPrompt(makeContext({ utcOffset: '+11:00' }))
    expect(prompt).toContain('+11:00')
  })

  it('lists expense categories when provided', () => {
    const ctx = makeContext({
      categories: [{ id: 'cat-1', name: 'Food & Groceries', icon: '🍕', scope: 'personal' }],
    })
    const prompt = buildSystemPrompt(ctx)
    expect(prompt).toContain('Food & Groceries')
    expect(prompt).toContain('cat-1')
  })

  it('shows active habits when provided', () => {
    const ctx = makeContext({
      habits: [{ id: 'h1', title: 'Morning Run', streak_current: 7 }],
    })
    const prompt = buildSystemPrompt(ctx)
    expect(prompt).toContain('Morning Run')
    expect(prompt).toContain('streak: 7')
  })

  it('includes goal tree hierarchy', () => {
    const ctx = makeContext({
      goalTree: [
        { id: 'obj-1', title: 'Health & Fitness', category: 'objective', domain: 'Health', parent_goal_id: null, target_date: null, status: 'active' },
        { id: 'epic-1', title: 'Get Fit', category: 'epic', domain: null, parent_goal_id: 'obj-1', target_date: '2026-06-01', status: 'active' },
      ],
    })
    const prompt = buildSystemPrompt(ctx)
    expect(prompt).toContain('Health & Fitness')
    expect(prompt).toContain('Get Fit')
  })

  it('contains action type definitions', () => {
    const prompt = buildSystemPrompt(makeContext())
    expect(prompt).toContain('"task"')
    expect(prompt).toContain('"expense"')
    expect(prompt).toContain('"grocery_add"')
    expect(prompt).toContain('"health_log"')
    expect(prompt).toContain('"goal_plan"')
  })
})

describe('getAISettings / saveAISettings', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns defaults when nothing is saved', () => {
    const settings = getAISettings()
    expect(settings.provider).toBe('openrouter')
    expect(settings.enabled).toBe(true)
  })

  it('round-trips settings via save/get', () => {
    saveAISettings({
      provider: 'openrouter',
      model: 'google/gemini-2.0-flash-001',
      proxyUrl: '/api/llm-proxy.php',
      enabled: false,
    })
    const loaded = getAISettings()
    expect(loaded.enabled).toBe(false)
    expect(loaded.model).toBe('google/gemini-2.0-flash-001')
  })
})
