import { expect, it } from 'vitest';
import { forwardedOrigin } from '../dev/proxy';
import { readJson } from '../server/readJson';
const target = 'http://127.0.0.1:8788';
const request = (origin: string, extra: Record<string,string> = {}) => new Request(`${target}/api/bookings`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...extra},body:'{}'});
it.each(['localhost:5173','127.0.0.1:5173','localhost:5174','[::1]:5173'])('accepts a same-origin browser request forwarded by Vite from %s',async host=>{
  const origin=forwardedOrigin(`http://${host}`,host,target)!;
  await expect(readJson(request(origin))).resolves.toEqual({});
});
it.each(['https://untrusted.example','null','http://localhost:9999','http://localhost:5173.evil.example'])('preserves and rejects unrelated origin %s',async origin=>{
  expect(forwardedOrigin(origin,'localhost:5173',target)).toBe(origin);
  await expect(readJson(request(origin))).rejects.toMatchObject({code:'INVALID_ORIGIN',status:403});
});
it('does not allow spoofed forwarding headers to bypass the production origin check',async()=>{
  await expect(readJson(request('https://untrusted.example',{'X-Forwarded-Host':'untrusted.example','X-Forwarded-Proto':'https'}))).rejects.toMatchObject({code:'INVALID_ORIGIN'});
});
