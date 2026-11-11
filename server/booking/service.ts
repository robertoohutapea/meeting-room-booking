import type { CalendarAdapter } from "../google/calendar";
import { busyForRoom } from "../google/calendar";
import { validateBooking } from "../../shared/validation";
import { timestamp } from "../../shared/dates";
import { overlaps } from "../../shared/overlap";
import { ApiError } from "../http";
export async function book(
  input: unknown,
  calendar: CalendarAdapter,
  today?: string,
) {
  const validated = validateBooking(input, today);
  if (!validated.data)
    throw new ApiError(400, "VALIDATION_ERROR", validated.errors.join(" / "));
  const b = validated.data;
  // Always read again at submission. Calendar list+insert is not an atomic transaction.
  const busy = busyForRoom(await calendar.listDay(b.date), b.roomId, b.date);
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
    throw new ApiError(
      409,
      "BOOKING_CONFLICT",
      "ช่วงเวลานี้มีผู้จองแล้ว กรุณาเลือกช่วงเวลาใหม่",
    );
  await calendar.insert(b);
  return { success: true };
}
