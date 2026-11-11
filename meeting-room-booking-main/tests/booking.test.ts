import { describe, it, expect, vi } from "vitest";
import { parseRoomFromEvent } from "../server/google/roomParser";
import { minimumBookingDate, validDate, isWorkingDay, bangkokToday } from "../shared/dates";
import { overlaps } from "../shared/overlap";
import { validateBooking } from "../shared/validation";
import { busyForRoom, eventPayload } from "../server/google/calendar";
import { book } from "../server/booking/service";
import type { Booking } from "../shared/types";
const booking: Booking = {
  date: "2026-09-15",
  roomId: "ROOM_1",
  startTime: "09:00",
  endTime: "10:00",
  requesterName: "ผู้ทดสอบ",
  department: "IT",
  internalPhone: "1234",
  subject: "ประชุม",
  equipment: ["TV"],
  email: "test@example.com",
};
describe("legacy parser", () => {
  it.each([
    "ห้อง 1 เตรียมประชุม",
    "ห้อง1",
    "ห้อง   1",
    "ห้องประชุม 1",
    "[ห้อง 1] ประชุม",
  ])("parses %s", (summary) =>
    expect(parseRoomFromEvent({ summary })).toBe("ROOM_1"),
  );
  it.each([
    ["ห้อง2", "ROOM_2"],
    ["ห้องประชุม 2", "ROOM_2"],
    ["ห้อง 3 HEALTH RIDER", "ROOM_3"],
    ["ห้อง3", "ROOM_3"],
    ["ห้องประชุม 3", "ROOM_3"],
    ["Co-Working Space", "COWORKING"],
    ["Coworking", "COWORKING"],
    ["Co Working", "COWORKING"],
    ["ห้อง 10", "UNKNOWN"],
    ["ห้อง1 ห้อง2", "UNKNOWN"],
    ["วันหยุด", "UNKNOWN"],
  ])("%s", (summary, expected) =>
    expect(parseRoomFromEvent({ summary })).toBe(expected),
  );
  it("prefers metadata, including unrecognized metadata", () => {
    expect(
      parseRoomFromEvent({
        summary: "ห้อง 1",
        extendedProperties: { private: { room_id: "ROOM_2" } },
      }),
    ).toBe("ROOM_2");
    expect(
      parseRoomFromEvent({
        summary: "ห้อง 1",
        extendedProperties: { private: { room_id: "BAD" } },
      }),
    ).toBe("UNKNOWN");
  });
});
describe("dates and validation", () => {
  it("counts one weekday excluding today and accepts holiday extension", () => {
    expect(minimumBookingDate("2026-09-08")).toBe("2026-09-09");
    expect(minimumBookingDate("2026-09-11")).toBe("2026-09-14");
    expect(minimumBookingDate("2026-09-12")).toBe("2026-09-14");
    expect(minimumBookingDate("2026-09-08", new Set(["2026-09-09"]))).toBe(
      "2026-09-10",
    );
    expect(bangkokToday(new Date("2026-09-08T18:00:00Z"))).toBe("2026-09-09");
  });
  it("rejects impossible and non-ISO dates", () => {
    expect(validDate("2026-02-30")).toBe(false);
    expect(validDate("15/09/2026")).toBe(false);
    expect(validDate("2028-02-29")).toBe(true);
  });
  it("allows weekdays and rejects weekends", () => {
    expect(isWorkingDay("2026-09-18")).toBe(true);
    expect(isWorkingDay("2026-09-19")).toBe(false);
    expect(isWorkingDay("2026-09-20")).toBe(false);
  });
  it("accepts valid booking without participant count", () => {
    expect(validateBooking(booking, "2026-09-08").errors).toEqual([]);
  });
  it.each([
    { date: "2026-09-08" },
    { date: "2026-09-19" },
    { roomId: "OTHER" },
    { email: "bad" },
    { endTime: "09:00" },
    { startTime: "09:15" },
    { equipment: ["INVALID"] },
    { subject: "line\nbreak" },
  ])("rejects invalid input %j", (patch) =>
    expect(
      validateBooking({ ...booking, ...patch }, "2026-09-08").data,
    ).toBeUndefined(),
  );
});
describe("availability and booking", () => {
  const event = {
    id: "existing",
    summary: "ห้อง 1 เดิม",
    start: { dateTime: "2026-09-15T09:00:00+07:00" },
    end: { dateTime: "2026-09-15T10:00:00+07:00" },
  };
  it("allows adjacent intervals and compares offsets", () => {
    expect(
      overlaps(
        "2026-09-15T10:00:00+07:00",
        "2026-09-15T11:00:00+07:00",
        event.start.dateTime,
        event.end.dateTime,
      ),
    ).toBe(false);
    expect(
      overlaps(
        "2026-09-15T02:30:00Z",
        "2026-09-15T03:30:00Z",
        event.start.dateTime,
        event.end.dateTime,
      ),
    ).toBe(true);
  });
  it("isolates rooms and omits private data", () => {
    expect(busyForRoom([event], "ROOM_2", booking.date)).toEqual([]);
    expect(
      Object.keys(busyForRoom([event], "ROOM_1", booking.date)[0]),
    ).toEqual(["start", "end"]);
  });
  it("handles all-day, spanning, cancelled and transparent events", () => {
    const allDay = {
      ...event,
      start: { date: "2026-09-14" },
      end: { date: "2026-09-16" },
    };
    expect(busyForRoom([allDay], "ROOM_1", booking.date)).toEqual([
      { start: "2026-09-15T00:00:00+07:00", end: "2026-09-16T00:00:00+07:00" },
    ]);
    expect(
      busyForRoom(
        [
          { ...event, status: "cancelled" },
          { ...event, transparency: "transparent" },
        ],
        "ROOM_1",
        booking.date,
      ),
    ).toEqual([]);
  });
  it("rechecks calendar before insert and returns 409 when occupied", async () => {
    const adapter = {
      listDay: vi.fn().mockResolvedValue([event]),
      insert: vi.fn(),
    };
    await expect(book(booking, adapter, "2026-09-08")).rejects.toMatchObject({
      status: 409,
      code: "BOOKING_CONFLICT",
    });
    expect(adapter.listDay).toHaveBeenCalledWith(booking.date);
    expect(adapter.insert).not.toHaveBeenCalled();
    await book({ ...booking, roomId: "ROOM_2" }, adapter, "2026-09-08");
    expect(adapter.insert).toHaveBeenCalledTimes(1);
  });
  it("fails closed when the calendar is unavailable", async () => {
    const adapter = {
      listDay: vi.fn().mockRejectedValue(new Error("offline")),
      insert: vi.fn(),
    };
    await expect(book(booking, adapter, "2026-09-08")).rejects.toThrow(
      "offline",
    );
    expect(adapter.insert).not.toHaveBeenCalled();
  });
  it("writes canonical metadata and collected email without attendees", () => {
    const payload = eventPayload(booking);
    expect(payload.summary).toBe("[ห้อง 1] ประชุม");
    expect(payload.extendedProperties.private.room_id).toBe("ROOM_1");
    expect(payload.extendedProperties.private).not.toHaveProperty("source");
    expect(payload.description).toContain("อีเมล: test@example.com");
    expect(payload.description).not.toContain("แหล่งที่มา");
    expect(payload).not.toHaveProperty("attendees");
  });
  it.each([
    ["ROOM_1", "7"],
    ["ROOM_2", "4"],
    ["ROOM_3", "2"],
    ["COWORKING", "3"],
  ] as const)("assigns Google Calendar color %s", (roomId, colorId) => {
    expect(eventPayload({ ...booking, roomId }).colorId).toBe(colorId);
  });
});
