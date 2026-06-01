import { Request, Response } from "express";
import { CashFlowService } from "./cash-flow.service";

function getSingleQueryParam(value: unknown): string | undefined {
  if (Array.isArray(value)) return String(value[0]);
  if (typeof value === "string") return value;
  return undefined;
}

export class CashFlowController {
  static async getSummary(req: Request, res: Response) {
    try {
      const companyId = req.user!.companyId;

      const startDate = getSingleQueryParam(req.query.startDate);
      const monthsParam = getSingleQueryParam(req.query.months);

      const months = monthsParam ? Number(monthsParam) : 12;

      const result = await CashFlowService.getMonthlySummary(companyId, {
        startDate,
        months,
      });

      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Error obteniendo resumen",
      });
    }
  }

  static async getMovements(req: Request, res: Response) {
    try {
      const companyId = req.user!.companyId;

      const limitParam = getSingleQueryParam(req.query.limit);
      const cursor = getSingleQueryParam(req.query.cursor);

      const limit = limitParam ? Number(limitParam) : 20;

      const result = await CashFlowService.getMovements(companyId, {
        limit,
        cursor,
      });

      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Error obteniendo movimientos",
      });
    }
  }

  static async createMovement(req: Request, res: Response) {
    try {
      const companyId = req.user!.companyId;

      const result = await CashFlowService.createManualMovement(
        companyId,
        req.body
      );

      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Error creando movimiento",
      });
    }
  }

  static async deleteMovement(req: Request, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const idParam = req.params.id;

        if (Array.isArray(idParam)) {
          throw new Error("ID inválido");
        }

        if (!idParam) {
          throw new Error("ID requerido");
        }

        await CashFlowService.deleteMovement(
          companyId,
          idParam
        );

      return res.json({
        ok: true,
      });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Error eliminando movimiento",
      });
    }
  }
}