import { Request, Response } from "express";
import { InsightsService } from "./insights.service";

export class InsightsController {
  static getAll(_req: Request, res: Response) {
    res.json(InsightsService.getAll());
  }
}