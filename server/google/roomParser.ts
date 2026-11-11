import { isRoomId, type RoomId } from "../../shared/config";
export interface CalendarEvent {
  id?: string;
  summary?: string;
  status?: string;
  transparency?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  extendedProperties?: { private?: Record<string, string> };
}
export function parseRoomFromEvent(event: CalendarEvent): RoomId | "UNKNOWN" {
  const explicit = event.extendedProperties?.private?.room_id;
  if (explicit !== undefined) return isRoomId(explicit) ? explicit : "UNKNOWN";
  const title = (event.summary ?? "").normalize("NFKC");
  const matches = new Set<RoomId>();
  for (const m of title.matchAll(/ห้อง\s*(?:ประชุม\s*)?([123])(?![0-9])/g))
    matches.add(`ROOM_${m[1]}` as RoomId);
  if (/\bco[\s-]*working(?:\s+space)?\b/i.test(title)) matches.add("COWORKING");
  return matches.size === 1 ? [...matches][0] : "UNKNOWN";
}
