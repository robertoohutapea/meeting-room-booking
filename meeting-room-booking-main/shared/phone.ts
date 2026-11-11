export const normalizePhone = (value: string) => value.replace(/[\s()-]/g, '');
export function validPhone(value: string) {
  const digits = normalizePhone(value);
  return /^\d{3,6}$/.test(digits) || /^0\d{8,9}$/.test(digits);
}
export function formatPhone(value: string) {
  const digits = normalizePhone(value);
  if (!/^\d+$/.test(digits) || digits.length <= 6 || digits.length > 10) return value;
  const first = digits.startsWith('02') && digits.length === 9 ? 2 : 3;
  return [digits.slice(0,first),digits.slice(first,first+3),digits.slice(first+3)].filter(Boolean).join('-');
}
