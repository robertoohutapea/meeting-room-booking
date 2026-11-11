import { ApiError } from './http';
export async function readJson(request: Request): Promise<unknown> {
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) throw new ApiError(403,'INVALID_ORIGIN','คำขอไม่ถูกต้อง กรุณาเปิดเว็บไซต์ใหม่');
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new ApiError(415,'INVALID_CONTENT_TYPE','รูปแบบข้อมูลไม่ถูกต้อง');
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400,'INVALID_JSON','ข้อมูลไม่ถูกต้อง');
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const {done,value} = await reader.read(); if (done) break; size+=value.length; if(size>16384){await reader.cancel();throw new ApiError(413,'BODY_TOO_LARGE','ข้อมูลมีขนาดใหญ่เกินไป');} chunks.push(value); }
  const bytes = new Uint8Array(size); let offset=0;
  for (const chunk of chunks) {bytes.set(chunk,offset);offset+=chunk.length;}
  try {return JSON.parse(new TextDecoder().decode(bytes));} catch {throw new ApiError(400,'INVALID_JSON','รูปแบบข้อมูลไม่ถูกต้อง');}
}
