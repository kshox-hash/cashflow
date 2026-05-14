import { Request, Response, NextFunction } from "express";
import { AppError } from "./app-error";

export function errorHandlerMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("APP_ERROR:", err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      ok: false,
      message: err.message,
      code: err.code,
    });
  }

  return res.status(500).json({
    ok: false,
    message: "Error interno del servidor",
    code: "INTERNAL_ERROR",
  });
}