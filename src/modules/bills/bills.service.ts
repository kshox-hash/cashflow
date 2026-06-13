import { randomUUID } from "crypto";
import DB from "../../db/db-configuration";
import { AppError } from "../../core/errors/app-error";

type Status = "pending" | "approved" | "scheduled" | "overdue" | "paid" | "cancelled";

interface CreateBillDto {
  dueDate: string;
  supplier: string;
  description: string;
  category: string;
  amount: number;
  status: Status;
}

interface Bill {
  id: string;
  dueDate: string;
  supplier: string;
  description: string;
  direction: "expense";
  category: string;
  amount: number;
  sourceType: string;
  status: string;
}

export class BillsService {
  static async getAll(companyId: string): Promise<Bill[]> {
    const result = await DB.getPool().query(
      `SELECT
        id,
        TO_CHAR(movement_date, 'YYYY-MM-DD') AS "dueDate",
        supplier_name AS supplier,
        description, direction, category,
        amount::float AS amount,
        source_type AS "sourceType",
        status
       FROM cash_flow_movements
       WHERE company_id = $1 AND source_type = 'bill_to_pay'
       ORDER BY movement_date ASC`,
      [companyId]
    );

    return result.rows as Bill[];
  }

  static async getSummary(companyId: string) {
    const bills = await this.getAll(companyId);

    const total = bills.reduce((sum, item) => sum + Number(item.amount), 0);

    const overdue = bills
      .filter((x) => x.status === "overdue")
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const now = new Date();
    const next7Days = new Date();
    next7Days.setDate(now.getDate() + 7);

    const dueThisWeek = bills
      .filter((item) => {
        const due = new Date(item.dueDate);
        return due >= now && due <= next7Days;
      })
      .reduce((sum, item) => sum + Number(item.amount), 0);

    return { total, overdue, dueThisWeek, count: bills.length };
  }

  static async create(companyId: string, data: CreateBillDto): Promise<Bill> {
    if (!data.dueDate) {
      throw new AppError("La fecha es obligatoria", 400, "VALIDATION_ERROR");
    }

    if (!data.supplier?.trim()) {
      throw new AppError("Proveedor requerido", 400, "VALIDATION_ERROR");
    }

    if (!data.description?.trim()) {
      throw new AppError("Descripción requerida", 400, "VALIDATION_ERROR");
    }

    if (!data.amount || Number(data.amount) <= 0) {
      throw new AppError("Monto inválido", 400, "VALIDATION_ERROR");
    }

    const result = await DB.getPool().query(
      `INSERT INTO cash_flow_movements (
        id, company_id, movement_date, supplier_name,
        description, direction, category, amount, status, source_type
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING
        id,
        TO_CHAR(movement_date, 'YYYY-MM-DD') AS "dueDate",
        supplier_name AS supplier,
        description, direction, category,
        amount::float AS amount,
        source_type AS "sourceType",
        status`,
      [
        randomUUID(),
        companyId,
        data.dueDate,
        data.supplier.trim(),
        data.description.trim(),
        "expense",
        data.category || "proveedor",
        Number(data.amount),
        data.status || "pending",
        "bill_to_pay",
      ]
    );

    return result.rows[0] as Bill;
  }

  static async delete(companyId: string, id: string): Promise<void> {
    const result = await DB.getPool().query(
      `DELETE FROM cash_flow_movements
       WHERE id = $1 AND company_id = $2 AND source_type = 'bill_to_pay'
       RETURNING id`,
      [id, companyId]
    );

    if (!result.rows.length) {
      throw new AppError("Cuenta no encontrada", 404, "NOT_FOUND");
    }
  }
}
