import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock all heavy dependencies
vi.mock('../../lib/supabase', () => ({ supabase: {} }))
vi.mock('../../lib/offline', () => ({ isOnline: () => true }))
vi.mock('../../components/Toast', () => ({ showToast: vi.fn() }))
vi.mock('../../lib/local-db', () => ({
  localGetAll: vi.fn().mockResolvedValue([]),
  localInsert: vi.fn().mockImplementation((_table: string, data: any) =>
    Promise.resolve({ id: data.id || 'generated-id', ...data })
  ),
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
vi.mock('../../utils/date', () => ({
  genId: () => 'test-id-' + Math.random().toString(36).slice(2, 8),
  localDateStr: () => '2026-03-29',
}))

import { useGoalsStore } from '../useGoalsStore'
import type { GoalNode } from '../useGoalsStore'

function makeGoal(overrides: Partial<GoalNode> = {}): GoalNode {
  return {
    id: 'goal-' + Math.random().toString(36).slice(2, 8),
    user_id: 'test-user',
    title: 'Test Goal',
    status: 'active',
    parent_goal_id: null,
    target_date: null,
    created_at: '2026-01-01T00:00:00Z',
    is_deleted: false,
    icon: '🎯',
    color: '#00D4FF',
    sort_order: 0,
    priority: 'medium',
    ...overrides,
  }
}

describe('useGoalsStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useGoalsStore.setState({
      goals: [],
      businesses: [],
      loading: false,
      lastFetched: null,
    })
  })

  it('has correct initial state', () => {
    const state = useGoalsStore.getState()
    expect(state.goals).toEqual([])
    expect(state.businesses).toEqual([])
    expect(state.loading).toBe(false)
    expect(state.lastFetched).toBeNull()
  })

  it('getObjectives returns only root goals (no parent_goal_id)', () => {
    const obj = makeGoal({ id: 'obj-1', title: 'Objective', category: 'objective' })
    const child = makeGoal({ id: 'child-1', title: 'Child', parent_goal_id: 'obj-1' })
    useGoalsStore.setState({ goals: [obj, child] })

    const objectives = useGoalsStore.getState().getObjectives()
    expect(objectives).toHaveLength(1)
    expect(objectives[0].id).toBe('obj-1')
  })

  it('getObjectives also returns goals with category=objective even if they have parent', () => {
    const goal = makeGoal({ id: 'g1', category: 'objective', parent_goal_id: 'some-parent' })
    useGoalsStore.setState({ goals: [goal] })

    const objectives = useGoalsStore.getState().getObjectives()
    expect(objectives).toHaveLength(1)
  })

  it('getChildren returns only direct children of a parent', () => {
    const parent = makeGoal({ id: 'parent' })
    const child1 = makeGoal({ id: 'c1', parent_goal_id: 'parent' })
    const child2 = makeGoal({ id: 'c2', parent_goal_id: 'parent' })
    const unrelated = makeGoal({ id: 'u1', parent_goal_id: 'other' })

    useGoalsStore.setState({ goals: [parent, child1, child2, unrelated] })

    const children = useGoalsStore.getState().getChildren('parent')
    expect(children).toHaveLength(2)
    expect(children.map(c => c.id)).toContain('c1')
    expect(children.map(c => c.id)).toContain('c2')
  })

  it('getGoalById finds a goal by id', () => {
    const goal = makeGoal({ id: 'find-me', title: 'Found It' })
    useGoalsStore.setState({ goals: [goal] })

    const found = useGoalsStore.getState().getGoalById('find-me')
    expect(found).toBeDefined()
    expect(found!.title).toBe('Found It')
  })

  it('getGoalById returns undefined for nonexistent id', () => {
    const found = useGoalsStore.getState().getGoalById('nope')
    expect(found).toBeUndefined()
  })
})
