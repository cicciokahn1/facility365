/**
 * Kalenderdatei fuer Outlook und andere Kalender.
 *
 * Die Termine bleiben in Facility365; die Datei ist eine Kopie zum Einlesen.
 * Sie folgt RFC 5545, damit Outlook, Apple Kalender und Google sie verstehen.
 */
import { CalendarEvent } from '@/lib/calendar/events';

const escape = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

const stamp = (value: Date): string => `${value.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`;

const day = (date: string): string => date.replace(/-/g, '');

/** Ganztagestermin endet am Folgetag; sonst dauert der Termin eine Stunde. */
const timeRange = (date: string, time: string): string[] => {
  if (!time) {
    const next = new Date(`${date}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    return [`DTSTART;VALUE=DATE:${day(date)}`, `DTEND;VALUE=DATE:${day(next.toISOString().slice(0, 10))}`];
  }
  const start = new Date(`${date}T${time}:00`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return [`DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`];
};

export const toIcs = (events: CalendarEvent[], calendarName: string, origin: string): string => {
  const now = stamp(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Facility365//Kalender//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escape(calendarName)}`,
  ];

  events.forEach((event) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@facility365`,
      `DTSTAMP:${now}`,
      ...timeRange(event.date, event.time),
      `SUMMARY:${escape(event.title)}`,
      `URL:${origin}${event.href}`,
      `DESCRIPTION:${escape(`${origin}${event.href}`)}`,
      'END:VEVENT',
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};
