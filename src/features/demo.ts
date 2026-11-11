import type { Availability, Booking } from "../../shared/types";
import type { RoomId } from "../../shared/config";
import { timestamp } from "../../shared/dates";
import { overlaps } from "../../shared/overlap";
import { ClientError } from "./api";
// Form preview mode. Memory is discarded on reload; no real bookings.
const added: Booking[] = [];
export const demo = {
  async availability(date: string, room: RoomId): Promise<Availability> {
    const base =
      room === "ROOM_1"
        ? [
            ["09:00", "10:30"],
            ["13:00", "14:00"],
          ]
        : room === "ROOM_2"
          ? [["10:00", "11:00"]]
          : [];
    return {
      date,
      room,
      busy: [
        ...base.map(([s, e]) => ({
          start: timestamp(date, s),
          end: timestamp(date, e),
        })),
        ...added
          .filter((b) => b.date === date && b.roomId === room)
          .map((b) => ({
            start: timestamp(date, b.startTime),
            end: timestamp(date, b.endTime),
          })),
      ],
    };
  },
  async book(b: Booking) {
    const { busy } = await this.availability(b.date, b.roomId);
    if (
      busy.some((p) =>
        overlaps(
          timestamp(b.date, b.startTime),
          timestamp(b.date, b.endTime),
          p.start,
          p.end,
        ),
      )
    )
      throw new ClientError(
        "ช่วงเวลานี้มีผู้จองแล้ว กรุณาเลือกช่วงเวลาใหม่",
        "BOOKING_CONFLICT",
      );
    added.push(b);
    return { success: true };
  },
};
