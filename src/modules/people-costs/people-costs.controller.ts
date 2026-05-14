import { Request, Response } from "express";
import { PeopleCostsService } from "./people-costs.service";

export class PeopleCostsController {
  static async getAll(req: Request, res: Response) {
    try {
      const companyId = req.user!.companyId;

      const result = await PeopleCostsService.getAll(companyId);

      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Error obteniendo costos de personal",
      });
    }
  }

  static async getSummary(req: Request, res: Response) {
    try {
      const companyId = req.user!.companyId;

      const result = await PeopleCostsService.getSummary(companyId);

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

  static async create(req: Request, res: Response) {
    try {
      const companyId = req.user!.companyId;

      const result = await PeopleCostsService.create(companyId, req.body);

      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Error creando costo de personal",
      });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const companyId = req.user!.companyId;

      const idParam = req.params.id;

      if (Array.isArray(idParam)) {
        throw new Error("ID inválido");
      }

      if (!idParam) {
        throw new Error("ID requerido");
      }

      await PeopleCostsService.delete(companyId, idParam);

      return res.json({ ok: true });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Error eliminando costo",
      });
    }
  }
}