import { Request, Response, NextFunction } from "express";

import { loginService } from "./login.service";
import { loginSchema } from "./login.schema";

import { AppError } from "../core/errors/app-error";

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return next(
        new AppError(
          validation.error.issues[0]?.message ?? "Datos inválidos",
          400,
          "VALIDATION_ERROR"
        )
      );
    }

    const { email, password } = validation.data;

    const result = await loginService(email, password);

    return res.status(200).json({
      ok: true,
      message: "login ok",
      ...result,
    });

  } catch (err) {

    return next(err);

  }
}