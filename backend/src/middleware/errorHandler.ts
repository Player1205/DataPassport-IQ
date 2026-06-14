import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export function notFound(req: Request, res: Response, next: NextFunction) {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: "error",
      code: "VALIDATION_ERROR",
      message: "Request validation failed.",
      errors: err.flatten().fieldErrors,
    });
  }

  // Known application errors
  if (err instanceof AppError) {
    logger.warn(`[AppError] ${err.statusCode} ${err.message}`);
    return res.status(err.statusCode).json({
      status: "error",
      code: err.code ?? "APP_ERROR",
      message: err.message,
    });
  }

  // Mongoose duplicate key
  if ((err as NodeJS.ErrnoException).name === "MongoServerError") {
    const mongoErr = err as NodeJS.ErrnoException & { code?: number; keyValue?: Record<string, string> };
    if (mongoErr.code === 11000) {
      return res.status(409).json({
        status: "error",
        code: "DUPLICATE_KEY",
        message: "A record with that value already exists.",
        fields: mongoErr.keyValue,
      });
    }
  }

  // Unexpected errors
  logger.error("Unhandled error:", err);
  return res.status(500).json({
    status: "error",
    code: "INTERNAL_ERROR",
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred."
        : err.message,
  });
}
