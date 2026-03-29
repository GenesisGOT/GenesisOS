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

import { useScheduleStore } from '../useScheduleStore'
import type { Task, ScheduleEvent } from '../../types/database'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-' + Math.random().toString(36).slice(2, 8),
    user_id: 'test-user',
    title: 'Test Task',
    status: 'todo',
    priority: 'medium',
    created_at: '2026-03-29T00:00:00Z',
    is_deleted: false,
    is_recurring: false,
    ...overrides,
  } as Task
}

function makeEvent(overrides: Partial<ScheduleEvent> = {}): ScheduleEvent {
  return {
    id: 'evt-' + Math.random().toString(36).slice(2, 8),
    user_id: 'test-user',
    title: 'Test Event',
    start_time: '2026-03-29T10:00:00Z',
    end_time: '2026-03-29T11:00:00Z',
    date: '2026-03-29',
    is_recurring: false,
    is_deleted: false,
    ...overrides,
  } as ScheduleEvent
}

describe('useScheduleStore', () => {
  beforeEach(() => {
    useScheduleStore.setState({
      tasks: [],
      events: [],
      loading: false,
      lastFetched: null,
      isOffline: false,
    })
  })

  it('has correct initial state', () => {
    const state = useScheduleStore.getState()
    expect(state.tasks).toEqual([])
    expect(state.events).toEqual([])
    expect(state.loading).toBe(false)
  })

  describe('getTasksForDate', () => {
    it('returns tasks matching due_date', () => {
      const t1 = makeTask({ id: 't1', due_date: '2026-03-29' })
      const t2 = makeTask({ id: 't2', due_date: '2026-03-30' })
      useScheduleStore.setState({ tasks: [t1, t2] })

      const result = useScheduleStore.getState().getTasksForDate('2026-03-29')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('t1')
    })

    it('returns tasks completed on the given date', () => {
      const t1 = makeTask({ id: 't1', completed_at: '2026-03-29T15:00:00Z' })
      useScheduleStore.setState({ tasks: [t1] })

      const result = useScheduleStore.getState().getTasksForDate('2026-03-29')
      expect(result).toHaveLength(1)
    })

    it('returns empty array when no tasks match', () => {
      const t1 = makeTask({ id: 't1', due_date: '2026-04-01' })
      useScheduleStore.setState({ tasks: [t1] })

      const result = useScheduleStore.getState().getTasksForDate('2026-03-29')
      expect(result).toHaveLength(0)
    })
  })

  describe('getOverdueTasks', () => {
    it('returns tasks with due_date before reference and not done', () => {
      const overdue = makeTask({ id: 'overdue', due_date: '2026-03-25', status: 'todo' })
      const onTime = makeTask({ id: 'ontime', due_date: '2026-03-30', status: 'todo' })
      const done = makeTask({ id: 'done', due_date: '2026-03-20', status: 'done' })
      useScheduleStore.setState({ tasks: [overdue, onTime, done] })

      const result = useScheduleStore.getState().getOverdueTasks('2026-03-29')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('overdue')
    })

    it('returns empty when all tasks are on time or done', () => {
      const t1 = makeTask({ due_date: '2026-04-01', status: 'todo' })
      const t2 = makeTask({ due_date: '2026-03-20', status: 'done' })
      useScheduleStore.setState({ tasks: [t1, t2] })

      const result = useScheduleStore.getState().getOverdueTasks('2026-03-29')
      expect(result).toHaveLength(0)
    })
  })

  describe('getSubtasks', () => {
    it('returns child tasks sorted by created_at', () => {
      const parent = makeTask({ id: 'parent' })
      const sub1 = makeTask({ id: 's1', parent_task_id: 'parent', created_at: '2026-03-29T01:00:00Z' })
      const sub2 = makeTask({ id: 's2', parent_task_id: 'parent', created_at: '2026-03-29T02:00:00Z' })
      const unrelated = makeTask({ id: 'u1', parent_task_id: 'other-parent' })
      useScheduleStore.setState({ tasks: [parent, sub1, sub2, unrelated] })

      const subs = useScheduleStore.getState().getSubtasks('parent')
      expect(subs).toHaveLength(2)
      expect(subs[0].id).toBe('s1')
      expect(subs[1].id).toBe('s2')
    })

    it('excludes deleted subtasks', () => {
      const sub = makeTask({ id: 's1', parent_task_id: 'parent', is_deleted: true })
      useScheduleStore.setState({ tasks: [sub] })

      const subs = useScheduleStore.getState().getSubtasks('parent')
      expect(subs).toHaveLength(0)
    })
  })

  describe('fetchEventsForDay', () => {
    it('returns events that overlap with the given date', () => {
      const e1 = makeEvent({ id: 'e1', start_time: '2026-03-29T10:00:00Z', end_time: '2026-03-29T11:00:00Z' })
      const e2 = makeEvent({ id: 'e2', start_time: '2026-03-30T10:00:00Z', end_time: '2026-03-30T11:00:00Z' })
      useScheduleStore.setState({ events: [e1, e2] })

      const result = useScheduleStore.getState().fetchEventsForDay('2026-03-29')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('e1')
    })
  })
})
