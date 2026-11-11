import { TIME_OPTIONS, timestamp } from '../../shared/dates';
import { overlaps } from '../../shared/overlap';
import type { BusyPeriod } from '../../shared/types';

export interface TimeRange { startTime: string; endTime: string }
export const EMPTY_RANGE: TimeRange = { startTime: '', endTime: '' };
export function isTimeRangeAvailable(date: string, start: string, end: string, busy: BusyPeriod[]) {
  return TIME_OPTIONS.includes(start) && TIME_OPTIONS.includes(end) && start < end &&
    !busy.some(p => overlaps(timestamp(date, start), timestamp(date, end), p.start, p.end));
}
export function canStartAt(date: string, time: string, busy: BusyPeriod[]) {
  const index = TIME_OPTIONS.indexOf(time);
  return index >= 0 && index < TIME_OPTIONS.length - 1 && isTimeRangeAvailable(date, time, TIME_OPTIONS[index + 1], busy);
}
export function dragTimeRange(date: string, anchor: number, target: number, initial: TimeRange, erase: boolean, busy: BusyPeriod[]): TimeRange {
  const last = TIME_OPTIONS.length - 2;
  if (anchor < 0 || anchor > last || target < 0 || target > last) return initial;
  const blocked = (i: number) => busy.some(p => overlaps(timestamp(date, TIME_OPTIONS[i]), timestamp(date, TIME_OPTIONS[i + 1]), p.start, p.end));
  if (blocked(anchor)) return initial;
  let edge = anchor;
  const direction = target >= anchor ? 1 : -1;
  for (let i = anchor + direction; direction > 0 ? i <= target : i >= target; i += direction) {
    if (blocked(i)) break;
    edge = i;
  }
  const from = Math.min(anchor, edge);
  const to = Math.max(anchor, edge) + 1;
  if (!erase) return { startTime: TIME_OPTIONS[from], endTime: TIME_OPTIONS[to] };
  const start = TIME_OPTIONS.indexOf(initial.startTime);
  const end = TIME_OPTIONS.indexOf(initial.endTime);
  if (start < 0 || end <= start) return EMPTY_RANGE;
  // Keep one continuous interval: erasing the middle retains the prefix.
  if (from <= start) return to >= end ? EMPTY_RANGE : { startTime: TIME_OPTIONS[to], endTime: initial.endTime };
  return { startTime: initial.startTime, endTime: TIME_OPTIONS[Math.min(from, end)] };
}

export function selectTimeSlot(date: string, time: string, startTime: string, busy: BusyPeriod[]) {
  const index = TIME_OPTIONS.indexOf(time);
  if (index < 0 || index >= TIME_OPTIONS.length - 1) return null;
  const endTime = TIME_OPTIONS[index + 1];
  const blocked = (start: string) => busy.some(p => overlaps(timestamp(date, start), timestamp(date, endTime), p.start, p.end));
  if (blocked(time)) return null;
  // Clicking a later free slot extends the range only across continuously free time.
  const start = TIME_OPTIONS.includes(startTime) && time > startTime && !blocked(startTime) ? startTime : time;
  return { startTime: start, endTime };
}
