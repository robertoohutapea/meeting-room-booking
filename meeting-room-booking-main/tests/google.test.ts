import { afterEach, describe, expect, it, vi } from 'vitest';
import { accessToken, type Env } from '../server/google/auth';
import { createCalendar } from '../server/google/calendar';

afterEach(() => vi.unstubAllGlobals());

async function fixture() {
  const pair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1,0,1]), hash: 'SHA-256' }, true, ['sign','verify']);
  const bytes = new Uint8Array(await crypto.subtle.exportKey('pkcs8',pair.privateKey));
  const key = `-----BEGIN PRIVATE KEY-----\\n${btoa(String.fromCharCode(...bytes))}\\n-----END PRIVATE KEY-----\\n`;
  const env: Env = { GOOGLE_CALENDAR_ID:'test-calendar@example.com', GOOGLE_SERVICE_ACCOUNT_EMAIL:'service@example.com', GOOGLE_PRIVATE_KEY:key };
  return { pair,env };
}
describe('Google adapter',()=>{
  it('normalizes escaped PEM newlines and signs a verifiable JWT',async()=>{
    const { pair,env } = await fixture();
    const mock = vi.fn().mockResolvedValue(Response.json({ access_token:'test-token' }));
    vi.stubGlobal('fetch',mock);
    expect(await accessToken(env)).toBe('test-token');
    const assertion = (mock.mock.calls[0][1].body as URLSearchParams).get('assertion')!;
    const [header,claims,signature] = assertion.split('.');
    const decode = (s: string) => Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
    expect(JSON.parse(new TextDecoder().decode(decode(claims)))).toMatchObject({iss:env.GOOGLE_SERVICE_ACCOUNT_EMAIL,aud:'https://oauth2.googleapis.com/token',scope:'https://www.googleapis.com/auth/calendar.events'});
    expect(await crypto.subtle.verify('RSASSA-PKCS1-v1_5',pair.publicKey,decode(signature),new TextEncoder().encode(`${header}.${claims}`))).toBe(true);
  });
  it('reads every page with Bangkok boundaries and recurring event expansion',async()=>{
    const {env} = await fixture();
    const mock = vi.fn().mockResolvedValueOnce(Response.json({access_token:'token'})).mockResolvedValueOnce(Response.json({items:[{id:'first'}],nextPageToken:'next'})).mockResolvedValueOnce(Response.json({items:[{id:'second'}]}));
    vi.stubGlobal('fetch',mock);
    expect(await createCalendar(env).listDay('2026-09-15')).toEqual([{id:'first'},{id:'second'}]);
    const first = new URL(mock.mock.calls[1][0]); const second = new URL(mock.mock.calls[2][0]);
    expect(first.searchParams.get('timeMin')).toBe('2026-09-15T00:00:00+07:00');
    expect(first.searchParams.get('timeMax')).toBe('2026-09-16T00:00:00+07:00');
    expect(first.searchParams.get('singleEvents')).toBe('true');
    expect(first.searchParams.get('orderBy')).toBe('startTime');
    expect(second.searchParams.get('pageToken')).toBe('next');
    expect(decodeURIComponent(first.pathname)).toContain(env.GOOGLE_CALENDAR_ID);
  });
  it('maps Calendar permission errors without returning Google error content',async()=>{
    const {env} = await fixture();
    vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(Response.json({access_token:'token'})).mockResolvedValueOnce(Response.json({error:'PRIVATE_UPSTREAM_DETAIL'},{status:403})));
    await expect(createCalendar(env).listDay('2026-09-15')).rejects.toMatchObject({status:503,code:'CALENDAR_PERMISSION'});
  });
});
