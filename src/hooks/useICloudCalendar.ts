/**
 * useICloudCalendar — Fetches iCloud Calendar events via CalDAV and merges
 * them with the GenesisOS schedule.
 *
 * Polls every 5 minutes when connected. Transforms ICloudCalendarEvent[]
 * into a ScheduleEvent-compatible shape with source: 'icloud'.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchICloudEvents,
  loadICloudCredentials,
  type ICloudCalendarEvent,
} from '../lib/integrations/icloud-calendar';

const POLL_INTERVAL_MS = 5 * 60 * 1000;

export interface ICloudScheduleEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  date: string;
  location?: string;
  color: string;
  source: 'icloud';
  calendarName?: string;
  is_deleted: boolean;
  is_recurring: boolean;
  status: 'scheduled';
  event_type: 'icloud';
  all_day?: boolean;
}

export function useICloudCalendar(enabled = true) {
  const [events, setEvents] = useState<ICloudScheduleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(() => !!loadICloudCredentials());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchEvents = useCallback(async () => {
    const creds = loadICloudCredentials();
    if (!creds || !enabled) {
      setEvents([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const raw = await fetchICloudEvents(creds, 14);
      setEvents(raw.map(transformEvent));
      setLastSynced(new Date());
    } catch (err) {
      console.error('[iCloudCalendar] Fetch failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch iCloud events');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // Sync on mount and poll every 5 minutes
  useEffect(() => {
    if (!isConnected || !enabled) return;

    fetchEvents();
    intervalRef.current = setInterval(fetchEvents, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isConnected, enabled, fetchEvents]);

  const connect = useCallback(() => setIsConnected(true), []);
  const disconnect = useCallback(() => {
    setIsConnected(false);
    setEvents([]);
    setLastSynced(null);
  }, []);

  return {
    icloudEvents: events,
    loading,
    lastSynced,
    error,
    eventCount: events.length,
    isConnected,
    connect,
    disconnect,
    refetch: fetchEvents,
  };
}

function transformEvent(event: ICloudCalendarEvent): ICloudScheduleEvent {
  const startDate = event.start ? event.start.split('T')[0] : new Date().toISOString().split('T')[0];

  return {
    id: `icloud-${event.id}`,
    title: event.summary || 'Untitled',
    description: event.description,
    start_time: event.start,
    end_time: event.end,
    date: startDate,
    location: event.location,
    calendarName: event.calendarName,
    color: '#147EFB', // Apple blue
    source: 'icloud',
    is_deleted: false,
    is_recurring: false,
    status: 'scheduled',
    event_type: 'icloud',
    all_day: event.allDay,
  };
}
