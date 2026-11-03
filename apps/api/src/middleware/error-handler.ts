import type { ErrorRequestHandler, RequestHandler } from "express";
import multer from "multer";

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const notFoundHandler: RequestHandler = (_request, _response, next) => {
  next(new HttpError(404, "Route not found"));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const statusCode =
    error instanceof HttpError
      ? error.statusCode
      : error instanceof multer.MulterError
        ? error.code === "LIMIT_FILE_SIZE"
          ? 413
          : 400
        : isJsonSyntaxError(error)
          ? 400
          : 500;
  if (statusCode >= 500) console.error(error);
  response.status(statusCode).json({
    error:
      statusCode === 500
        ? "Internal server error"
        : error instanceof Error
          ? error.message
          : "Invalid request",
  });
};

function isJsonSyntaxError(error: unknown): boolean {
  return (
    error instanceof SyntaxError &&
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 400
  );
}
