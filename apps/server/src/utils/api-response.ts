import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  message?: string;
};

export function sendSuccess<T>(
  c: Context,
  data: T,
  statusCode: ContentfulStatusCode = 200,
  message?: string,
) {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
  };
  return c.json(payload, statusCode);
}

export function sendError(
  c: Context,
  code: string,
  message: string,
  statusCode: ContentfulStatusCode = 400,
  details?: unknown,
) {
  const payload: ApiResponse<never> = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  return c.json(payload, statusCode);
}
