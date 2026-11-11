import { expect, it } from 'vitest';
import { validPhone, formatPhone, normalizePhone } from '../shared/phone';
import { validEmail } from '../shared/email';
it('keeps extensions readable and formats landline/mobile phone numbers',()=>{
  expect(formatPhone('7002')).toBe('7002');
  expect(formatPhone('021234567')).toBe('02-123-4567');
  expect(formatPhone('0812345678')).toBe('081-234-5678');
  expect(normalizePhone('081-234-5678')).toBe('0812345678');
});
it('validates extensions and Thai phone numbers without accepting letters or short fragments',()=>{
  for(const p of ['7002','123','123456','02-123-4567','081-234-5678'])expect(validPhone(p)).toBe(true);
  for(const p of ['','12','1234567','abc7002','1812345678'])expect(validPhone(p)).toBe(false);
});
it('accepts a single email mailbox and rejects incomplete addresses and recipient lists',()=>{
  expect(validEmail('person+meeting@example.com')).toBe(true);
  for(const email of ['person','person@','person@example','a@b.com,c@d.com','person @example.com'])expect(validEmail(email)).toBe(false);
});
