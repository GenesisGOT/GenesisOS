import { describe, it, expect, beforeEach, vi } from 'vitest'
import { calculateStreak } from '../useHabitsStore'
import type { HabitLog } from '../../types/database'

// Mock all heavy dependencies so we can test the pure logic
vi.mock('../../lib/supabase', () => ({ supabase: {} }))
vi.mock('../../lib/offline', () => ({ isOnline: () => true }))
vi.mock('../../components/Toast', () => ({ showToast: vi.fn() }))
vi.mock('../../lib/local-db', () => ({
  localGetAll: vi.fn().mockResolvedValue([]),
  localInsert: vi.fn().mockResolvedValue({ id: 'new-id' }),
  localUpdate: vi.fn().mockResolvedValue({}),
  localDelete: vi.fn().mockResolvedValue({}),
  getLocalUserId: () => 'test-user',
  getEffectiveUserId: () => 'test-user',
}))
vi.mock('../../lib/sync-engine', () => ({
  syncNow: vi.fn().mockResolvedValue(undefined),
  waitForInitialSync: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../useUserStore', () => ({
  useUserStore: { getState: () => ({ getSessionCached: () => Promise.resolve({ data: { session: null } }) }) },
}))
vi.mock('../../utils/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() } }))

function makeLog(habitId: string, date: string): HabitLog {
  return {
    id: `log-${date}`,
    user_id: 'test-user',
    habit_id: habitId,
    date,
    count: 1,
    created_at: `${date}T10:00:00Z`,
  }
}

describe('calculateStreak', () => {
  it('returns { current: 0, best: 0 } when there are no logs', () => {
    const result = calculateStreak('h1', [])
    expect(result).toEqual({ current: 0, best: 0 })
  })

  it('returns { current: 0, best: 0 } when no logs match the habit', () => {
    const logs = [makeLog('other-habit', '2026-03-28')]
    const result = calculateStreak('h1', logs)
    expect(result).toEqual({ current: 0, best: 0 })
  })

  it('calculates a single-day streak correctly', () => {
    // Use today's date so the streak is "current"
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)
    const logs = [makeLog('h1', todayStr)]
    const result = calculateStreak('h1', logs)
    expect(result.current).toBeGreaterThanOrEqual(1)
    expect(result.best).toBeGreaterThanOrEqual(1)
  })

  it('calculates a multi-day consecutive streak', () => {
    const today = new Date()
    const dates: string[] = []
    for (let i = 0; i < 5; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      dates.push(d.toISOString().slice(0, 10))
    }
    const logs = dates.map(d => makeLog('h1', d))
    const result = calculateStreak('h1', logs)
    expect(result.current).toBe(5)
    expect(result.best).toBe(5)
  })

  it('detects a broken current streak but keeps best streak', () => {
    const today = new Date()
    // Log today and yesterday (current streak = 2)
    const d0 = today.toISOString().slice(0, 10)
    const d1 = new Date(today); d1.setDate(d1.getDate() - 1)
    // Gap on day -2
    // Then 4 consecutive days starting day -3
    const oldDates: string[] = []
    for (let i = 3; i < 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      oldDates.push(d.toISOString().slice(0, 10))
    }
    const logs = [
      makeLog('h1', d0),
      makeLog('h1', d1.toISOString().slice(0, 10)),
      ...oldDates.map(d => makeLog('h1', d)),
    ]
    const result = calculateStreak('h1', logs)
    expect(result.current).toBe(2)
    expect(result.best).toBe(4)
  })
})

describe('useHabitsStore selectors (via getState)', () => {
  it('store exports are importable', async () => {
    const mod = await import('../useHabitsStore')
    expect(mod.useHabitsStore).toBeDefined()
    expect(typeof mod.useHabitsStore.getState).toBe('function')
  })

  it('initial state has empty habits and logs', async () => {
    const { useHabitsStore } = await import('../useHabitsStore')
    const state = useHabitsStore.getState()
    expect(state.habits).toEqual([])
    expect(state.logs).toEqual([])
    expect(state.loading).toBe(false)
  })
})
