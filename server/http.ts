export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export function handleError(error: unknown) {
  if (error instanceof ApiError)
    return json({ code: error.code, message: error.message }, error.status);
  // Do not log request bodies, credentials or upstream response bodies.
  console.error("calendar_request_failed", {
    type: error instanceof Error ? error.name : "UnknownError",
  });
  return json(
    {
      code: "CALENDAR_UNAVAILABLE",
      message: "ไม่สามารถเชื่อมต่อปฏิทินได้ในขณะนี้ กรุณาลองใหม่ภายหลัง",
    },
    503,
  );
}
