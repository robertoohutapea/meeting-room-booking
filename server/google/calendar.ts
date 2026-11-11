import { BUSINESS, EQUIPMENT, ROOMS, type RoomId } from "../../shared/config";
import { dayBounds, timestamp } from "../../shared/dates";
import type { Booking, BusyPeriod } from "../../shared/types";
import { overlaps } from "../../shared/overlap";
import { ApiError } from "../http";
import { accessToken, type Env } from "./auth";
import { parseRoomFromEvent, type CalendarEvent } from "./roomParser";
export interface CalendarAdapter {
  listDay(date: string): Promise<CalendarEvent[]>;
  insert(booking: Booking): Promise<void>;
}
export function createCalendar(env: Env): CalendarAdapter {
  let token: Promise<string> | undefined;
  async function request(query = "", init?: RequestInit) {
    token ??= accessToken(env);
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(env.GOOGLE_CALENDAR_ID)}/events${query}`,
      {
        ...init,
        headers: {
          Authorization: `Bearer ${await token}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(20000),
      },
    );
    if (!response.ok) {
      console.error("google_calendar_failed", {
        status: response.status,
        operation: init?.method ?? "GET",
      });
      if ([401, 403, 404].includes(response.status))
        throw new ApiError(
          503,
          "CALENDAR_PERMISSION",
          "ระบบไม่สามารถเข้าถึงปฏิทินได้ กรุณาติดต่อผู้ดูแลระบบ",
        );
      throw new Error("GoogleCalendarError");
    }
    return response.json();
  }
  return {
    async listDay(date) {
      const bounds = dayBounds(date);
      const events: CalendarEvent[] = [];
      let pageToken: string | undefined;
      do {
        const query = new URLSearchParams({
          timeMin: bounds.start,
          timeMax: bounds.end,
          singleEvents: "true",
          orderBy: "startTime",
          timeZone: BUSINESS.timezone,
          maxResults: "2500",
        });
        if (pageToken) query.set("pageToken", pageToken);
        const page = (await request(`?${query}`)) as {
          items?: CalendarEvent[];
          nextPageToken?: string;
        };
        events.push(...(page.items ?? []));
        pageToken = page.nextPageToken;
      } while (pageToken);
      return events;
    },
    async insert(booking) {
      await request("", {
        method: "POST",
        body: JSON.stringify(eventPayload(booking)),
      });
    },
  };
}
export function eventPayload(b: Booking) {
  const room = ROOMS.find((r) => r.id === b.roomId)!;
  return {
    summary: `[${room.title}] ${b.subject}`,
    colorId: room.calendarColorId,
    description: `ผู้จอง: ${b.requesterName}\nหน่วยงาน/กลุ่มงาน: ${b.department}\nเบอร์ภายใน: ${b.internalPhone}\nอุปกรณ์: ${b.equipment.map((e) => EQUIPMENT[e]).join(", ") || "ไม่ระบุ"}\nอีเมล: ${b.email}`,
    start: {
      dateTime: timestamp(b.date, b.startTime),
      timeZone: BUSINESS.timezone,
    },
    end: {
      dateTime: timestamp(b.date, b.endTime),
      timeZone: BUSINESS.timezone,
    },
    extendedProperties: {
      private: { room_id: b.roomId },
    },
  };
}
export function busyForRoom(
  events: CalendarEvent[],
  room: RoomId,
  date: string,
): BusyPeriod[] {
  const day = dayBounds(date);
  const busy: BusyPeriod[] = [];
  for (const event of events) {
    if (event.status === "cancelled" || event.transparency === "transparent")
      continue;
    const parsed = parseRoomFromEvent(event);
    if (parsed === "UNKNOWN") {
      console.warn("unknown_legacy_room", {
        eventId: event.id ?? "missing-id",
      });
      continue;
    }
    if (parsed !== room) continue;
    const start =
      event.start?.dateTime ??
      (event.start?.date ? timestamp(event.start.date, "00:00") : "");
    const end =
      event.end?.dateTime ??
      (event.end?.date ? timestamp(event.end.date, "00:00") : "");
    if (
      !Number.isFinite(Date.parse(start)) ||
      !Number.isFinite(Date.parse(end)) ||
      Date.parse(end) <= Date.parse(start)
    )
      throw new Error("InvalidCalendarInterval");
    if (overlaps(day.start, day.end, start, end))
      busy.push({
        start: Date.parse(start) < Date.parse(day.start) ? day.start : start,
        end: Date.parse(end) > Date.parse(day.end) ? day.end : end,
      });
  }
  return busy.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
}
