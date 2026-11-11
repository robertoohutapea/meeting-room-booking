import { isRoomId, EQUIPMENT } from "./config";
import {
  validDate,
  isWorkingDay,
  minimumBookingDate,
  TIME_OPTIONS,
  bangkokToday,
} from "./dates";
import type { Booking } from "./types";
import { validEmail } from './email';
import { normalizePhone, validPhone } from './phone';
export function validateBooking(
  input: unknown,
  today = bangkokToday(),
): { data?: Booking; errors: string[] } {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return { errors: ["ข้อมูลการจองไม่ถูกต้อง"] };
  const b = input as Record<string, unknown>;
  const errors: string[] = [];
  if (!validDate(b.date)) errors.push("กรุณาระบุวันที่ให้ถูกต้อง");
  else if (!isWorkingDay(b.date))
    errors.push("ไม่สามารถจองห้องประชุมในวันเสาร์หรือวันอาทิตย์ได้");
  else if (b.date < minimumBookingDate(today))
    errors.push(
      "กรุณาจองล่วงหน้าอย่างน้อย 1 วันทำการ (ไม่นับวันเสาร์และวันอาทิตย์)",
    );
  if (!isRoomId(b.roomId)) errors.push("กรุณาเลือกห้องประชุม");
  if (
    typeof b.startTime !== "string" ||
    typeof b.endTime !== "string" ||
    !TIME_OPTIONS.includes(b.startTime) ||
    !TIME_OPTIONS.includes(b.endTime)
  )
    errors.push("กรุณาเลือกเวลาในเวลาทำการ ครั้งละ 30 นาที");
  else if (b.endTime <= b.startTime)
    errors.push("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม");
  for (const [key, label, max] of [
    ["requesterName", "ชื่อผู้จอง", 150],
    ["department", "หน่วยงาน", 200],
    ["internalPhone", "เบอร์ภายใน", 30],
    ["subject", "หัวข้อการประชุม", 300],
    ["email", "อีเมล", 254],
  ] as const) {
    if (
      typeof b[key] !== "string" ||
      !b[key].trim() ||
      b[key].length > max ||
      /[\r\n\x00-\x1f]/.test(b[key])
    )
      errors.push(`กรุณาตรวจสอบ${label} (ไม่เกิน ${max} ตัวอักษร)`);
  }
  if (
    typeof b.email === "string" &&
    !validEmail(b.email.trim())
  )
    errors.push("รูปแบบอีเมลไม่ถูกต้อง");
  if (typeof b.internalPhone === 'string' && !validPhone(b.internalPhone)) errors.push('กรุณาระบุเบอร์ภายใน 3–6 หลัก หรือเบอร์โทรศัพท์ไทย 9–10 หลักที่ขึ้นต้นด้วย 0');
  if (
    !Array.isArray(b.equipment) ||
    b.equipment.length > 2 ||
    b.equipment.some(
      (e) => typeof e !== "string" || !Object.hasOwn(EQUIPMENT, e),
    ) ||
    new Set(b.equipment).size !== b.equipment.length
  )
    errors.push("รายการอุปกรณ์ไม่ถูกต้อง");
  if (errors.length) return { errors };
  return {
    errors,
    data: {
      date: b.date,
      roomId: b.roomId,
      startTime: b.startTime,
      endTime: b.endTime,
      requesterName: (b.requesterName as string).trim(),
      department: (b.department as string).trim(),
      internalPhone: normalizePhone(b.internalPhone as string),
      subject: (b.subject as string).trim(),
      email: (b.email as string).trim(),
      equipment: b.equipment,
    } as Booking,
  };
}
