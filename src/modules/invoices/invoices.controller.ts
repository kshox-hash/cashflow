import { Request, Response } from "express";
import { InvoicesDueService } from "./invoices.service";

export class InvoicesDueController {
  static async getAll(req: Request, res: Response) {
    try {
      const companyId = req.user!.companyId;

      const result = await InvoicesDueService.getAll(companyId);

      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Error obteniendo facturas",
      });
    }
  }

  static async getSummary(req: Request, res: Response) {
    try {
      const companyId = req.user!.companyId;

      const result = await InvoicesDueService.getSummary(companyId);

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

      const result = await InvoicesDueService.create(
        companyId,
        req.body
      );

      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Error creando factura",
      });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const companyId = req.user!.companyId;

      const idParam = req.params.id;

      if (!idParam || Array.isArray(idParam)) {
        throw new Error("ID inválido");
      }

      await InvoicesDueService.delete(companyId, idParam);

      return res.json({ ok: true });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Error eliminando factura",
      });
    }
  }
}