import type { Context } from "hono";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";
import { sendError } from "../utils/api-response";

export function errorHandler(err: Error, c: Context) {
  if (err instanceof ZodError) {
    return sendError(
      c,
      "VALIDATION_ERROR",
      "Request validation failed.",
      400,
      err.flatten ? err.flatten() : err.issues,
    );
  }

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
