import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthUser {
  id: string;
  companyId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {

  try {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        ok: false,
        message: "Token requerido",
      });
    }

    const token = authHeader.split(" ")[1];

    const jwtSecret = process.env.JWT_SECRET!;

    const decoded = jwt.verify(
      token,
      jwtSecret
    ) as AuthUser;

    req.user = decoded;

    next();

  } catch (err) {

    return res.status(401).json({
      ok: false,
      message: "Token inválido",
    });

  }
}

