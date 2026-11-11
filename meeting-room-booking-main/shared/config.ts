export const ROOMS = [
  {
    id: "ROOM_1",
    name: "ห้องประชุม 1",
    title: "ห้อง 1",
    capacityText: "ขนาด 15 คนขึ้นไป",
    image: "/images/room-1.jpg",
    calendarColorId: "7",
  },
  {
    id: "ROOM_2",
    name: "ห้องประชุม 2",
    title: "ห้อง 2",
    capacityText: "ขนาด 10-15 คน",
    image: "/images/room-2.jpg",
    calendarColorId: "4",
  },
  {
    id: "ROOM_3",
    name: "ห้องประชุม 3",
    title: "ห้อง 3",
    capacityText: "ขนาด 10 คน",
    image: "/images/room-3.jpg",
    calendarColorId: "2",
  },
  {
    id: "COWORKING",
    name: "Co-Working Space",
    title: "Co-Working Space",
    capacityText: "",
    image: "/images/coworking.jpg",
    calendarColorId: "3",
  },
] as const;
export type RoomId = (typeof ROOMS)[number]["id"];
export const isRoomId = (value: unknown): value is RoomId =>
  ROOMS.some((r) => r.id === value);
export const BUSINESS = {
  timezone: "Asia/Bangkok",
  opening: "08:00",
  closing: "16:30",
  stepMinutes: 30,
  advanceWorkingDays: 1,
} as const;

// Public navigation link only. Calendar API access still uses the server-side
// GOOGLE_CALENDAR_ID and never exposes service-account credentials.
export const GOOGLE_CALENDAR_URL =
  "https://calendar.google.com/calendar/u/0/embed?src=16acb614afac6e761233923c8663128b8ee6858465872ab6086888ed162177b4@group.calendar.google.com&ctz=Asia/Bangkok";

export const EQUIPMENT = {
  TV: "จอโทรทัศน์",
  INTERNET: "อินเตอร์เน็ต",
} as const;
