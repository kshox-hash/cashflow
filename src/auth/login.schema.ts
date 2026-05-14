import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string("El correo es obligatorio.")
    .trim()
    .toLowerCase()
    .min(1, "El correo es obligatorio.")
    .email("El correo no tiene un formato válido."),

  password: z
    .string("La contraseña es obligatoria.")
    .min(1, "La contraseña es obligatoria.")
    .min(6, "La contraseña debe tener al menos 6 caracteres."),
});

export type LoginDto = z.infer<typeof loginSchema>;