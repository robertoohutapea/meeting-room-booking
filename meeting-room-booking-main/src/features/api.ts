import type { Availability, Booking } from "../../shared/types";
import type { RoomId } from "../../shared/config";
export class ClientError extends Error {
  constructor(
    message: string,
    public code = "",
  ) {
    super(message);
  }
}
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  const timeout = init?.method === 'POST' ? 90000 : 30000;
  try {
    response = await fetch(url, {
      ...init,
      signal: init?.signal
        ? AbortSignal.any([init.signal, AbortSignal.timeout(timeout)])
        : AbortSignal.timeout(timeout),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new ClientError(
      "เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบเครือข่าย หากส่งการจองแล้วให้ตรวจตารางก่อนลองอีกครั้ง",
    );
  }
  let body;
  try {
    body = await response.json();
  } catch {
    throw new ClientError("ระบบไม่พร้อมให้บริการ กรุณาลองใหม่ภายหลัง");
  }
  if (!response.ok) {
    const failure = body as { message?: unknown; code?: unknown } | null;
    throw new ClientError(
      typeof failure?.message === "string"
        ? failure.message
        : "เกิดข้อผิดพลาด กรุณาลองใหม่",
      typeof failure?.code === "string" ? failure.code : "",
    );
  }
  return body as T;
}
export const api = {
  availability: (date: string, room: RoomId, signal?: AbortSignal) =>
    request<Availability>(
      `/api/availability?${new URLSearchParams({ date, room })}`,
      { signal },
    ),
  book: (booking: Booking) =>
    request<{status:'confirmed'}>("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking),
    }),
};
