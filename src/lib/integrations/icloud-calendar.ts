/**
 * iCloud Calendar Integration — CalDAV client
 *
 * Syncs with iCloud Calendar via the CalDAV protocol.
 * All requests are proxied through the Flask backend to avoid CORS restrictions.
 *
 * Users must generate an app-specific password at:
 * https://appleid.apple.com/account/manage → App-Specific Passwords
 */

const PROXY_URL = '/api/icloud-caldav';

const STORAGE_KEY = 'genesisOS_icloud_creds';

export interface ICloudCredentials {
  appleId: string;
  appPassword: string;
}

export interface ICloudCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;   // ISO datetime
  end: string;
  location?: string;
  calendarName?: string;
  allDay?: boolean;
}

// ─── Credential storage (localStorage) ───────────────────────────────────────

export function saveICloudCredentials(creds: ICloudCredentials): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
}

export function loadICloudCredentials(): ICloudCredentials | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearICloudCredentials(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Proxy helpers ────────────────────────────────────────────────────────────

async function proxyRequest(
  action: string,
  credentials: ICloudCredentials,
  params: Record<string, unknown> = {},
) {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      apple_id: credentials.appleId,
      app_password: credentials.appPassword,
      ...params,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `iCloud CalDAV error: ${res.status}`);
  }

  return res.json();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Verify that the credentials are valid and can reach iCloud Calendar. */
export async function testICloudConnection(credentials: ICloudCredentials): Promise<boolean> {
  try {
    const data = await proxyRequest('test_connection', credentials);
    return !!data.success;
  } catch {
    return false;
  }
}

/** Fetch upcoming events from all iCloud calendars. */
export async function fetchICloudEvents(
  credentials: ICloudCredentials,
  days = 14,
): Promise<ICloudCalendarEvent[]> {
  try {
    const data = await proxyRequest('fetch_events', credentials, { days });
    return data.events ?? [];
  } catch (err) {
    console.error('[iCloud Calendar] fetchICloudEvents failed:', err);
    return [];
  }
}
