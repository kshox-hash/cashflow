import { randomUUID } from "crypto";
import DB from "../../db/db-configuration";

type Status =
  | "confirmed"
  | "forecast"
  | "overdue"
  | "scheduled"
  | "paid"
  | "cancelled";

interface CreatePeopleCostDto {
  date: string;
  description: string;
  category: string;
  amount: number;
  status: Status;
}

interface Company {
  id: string;
  name: string;
  currency: string;
  current_balance: number | string;
  minimum_threshold: number | string;
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
  static async getCompany(companyId: string): Promise<Company> {
    const result = await DB.getPool().query(
      `
      SELECT
        id,
        name,
        currency,
        current_balance,
        minimum_threshold
      FROM companies
      WHERE id = $1
      `,
      [companyId]
    );

    if (!result.rows.length) {
      throw new Error("Empresa no encontrada");
    }

    return result.rows[0] as Company;
  }

  static async getAll(companyId: string): Promise<PeopleCost[]> {
    await this.getCompany(companyId);

    const result = await DB.getPool().query(
      `
      SELECT
        id,
        TO_CHAR(movement_date, 'YYYY-MM-DD') AS date,
        description,
        direction,
        category,
        amount::float AS amount,
        source_type AS "sourceType",
        status
      FROM cash_flow_movements
      WHERE company_id = $1
        AND direction = 'expense'
        AND category IN (
          'sueldo',
          'honorario',
          'imposiciones',
          'bono',
          'finiquito',
          'beneficio',
          'otro_personal'
        )
      ORDER BY movement_date ASC
      `,
      [companyId]
    );

    return result.rows as PeopleCost[];
  }

  static async getSummary(companyId: string) {
    const costs = await this.getAll(companyId);

    const total = costs.reduce((sum: number, item: PeopleCost) => {
      return sum + Number(item.amount);
    }, 0);

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    const currentMonthTotal = costs
      .filter((item: PeopleCost) => item.date.slice(0, 7) === currentMonth)
      .reduce((sum: number, item: PeopleCost) => {
        return sum + Number(item.amount);
      }, 0);

    const sorted = [...costs].sort((a, b) => a.date.localeCompare(b.date));
    const nextPayment = sorted[0] ?? null;

    return {
      total,
      currentMonthTotal,
      nextPayment,
      count: costs.length,
    };
  }

  static async create(
    companyId: string,
    data: CreatePeopleCostDto
  ): Promise<PeopleCost> {
    if (!data.date) {
      throw new Error("La fecha es obligatoria");
    }

    if (!data.description || data.description.trim().length < 3) {
      throw new Error("La descripción es obligatoria");
    }

    if (!data.amount || Number(data.amount) <= 0) {
      throw new Error("El monto debe ser mayor a cero");
    }

    const allowedCategories = [
      "sueldo",
      "honorario",
      "imposiciones",
      "bono",
      "finiquito",
      "beneficio",
      "otro_personal",
    ];

    if (!allowedCategories.includes(data.category)) {
      throw new Error("Categoría de personal inválida");
    }

    await this.getCompany(companyId);

    const result = await DB.getPool().query(
      `
      INSERT INTO cash_flow_movements (
        id,
        company_id,
        movement_date,
        description,
        direction,
        category,
        amount,
        status,
        source_type
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING
        id,
        TO_CHAR(movement_date, 'YYYY-MM-DD') AS date,
        description,
        direction,
        category,
        amount::float AS amount,
        source_type AS "sourceType",
        status
      `,
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
      `
      DELETE FROM cash_flow_movements
      WHERE id = $1
        AND company_id = $2
        AND source_type = 'people_cost'
      RETURNING id
      `,
      [id, companyId]
    );

    if (!result.rows.length) {
      throw new Error("Costo de personal no encontrado");
    }
  }
}