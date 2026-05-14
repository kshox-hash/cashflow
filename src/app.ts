import express from "express";
import cors from "cors";

import cashFlowRoutes from "./modules/cashflow/cash-flow.routes";
import invoicesDueRoutes from "./modules/invoices/invoices.routes";
import billsRoutes from "./modules/bills/bills.routes";
import peopleCostsRoutes from "./modules/people-costs/people-costs.routes";
import insightsRoutes from "./modules/insights/insights.routes";
import authRoutes from "./auth/login.router";

import { errorHandlerMiddleware } from "./core/errors/error-handler.middleware";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    message: "API funcionando correctamente",
  });
});

app.use("/api/cash-flow", cashFlowRoutes);
app.use("/api/invoices-due", invoicesDueRoutes);
app.use("/api/bills", billsRoutes);
app.use("/api/people-costs", peopleCostsRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bills", billsRoutes);

app.use(errorHandlerMiddleware);

export default app;