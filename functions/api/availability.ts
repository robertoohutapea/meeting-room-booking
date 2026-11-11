import { isRoomId } from "../../shared/config";
import { validDate } from "../../shared/dates";
import { createCalendar, busyForRoom } from "../../server/google/calendar";
import type { Env } from "../../server/google/auth";
import { ApiError, json, handleError } from "../../server/http";
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const params = new URL(request.url).searchParams;
    const date = params.get("date");
    const room = params.get("room");
    if (!validDate(date))
      throw new ApiError(400, "INVALID_DATE", "กรุณาระบุวันที่ให้ถูกต้อง");
    if (!isRoomId(room))
      throw new ApiError(400, "INVALID_ROOM", "กรุณาเลือกห้องประชุม");
    return json({
      date,
      room,
      busy: busyForRoom(await createCalendar(env).listDay(date), room, date),
    });
  } catch (error) {
    return handleError(error);
  }
};
