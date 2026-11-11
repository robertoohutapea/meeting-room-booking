import { expect, it } from 'vitest';
import { selectTimeSlot, dragTimeRange, EMPTY_RANGE, canStartAt, isTimeRangeAvailable } from '../src/features/timeSelection';
const date = '2026-09-15';
const busy = [{ start: `${date}T09:00:00+07:00`, end: `${date}T10:30:00+07:00` }];
it('disables booked start options but allows the first slot after a booking', () => {
  for (const time of ['09:00', '09:30', '10:00']) expect(canStartAt(date, time, busy)).toBe(false);
  expect(canStartAt(date, '10:30', busy)).toBe(true);
  expect(canStartAt(date, '16:00', busy)).toBe(true);
});
it('disables end options crossing a booking but permits ending at its start', () => {
  expect(isTimeRangeAvailable(date, '08:00', '09:00', busy)).toBe(true);
  expect(isTimeRangeAvailable(date, '08:00', '11:00', busy)).toBe(false);
  expect(isTimeRangeAvailable(date, '10:30', '11:00', busy)).toBe(true);
  expect(isTimeRangeAvailable(date, '', '09:00', busy)).toBe(false);
});
it('blocks a half-hour start containing a partial booking', () => {
  expect(canStartAt(date, '08:30', [{ start: `${date}T08:45:00+07:00`, end: `${date}T09:15:00+07:00` }])).toBe(false);
});
it('fills a half-hour range on the first click', () => {
  expect(selectTimeSlot(date, '08:00', '', busy)).toEqual({ startTime: '08:00', endTime: '08:30' });
});
it('extends across free slots and allows adjacency to a booking', () => {
  expect(selectTimeSlot(date, '08:30', '08:00', busy)).toEqual({ startTime: '08:00', endTime: '09:00' });
});
it('starts a new range across a busy gap or when clicking earlier', () => {
  expect(selectTimeSlot(date, '10:30', '08:00', busy)).toEqual({ startTime: '10:30', endTime: '11:00' });
  expect(selectTimeSlot(date, '08:00', '11:00', busy)).toEqual({ startTime: '08:00', endTime: '08:30' });
});
it('rejects busy slots and the closing boundary', () => {
  expect(selectTimeSlot(date, '09:00', '', busy)).toBeNull();
  expect(selectTimeSlot(date, '16:30', '', busy)).toBeNull();
});
it('selects forward and backward across row boundaries', () => {
  const expected = { startTime: '10:30', endTime: '12:30' };
  expect(dragTimeRange(date, 5, 8, EMPTY_RANGE, false, busy)).toEqual(expected);
  expect(dragTimeRange(date, 8, 5, EMPTY_RANGE, false, busy)).toEqual(expected);
});
it('stops at a busy gap even when the pointer skips slots', () => {
  expect(dragTimeRange(date, 0, 8, EMPTY_RANGE, false, busy)).toEqual({ startTime: '08:00', endTime: '09:00' });
  expect(dragTimeRange(date, 8, 0, EMPTY_RANGE, false, busy)).toEqual({ startTime: '10:30', endTime: '12:30' });
});
it('erases from either end and clears the entire selected range', () => {
  const initial = { startTime: '10:30', endTime: '12:30' };
  expect(dragTimeRange(date, 5, 6, initial, true, busy)).toEqual({ startTime: '11:30', endTime: '12:30' });
  expect(dragTimeRange(date, 8, 7, initial, true, busy)).toEqual({ startTime: '10:30', endTime: '11:30' });
  expect(dragTimeRange(date, 5, 8, initial, true, busy)).toEqual(EMPTY_RANGE);
});
it('keeps one continuous prefix when erasing a middle slot', () => {
  expect(dragTimeRange(date, 6, 6, { startTime: '10:30', endTime: '12:30' }, true, busy)).toEqual({ startTime: '10:30', endTime: '11:00' });
});
it('does not start on booked cells or out-of-range indices', () => {
  expect(dragTimeRange(date, 2, 5, EMPTY_RANGE, false, busy)).toEqual(EMPTY_RANGE);
  expect(dragTimeRange(date, 0, 17, EMPTY_RANGE, false, busy)).toEqual(EMPTY_RANGE);
});
it('allows erasing one selected slot and selecting the final half-hour', () => {
  expect(dragTimeRange(date, 16, 16, EMPTY_RANGE, false, busy)).toEqual({ startTime: '16:00', endTime: '16:30' });
  expect(dragTimeRange(date, 5, 5, { startTime: '10:30', endTime: '11:00' }, true, busy)).toEqual(EMPTY_RANGE);
});
