import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { BUSINESS } from "./config";
dayjs.extend(utc);
dayjs.extend(timezone);
export const bangkokToday = (now = new Date()) =>
  dayjs(now).tz(BUSINESS.timezone).format("YYYY-MM-DD");
export function validDate(date: unknown): date is string {
  return (
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number(date.slice(0, 4)) >= 1900 &&
    dayjs.utc(date).isValid() &&
    dayjs.utc(date).format("YYYY-MM-DD") === date
  );
}
export function isWorkingDay(
  date: unknown,
  holidays: ReadonlySet<string> = new Set(),
) {
  if (!validDate(date)) return false;
  const day = dayjs.utc(date).day();
  return day !== 0 && day !== 6 && !holidays.has(date);
}
export function minimumBookingDate(
  today = bangkokToday(),
  holidays: ReadonlySet<string> = new Set(),
) {
  let date = dayjs.utc(today);
  let count = 0;
  while (count < BUSINESS.advanceWorkingDays) {
    date = date.add(1, "day");
    if (isWorkingDay(date.format("YYYY-MM-DD"), holidays))
      count++;
  }
  return date.format("YYYY-MM-DD");
}
export const timestamp = (date: string, time: string) =>
  `${date}T${time}:00+07:00`;
export const dayBounds = (date: string) => ({
  start: timestamp(date, "00:00"),
  end: timestamp(dayjs.utc(date).add(1, "day").format("YYYY-MM-DD"), "00:00"),
});
export const thaiDate = (date: string) =>
  validDate(date)
    ? new Intl.DateTimeFormat("th-TH", {
        dateStyle: "long",
        timeZone: BUSINESS.timezone,
      }).format(new Date(timestamp(date, "12:00")))
    : "—";
export const thaiTime = (date: string) =>
  dayjs(date).tz(BUSINESS.timezone).format("HH:mm");
export const minutes = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
export const TIME_OPTIONS = Array.from(
  {
    length:
      (minutes(BUSINESS.closing) - minutes(BUSINESS.opening)) /
        BUSINESS.stepMinutes +
      1,
  },
  (_, i) => {
    const n = minutes(BUSINESS.opening) + i * BUSINESS.stepMinutes;
    return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
  },
);
