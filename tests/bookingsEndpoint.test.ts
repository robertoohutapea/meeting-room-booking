import { beforeEach, expect, it, vi } from 'vitest';

const { book, createCalendar } = vi.hoisted(() => ({
  book: vi.fn(),
  createCalendar: vi.fn(() => ({})),
}));

vi.mock('../server/booking/service', () => ({ book }));
vi.mock('../server/google/calendar', () => ({ createCalendar }));

import { onRequestPost } from '../functions/api/bookings';

beforeEach(() => {
  vi.clearAllMocks();
  book.mockResolvedValue({ success: true });
});

it('creates a booking directly without email or database services', async () => {
  const request = new Request('http://localhost/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject: 'test' }),
  });
  const response = await onRequestPost({ request, env: {} } as Parameters<typeof onRequestPost>[0]);

  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({ status: 'confirmed' });
  expect(book).toHaveBeenCalledWith({ subject: 'test' }, {});
});
