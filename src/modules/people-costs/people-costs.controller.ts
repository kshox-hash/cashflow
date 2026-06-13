import { Request, Response, NextFunction } from "express";
import { PeopleCostsService } from "./people-costs.service";

export class PeopleCostsController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const result = await PeopleCostsService.getAll(companyId);
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  }

  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const result = await PeopleCostsService.getSummary(companyId);
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const result = await PeopleCostsService.create(companyId, req.body);
      return res.status(201).json(result);
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const id = req.params.id as string;
      await PeopleCostsService.delete(companyId, id);
      return res.json({ ok: true });
    } catch (error) {
      return next(error);
    }
  }
}
