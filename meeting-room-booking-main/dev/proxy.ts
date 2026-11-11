import type { ProxyOptions } from 'vite';

// Translate only same-origin browser requests at the trusted development proxy.
// Never rewrite an unrelated Origin: Pages Functions must still reject it.
export function forwardedOrigin(origin: string | undefined, host: string | undefined, target: string) {
  return origin && host && origin === `http://${host}` ? new URL(target).origin : origin;
}
export function apiProxy(target: string): ProxyOptions {
  return {
    target,
    changeOrigin: true,
    configure(proxy) {
      proxy.on('proxyReq', (proxyRequest, request) => {
        const origin = forwardedOrigin(request.headers.origin,request.headers.host,target);
        if (origin) proxyRequest.setHeader('Origin',origin);
      });
    },
  };
}
