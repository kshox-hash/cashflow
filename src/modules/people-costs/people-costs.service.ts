import { randomUUID } from "crypto";
import DB from "../../db/db-configuration";
import { AppError } from "../../core/errors/app-error";

type Status =
  | "confirmed"
  | "forecast"
  | "overdue"
  | "scheduled"
  | "paid"
  | "cancelled";

const ALLOWED_CATEGORIES = [
  "sueldo",
  "honorario",
  "imposiciones",
  "bono",
  "finiquito",
  "beneficio",
  "otro_personal",
] as const;

interface CreatePeopleCostDto {
  date: string;
  description: string;
  category: string;
  amount: number;
  status: Status;
}

interface PeopleCost {
  id: string;
  date: string;
  description: string;
  direction: "expense";
  category: string;
  amount: number;
  sourceType: string;
  status: string;
}

export class PeopleCostsService {
  static async getAll(companyId: string): Promise<PeopleCost[]> {
    const result = await DB.getPool().query(
      `SELECT
        id,
        TO_CHAR(movement_date, 'YYYY-MM-DD') AS date,
        description, direction, category,
        amount::float AS amount,
        source_type AS "sourceType",
        status
       FROM cash_flow_movements
       WHERE company_id = $1
         AND direction = 'expense'
         AND category = ANY($2::text[])
       ORDER BY movement_date ASC`,
      [companyId, ALLOWED_CATEGORIES]
    );

    return result.rows as PeopleCost[];
  }

  static async getSummary(companyId: string) {
    const costs = await this.getAll(companyId);

    const total = costs.reduce((sum, item) => sum + Number(item.amount), 0);

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const currentMonthTotal = costs
      .filter((item) => item.date.slice(0, 7) === currentMonth)
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const sorted = [...costs].sort((a, b) => a.date.localeCompare(b.date));
    const nextPayment = sorted[0] ?? null;

    return { total, currentMonthTotal, nextPayment, count: costs.length };
  }

  static async create(companyId: string, data: CreatePeopleCostDto): Promise<PeopleCost> {
    if (!data.date) {
      throw new AppError("La fecha es obligatoria", 400, "VALIDATION_ERROR");
    }

    if (!data.description || data.description.trim().length < 3) {
      throw new AppError("La descripción es obligatoria", 400, "VALIDATION_ERROR");
    }

    if (!data.amount || Number(data.amount) <= 0) {
      throw new AppError("El monto debe ser mayor a cero", 400, "VALIDATION_ERROR");
    }

    if (!(ALLOWED_CATEGORIES as readonly string[]).includes(data.category)) {
      throw new AppError(
        `Categoría inválida. Valores permitidos: ${ALLOWED_CATEGORIES.join(", ")}`,
        400,
        "VALIDATION_ERROR"
      );
    }

    const result = await DB.getPool().query(
      `INSERT INTO cash_flow_movements (
        id, company_id, movement_date, description,
        direction, category, amount, status, source_type
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING
        id,
        TO_CHAR(movement_date, 'YYYY-MM-DD') AS date,
        description, direction, category,
        amount::float AS amount,
        source_type AS "sourceType",
        status`,
      [
        randomUUID(),
        companyId,
        data.date,
        data.description.trim(),
        "expense",
        data.category,
        Number(data.amount),
        data.status || "forecast",
        "people_cost",
      ]
    );

    return result.rows[0] as PeopleCost;
  }

  static async delete(companyId: string, id: string): Promise<void> {
    const result = await DB.getPool().query(
      `DELETE FROM cash_flow_movements
       WHERE id = $1 AND company_id = $2 AND source_type = 'people_cost'
       RETURNING id`,
      [id, companyId]
    );

    if (!result.rows.length) {
      throw new AppError("Costo de personal no encontrado", 404, "NOT_FOUND");
    }
  }
}
