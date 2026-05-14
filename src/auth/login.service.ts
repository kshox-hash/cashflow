import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotevn from "dotenv";

import {
  findUserByEmailRepository,
  updateLastLoginRepository,
} from "./login.repository";


dotevn.config();

export async function loginService(email: string, password: string) {
  const user = await findUserByEmailRepository(email);

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  if (!user.is_active) {
    throw new Error("USER_DISABLED");
  }

  const passwordValid = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const jwtSecret = "123456"//JWT secret

  if (!jwtSecret) {
    throw new Error("JWT_SECRET_NOT_FOUND");
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

