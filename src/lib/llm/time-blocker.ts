/**
 * Time-Blocking Engine
 *
 * Monday boot → user pastes work hours → Claude generates a full week of
 * time-blocked schedule events (cleaning, stretches, gym, sleep, meal prep)
 * around the work schedule → saved to local DB.
 */

import { callLLMProxy } from '../llm-proxy';
import { localInsert, localGetAll } from '../local-db';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RawBlock {
  title: string;
  date: string;        // YYYY-MM-DD
  start_time: string;  // HH:MM (24h)
  end_time: string;    // HH:MM (24h)
  event_type: string;
  color: string;
  notes?: string;
}

export interface SavedBlock extends RawBlock {
  id: string;
  saved: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the Monday of the current week as a Date */
export function getThisMonday(): Date {
  const d = new Date();
  const day = d.getDay(); // 0 = Sun, 1 = Mon …
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns the localStorage key for this week's time-block record */
export function getWeekKey(monday?: Date): string {
  const m = monday ?? getThisMonday();
  return `genesisOS_timeblock_${m.toISOString().split('T')[0]}`;
}

/** Seven ISO date strings starting from monday */
function weekDates(monday: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

/** Day name from YYYY-MM-DD */
export function dayName(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(workSchedule: string, dates: string[]): string {
  const [mon, tue, wed, thu, fri, sat, sun] = dates;

  return `You are a precision time-blocking assistant for Mikiel. Generate a complete weekly schedule.

WEEK DATES:
Mon=${mon}, Tue=${tue}, Wed=${wed}, Thu=${thu}, Fri=${fri}, Sat=${sat}, Sun=${sun}

WORK SCHEDULE (user input):
${workSchedule}

FIXED RULES — apply every single workday:
1. Before work: "Room cleaning" 20 min → "Morning stretches" 15 min (both BEFORE work start)
2. Work block for every scheduled work day (use event_type "work")
3. Sleep block: 7.5 hours every night. If work starts 9am → wake 7:45am → sleep previous night at 11:30pm → sleep_end next morning 7:15am. Adjust per day. Use event_type "sleep". The sleep START is the evening of that day's date, end is the next calendar day's morning — use the next day's date for end_time calculation but put the sleep event on the night-of date.
4. EATING WINDOW: Mikiel does intermittent fasting — eating only 2pm–7pm. Add one "Eating Window" block 14:00–19:00 every day (event_type "meal").
5. Gym: 3 sessions this week (Mon, Wed, Fri preferred), 60 min each. If work goes to evening, schedule gym in morning before work. Otherwise after work. Use event_type "exercise".
6. Sunday: "Meal Prep" 10:00–12:00 (event_type "meal").
7. Fill remaining morning/evening gaps with "Personal Time" blocks (event_type "personal").

COLOR MAP:
- work → #6C63FF
- sleep → #1A2744
- habit (cleaning/stretches) → #4ECDC4
- stretches specifically → #FDCB6E
- exercise → #FF6B6B
- meal / meal prep / eating window → #55EFC4
- personal → #A29BFE

IMPORTANT:
- Use 24-hour HH:MM format for all times.
- Output ONLY a raw JSON array. No markdown fences. No explanation. No extra keys.
- Every object must have exactly: title, date, start_time, end_time, event_type, color, notes.
- Do not overlap blocks. If two would overlap, shorten the earlier one.
- Cleaning uses event_type "habit", stretches uses event_type "habit".

Return a JSON array like:
[{"title":"Work","date":"${mon}","start_time":"09:00","end_time":"17:00","event_type":"work","color":"#6C63FF","notes":""},...]`;
}

// ─── LLM call ─────────────────────────────────────────────────────────────────

/** Calls Claude and returns parsed time blocks for the week */
export async function generateTimeBlocks(workSchedule: string): Promise<RawBlock[]> {
  const monday = getThisMonday();
  const dates = weekDates(monday);

  const prompt = buildPrompt(workSchedule.trim(), dates);

  const response = await callLLMProxy(prompt, {
    model: 'anthropic/claude-sonnet-4',
    format: 'json',
    timeoutMs: 45000,
  });

  let text = response.content.trim();

  // Strip markdown fences if the model ignores the instruction
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed: RawBlock[] = JSON.parse(text);

  // Validate shape — keep only well-formed blocks
  return parsed.filter(
    b =>
      b.title &&
      b.date &&
      /^\d{4}-\d{2}-\d{2}$/.test(b.date) &&
      /^\d{2}:\d{2}$/.test(b.start_time) &&
      /^\d{2}:\d{2}$/.test(b.end_time),
  );
}

// ─── Save to DB ───────────────────────────────────────────────────────────────

/** Deletes AI-generated blocks for the week and inserts the new set */
export async function saveTimeBlocks(blocks: RawBlock[]): Promise<void> {
  const userId =
    localStorage.getItem('genesisOS_local_user_id') || 'local-user-001';

  // Remove any previously generated time-block events for this week
  // (identified by metadata.source === 'time-blocker')
  try {
    const existing = await localGetAll<any>('schedule_events');
    const monday = getThisMonday();
    const dates = new Set(weekDates(monday));

    for (const ev of existing) {
      if (
        !ev.is_deleted &&
        dates.has(ev.date) &&
        ev.metadata?.source === 'time-blocker'
      ) {
        // Soft-delete
        await localInsert('schedule_events', { ...ev, is_deleted: true });
      }
    }
  } catch {
    // Non-fatal — old events may linger but new ones will be added
  }

  const now = new Date().toISOString();

  for (const block of blocks) {
    await localInsert('schedule_events', {
      id: crypto.randomUUID(),
      user_id: userId,
      title: block.title,
      description: block.notes || '',
      date: block.date,
      start_time: `${block.date}T${block.start_time}:00`,
      end_time: `${block.date}T${block.end_time}:00`,
      event_type: block.event_type,
      color: block.color,
      status: 'scheduled',
      is_recurring: false,
      is_deleted: false,
      source: 'time-blocker',
      metadata: { source: 'time-blocker', rawStartTime: block.start_time, rawEndTime: block.end_time },
      schedule_layer: block.event_type === 'work' ? 'primary' : 'operations',
      created_at: now,
      updated_at: now,
      synced: false,
    });
  }

  // Mark this week as done
  localStorage.setItem(getWeekKey(), new Date().toISOString());
}

// ─── Group by day (UI helper) ─────────────────────────────────────────────────

export function groupBlocksByDay(blocks: RawBlock[]): Record<string, RawBlock[]> {
  const grouped: Record<string, RawBlock[]> = {};
  for (const b of blocks) {
    if (!grouped[b.date]) grouped[b.date] = [];
    grouped[b.date].push(b);
  }
  // Sort each day's blocks by start_time
  for (const date of Object.keys(grouped)) {
    grouped[date].sort((a, b) => a.start_time.localeCompare(b.start_time));
  }
  return grouped;
}
