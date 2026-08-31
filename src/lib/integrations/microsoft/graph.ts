'use client';

/**
 * Zugriff auf Microsoft Graph.
 *
 * Nur die beiden Bereiche, die der Abgleich braucht: Nachrichten aus Outlook
 * lesen und Termine im Kalender lesen, anlegen, aendern und entfernen. Es
 * werden keine Daten an Dritte gesendet und nichts in Outlook geloescht, was
 * nicht aus Facility365 stammt.
 */
import { GraphConfig, accessToken } from '@/lib/integrations/microsoft/auth';

/** Kennzeichnung, an der Facility365 die eigenen Termine in Outlook erkennt. */
export const GRAPH_CATEGORY = 'Facility365';

export interface GraphMessage {
  id: string;
  subject: string;
  preview: string;
  fromName: string;
  fromAddress: string;
  receivedAt: string;
  webLink: string;
  categories: string[];
  isRead: boolean;
}

export interface GraphEvent {
  id: string;
  subject: string;
  preview: string;
  location: string;
  /** Beginn als ISO-Datum und Uhrzeit HH:MM in der Zeitzone des Geraets. */
  date: string;
  time: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
  organizer: string;
  attendees: string[];
  lastModified: string;
  categories: string[];
}

export interface GraphAccount {
  displayName: string;
  mail: string;
}

interface GraphList<T> {
  value?: T[];
}

const BASE = 'https://graph.microsoft.com/v1.0';

const graphFetch = async <T>(
  config: GraphConfig,
  path: string,
  init: RequestInit = {},
): Promise<T> => {
  const token = await accessToken(config);
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    /** Fehlermeldungen von Microsoft bleiben aussen vor; nur der Status wird gezeigt. */
    throw new Error(response.status === 401 || response.status === 403 ? 'denied' : 'request');
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
};

export const graphAccount = async (config: GraphConfig): Promise<GraphAccount> => {
  const me = await graphFetch<{ displayName?: string; mail?: string; userPrincipalName?: string }>(
    config,
    '/me?$select=displayName,mail,userPrincipalName',
  );
  return { displayName: me.displayName ?? '', mail: me.mail ?? me.userPrincipalName ?? '' };
};

interface RawMessage {
  id: string;
  subject?: string;
  bodyPreview?: string;
  receivedDateTime?: string;
  webLink?: string;
  categories?: string[];
  isRead?: boolean;
  from?: { emailAddress?: { name?: string; address?: string } };
}

/** Neueste Nachrichten des Posteingangs. */
export const listMessages = async (
  config: GraphConfig,
  folder: string,
  top: number,
): Promise<GraphMessage[]> => {
  const path =
    `/me/mailFolders/${encodeURIComponent(folder || 'inbox')}/messages` +
    `?$top=${top}&$orderby=receivedDateTime desc` +
    '&$select=id,subject,bodyPreview,receivedDateTime,webLink,categories,isRead,from';
  const data = await graphFetch<GraphList<RawMessage>>(config, path);
  return (data.value ?? []).map((item) => ({
    id: item.id,
    subject: item.subject ?? '',
    preview: item.bodyPreview ?? '',
    fromName: item.from?.emailAddress?.name ?? '',
    fromAddress: item.from?.emailAddress?.address ?? '',
    receivedAt: item.receivedDateTime ?? '',
    webLink: item.webLink ?? '',
    categories: item.categories ?? [],
    isRead: item.isRead ?? false,
  }));
};

/** Vermerkt in Outlook, dass aus der Nachricht ein Auftrag entstanden ist. */
export const markMessageHandled = (config: GraphConfig, message: GraphMessage): Promise<void> =>
  graphFetch<void>(config, `/me/messages/${message.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      categories: Array.from(new Set([...message.categories, GRAPH_CATEGORY])),
      isRead: true,
    }),
  });

interface RawEvent {
  id: string;
  subject?: string;
  bodyPreview?: string;
  isAllDay?: boolean;
  lastModifiedDateTime?: string;
  categories?: string[];
  location?: { displayName?: string };
  start?: { dateTime?: string };
  end?: { dateTime?: string };
  organizer?: { emailAddress?: { name?: string; address?: string } };
  attendees?: { emailAddress?: { name?: string; address?: string } }[];
}

const splitDateTime = (value: string): [string, string] => {
  if (!value) return ['', ''];
  const [date, rest] = value.split('T');
  return [date ?? '', (rest ?? '').slice(0, 5)];
};

const toEvent = (item: RawEvent): GraphEvent => {
  const [date, time] = splitDateTime(item.start?.dateTime ?? '');
  const [endDate, endTime] = splitDateTime(item.end?.dateTime ?? '');
  return {
    id: item.id,
    subject: item.subject ?? '',
    preview: item.bodyPreview ?? '',
    location: item.location?.displayName ?? '',
    date,
    time: item.isAllDay ? '' : time,
    endDate,
    endTime: item.isAllDay ? '' : endTime,
    allDay: item.isAllDay ?? false,
    organizer: item.organizer?.emailAddress?.address ?? '',
    attendees: (item.attendees ?? [])
      .map((entry) => entry.emailAddress?.address ?? '')
      .filter(Boolean),
    lastModified: item.lastModifiedDateTime ?? '',
    categories: item.categories ?? [],
  };
};

/** Termine des Zeitraums; die Zeiten kommen in der Zeitzone des Geraets. */
export const listEvents = async (
  config: GraphConfig,
  from: string,
  to: string,
): Promise<GraphEvent[]> => {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const path =
    `/me/calendarView?startDateTime=${from}T00:00:00&endDateTime=${to}T23:59:59` +
    '&$top=200&$orderby=start/dateTime' +
    '&$select=id,subject,bodyPreview,isAllDay,lastModifiedDateTime,categories,location,start,end,organizer,attendees';
  const data = await graphFetch<GraphList<RawEvent>>(config, path, {
    headers: { Prefer: `outlook.timezone="${zone}"` },
  });
  return (data.value ?? []).map(toEvent);
};

export interface EventDraft {
  subject: string;
  body: string;
  location: string;
  date: string;
  time: string;
}

const eventBody = (draft: EventDraft) => {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const start = draft.time ? `${draft.date}T${draft.time}:00` : `${draft.date}T08:00:00`;
  const endHour = draft.time ? Number(draft.time.slice(0, 2)) + 1 : 9;
  const end = `${draft.date}T${String(Math.min(endHour, 23)).padStart(2, '0')}:${draft.time ? draft.time.slice(3, 5) : '00'}:00`;
  return {
    subject: draft.subject,
    body: { contentType: 'text', content: draft.body },
    location: { displayName: draft.location },
    start: { dateTime: start, timeZone: zone },
    end: { dateTime: end, timeZone: zone },
    categories: [GRAPH_CATEGORY],
  };
};

export const createEvent = async (config: GraphConfig, draft: EventDraft): Promise<string> => {
  const created = await graphFetch<{ id: string }>(config, '/me/events', {
    method: 'POST',
    body: JSON.stringify(eventBody(draft)),
  });
  return created.id;
};

export const updateEvent = (
  config: GraphConfig,
  id: string,
  draft: EventDraft,
): Promise<void> =>
  graphFetch<void>(config, `/me/events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(eventBody(draft)),
  });
