import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import {
  findUserByEmailRepository,
  updateLastLoginRepository,
} from "./login.repository";
import { AppError } from "../core/errors/app-error";

export async function loginService(email: string, password: string) {
  const user = await findUserByEmailRepository(email);

  if (!user) {
    throw new AppError("Credenciales inválidas", 401, "INVALID_CREDENTIALS");
  }

  if (!user.is_active) {
    throw new AppError("Usuario desactivado", 403, "USER_DISABLED");
  }

  const passwordValid = await bcrypt.compare(password, user.password_hash);

  if (!passwordValid) {
    throw new AppError("Credenciales inválidas", 401, "INVALID_CREDENTIALS");
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new AppError(
      "Configuración del servidor incompleta",
      500,
      "JWT_SECRET_NOT_FOUND"
    );
  }

  await updateLastLoginRepository(user.id);

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      companyId: user.company_id,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: "8h" }
  );

  return {
    token,
    user: {
      id: user.id,
      companyId: user.company_id,
      email: user.email,
      role: user.role,
    },
  };
}
