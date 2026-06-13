import { randomUUID } from "crypto";
import DB from "../../db/db-configuration";
import { AppError } from "../../core/errors/app-error";

export type Direction = "income" | "expense";

export type Status =
  | "confirmed"
  | "forecast"
  | "overdue"
  | "scheduled"
  | "paid"
  | "cancelled";

interface CreateMovementDto {
  date: string;
  description: string;
  direction: Direction;
  category: string;
  amount: number;
  status: Status;
}

interface GetMonthlySummaryParams {
  startDate?: string;
  months?: number;
}

interface GetMovementsParams {
  limit?: number;
  cursor?: string;
}

interface Company {
  id: string;
  name: string;
  currency: string;
  current_balance: number | string;
  minimum_threshold: number | string;
}

interface Movement {
  id: string;
  date: string;
  description: string;
  direction: Direction;
  category: string;
  amount: number;
  sourceType: string;
  status: string;
}

interface PaginatedMovements {
  data: Movement[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface MonthlySummaryItem {
  period: string;
  month: string;
  startingBalance: number;
  income: number;
  costs: number;
  netMovement: number;
  endingBalance: number;
}

const monthLabels = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function toMonthStart(dateText?: string): Date {
  if (!dateText) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const date = new Date(`${dateText}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new AppError("startDate inválido. Usa formato YYYY-MM-DD", 400, "VALIDATION_ERROR");
  }

  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function periodKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function monthLabel(period: string): string {
  const date = new Date(`${period}-01T00:00:00`);
  return `${monthLabels[date.getMonth()]} ${date.getFullYear()}`;
}

function monthKey(date: string): string {
  return date.slice(0, 7);
}

function generatePeriods(startDate?: string, months = 12): string[] {
  const safeMonths = Number.isFinite(months) && months > 0 ? months : 12;
  const limitedMonths = Math.min(safeMonths, 36);
  const start = toMonthStart(startDate);

  return Array.from({ length: limitedMonths }, (_, index) => {
    return periodKey(addMonths(start, index));
  });
}

export class CashFlowService {
  static async getCompany(companyId: string): Promise<Company> {
    const result = await DB.getPool().query(
      `SELECT id, name, currency, current_balance, minimum_threshold
       FROM companies WHERE id = $1`,
      [companyId]
    );

    if (!result.rows.length) {
      throw new AppError("Empresa no encontrada", 404, "COMPANY_NOT_FOUND");
    }

    return result.rows[0] as Company;
  }

  static async createManualMovement(
    companyId: string,
    data: CreateMovementDto
  ): Promise<Movement> {
    if (!data.date) {
      throw new AppError("La fecha es obligatoria", 400, "VALIDATION_ERROR");
    }

    if (!data.description || data.description.trim().length < 3) {
      throw new AppError("La descripción es obligatoria", 400, "VALIDATION_ERROR");
    }

    if (!["income", "expense"].includes(data.direction)) {
      throw new AppError("Tipo inválido: debe ser 'income' o 'expense'", 400, "VALIDATION_ERROR");
    }

    if (!data.amount || Number(data.amount) <= 0) {
      throw new AppError("El monto debe ser mayor a cero", 400, "VALIDATION_ERROR");
    }

    await this.getCompany(companyId);

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
        data.direction,
        data.category || "other",
        Number(data.amount),
        data.status || "forecast",
        "manual",
      ]
    );

    return result.rows[0] as Movement;
  }

  static async deleteMovement(companyId: string, id: string): Promise<void> {
    const result = await DB.getPool().query(
      `DELETE FROM cash_flow_movements
       WHERE id = $1 AND company_id = $2
       RETURNING id`,
      [id, companyId]
    );

    if (!result.rows.length) {
      throw new AppError("Movimiento no encontrado", 404, "NOT_FOUND");
    }
  }

  static async getMovements(
    companyId: string,
    params: GetMovementsParams = {}
  ): Promise<PaginatedMovements> {
    await this.getCompany(companyId);

    const safeLimit = Math.min(Math.max(Number(params.limit ?? 20), 1), 50);
    const queryParams: unknown[] = [companyId, safeLimit + 1];

    let cursorCondition = "";

    if (params.cursor) {
      queryParams.push(params.cursor);
      cursorCondition = `
        AND movement_date < (
          SELECT movement_date FROM cash_flow_movements
          WHERE id = $3 AND company_id = $1
        )`;
    }

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
       ${cursorCondition}
       ORDER BY movement_date DESC
       LIMIT $2`,
      queryParams
    );

    const rows = result.rows as Movement[];
    const hasMore = rows.length > safeLimit;
    const data = hasMore ? rows.slice(0, safeLimit) : rows;
    const nextCursor = hasMore && data.length > 0 ? data[data.length - 1].id : null;

    return { data, nextCursor, hasMore };
  }

  static async getAllMovements(companyId: string): Promise<Movement[]> {
    await this.getCompany(companyId);

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
       ORDER BY movement_date ASC`,
      [companyId]
    );

    return result.rows as Movement[];
  }

  static async getMonthlySummary(
    companyId: string,
    params: GetMonthlySummaryParams = {}
  ) {
    const company = await this.getCompany(companyId);
    const movements = await this.getAllMovements(companyId);
    const periods = generatePeriods(params.startDate, params.months ?? 12);

    let runningBalance = Number(company.current_balance);

    const monthlySummary: MonthlySummaryItem[] = periods.map((period) => {
      const monthMovements = movements.filter(
        (m) => monthKey(m.date) === period
      );

      const income = monthMovements
        .filter((m) => m.direction === "income")
        .reduce((sum, m) => sum + Number(m.amount), 0);

      const costs = monthMovements
        .filter((m) => m.direction === "expense")
        .reduce((sum, m) => sum + Number(m.amount), 0);

      const startingBalance = runningBalance;
      const netMovement = income - costs;
      const endingBalance = startingBalance + netMovement;

      runningBalance = endingBalance;

      return { period, month: monthLabel(period), startingBalance, income, costs, netMovement, endingBalance };
    });

    const lowestBalance = Math.min(...monthlySummary.map((item) => item.endingBalance));

    return {
      company: { id: company.id, name: company.name, currency: company.currency },
      currentBalance: Number(company.current_balance),
      minimumThreshold: Number(company.minimum_threshold),
      lowestBalance,
      range: { startDate: `${periods[0]}-01`, months: periods.length },
      monthlySummary,
      movements,
      chart: monthlySummary.map((item, index) => ({
        x: index,
        label: item.month,
        balance: item.endingBalance,
      })),
    };
  }
}
