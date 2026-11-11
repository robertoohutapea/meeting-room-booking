export const overlaps = (
  start: string,
  end: string,
  existingStart: string,
  existingEnd: string,
) =>
  Date.parse(start) < Date.parse(existingEnd) &&
  Date.parse(end) > Date.parse(existingStart);
