export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Validation failed") {
    super(message, 400);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests, please try again later.") {
    super(message, 429);
  }
}

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import logger from "./logger";

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation error", details: (error as any).errors },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    if (!error.isOperational) {
      logger.error({ err: error }, "Programming or unknown error");
    }
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  // Generic unhandled error
  logger.error({ err: error }, "Unhandled API exception");
  return NextResponse.json(
    { error: "Internal Server Error" },
    { status: 500 }
  );
}
