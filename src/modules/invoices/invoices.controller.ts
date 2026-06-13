import { Request, Response, NextFunction } from "express";
import { InvoicesDueService } from "./invoices.service";

export class InvoicesDueController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const result = await InvoicesDueService.getAll(companyId);
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  }

  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const result = await InvoicesDueService.getSummary(companyId);
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const result = await InvoicesDueService.create(companyId, req.body);
      return res.status(201).json(result);
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const id = req.params.id as string;
      await InvoicesDueService.delete(companyId, id);
      return res.json({ ok: true });
    } catch (error) {
      return next(error);
    }
  }
}
