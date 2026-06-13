import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

import cashFlowRoutes from "./modules/cashflow/cash-flow.routes";
import invoicesDueRoutes from "./modules/invoices/invoices.routes";
import billsRoutes from "./modules/bills/bills.routes";
import peopleCostsRoutes from "./modules/people-costs/people-costs.routes";

import authRoutes from "./auth/login.router";

import { authMiddleware } from "./middlewares/auth.middleware";
import { errorHandlerMiddleware } from "./core/errors/error-handler.middleware";

const app = express();

// Cabeceras de seguridad
app.use(helmet());

// CORS — en producción solo acepta el origen configurado
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    methods: ["GET", "POST", "DELETE", "PATCH", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Rate limiting global (protege contra abuso)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, message: "Demasiadas solicitudes, intenta más tarde." },
  })
);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "API funcionando correctamente" });
});

// Rutas públicas — rate limit más estricto en login
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, message: "Demasiados intentos de login, intenta en 15 minutos." },
  }),
  authRoutes
);

// Middleware de autenticación para todas las rutas protegidas
app.use(authMiddleware);

// Rutas protegidas
app.use("/api/cash-flow", cashFlowRoutes);
app.use("/api/invoices-due", invoicesDueRoutes);
app.use("/api/bills", billsRoutes);
app.use("/api/people-costs", peopleCostsRoutes);

app.use(errorHandlerMiddleware);

export default app;
