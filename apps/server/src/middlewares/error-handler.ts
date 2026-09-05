import type { Context } from "hono";
import { AppError } from "../utils/errors";
import { sendError } from "../utils/api-response";

export function errorHandler(err: Error, c: Context) {
  if (err instanceof AppError) {
    return sendError(c, err.code, err.message, err.statusCode, err.details);
  }

  return sendError(
    c,
    "INTERNAL_SERVER_ERROR",
    err.message || "An unexpected error occurred.",
    500,
  );
}
