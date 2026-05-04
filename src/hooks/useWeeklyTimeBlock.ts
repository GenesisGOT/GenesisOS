/**
 * useWeeklyTimeBlock
 *
 * Detects Monday boot and returns whether the time-blocking modal
 * should be shown to Mikiel this week.
 *
 * Logic:
 *  - Returns shouldPrompt = true when: today is Monday AND this week's
 *    time-block key is not set in localStorage.
 *  - dismiss() — snoozes until next Monday (user skipped)
 *  - complete() — marks the week as done (user saved the schedule)
 */

import { useState, useEffect, useCallback } from 'react';
import { getWeekKey, getThisMonday } from '../lib/llm/time-blocker';

function isMondayToday(): boolean {
  return new Date().getDay() === 1;
}

function thisWeekIsDone(): boolean {
  return !!localStorage.getItem(getWeekKey());
}

export function useWeeklyTimeBlock() {
  const [shouldPrompt, setShouldPrompt] = useState(false);

  useEffect(() => {
    // Small delay so the app can finish its initial render before showing modal
    const t = setTimeout(() => {
      if (isMondayToday() && !thisWeekIsDone()) {
        setShouldPrompt(true);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  const dismiss = useCallback(() => {
    // Snooze: mark as done so it doesn't re-appear on subsequent boots today
    localStorage.setItem(getWeekKey(), 'dismissed');
    setShouldPrompt(false);
  }, []);

  const complete = useCallback(() => {
    // Already set by saveTimeBlocks(), just close the modal
    setShouldPrompt(false);
  }, []);

  return { shouldPrompt, dismiss, complete };
}
