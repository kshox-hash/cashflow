import { randomUUID } from "crypto";
import DB from "../../db/db-configuration";

type Status =
  | "forecast"
  | "confirmed"
  | "overdue"
  | "paid";

interface CreateInvoiceDto {
  dueDate: string;
  customer: string;
  description: string;
  category: string;
  amount: number;
  status: Status;
}

interface InvoiceDue {
  id: string;
  dueDate: string;
  customer: string;
  description: string;
  direction: "income";
  category: string;
  amount: number;
  sourceType: string;
  status: string;
}

export class InvoicesDueService {
  static async getAll(
    companyId: string
  ): Promise<InvoiceDue[]> {
    const result = await DB.getPool().query(
      `
      SELECT
        id,
        TO_CHAR(movement_date, 'YYYY-MM-DD') AS "dueDate",
        customer_name AS customer,
        description,
        direction,
        category,
        amount::float AS amount,
        source_type AS "sourceType",
        status
      FROM cash_flow_movements
      WHERE company_id = $1
        AND source_type = 'invoice_due'
      ORDER BY movement_date ASC
      `,
      [companyId]
    );

    return result.rows as InvoiceDue[];
  }

  static async getSummary(companyId: string) {
    const invoices = await this.getAll(companyId);

    const total = invoices.reduce((sum, item) => {
      return sum + Number(item.amount);
    }, 0);

    const overdue = invoices
      .filter((x) => x.status === "overdue")
      .reduce((sum, item) => {
        return sum + Number(item.amount);
      }, 0);

    const now = new Date();

    const currentMonth =
      `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;

    const currentMonthTotal = invoices
      .filter((item) =>
        item.dueDate.startsWith(currentMonth)
      )
      .reduce((sum, item) => {
        return sum + Number(item.amount);
      }, 0);

    return {
      total,
      overdue,
      currentMonth: currentMonthTotal,
      count: invoices.length,
    };
  }

  static async create(
    companyId: string,
    data: CreateInvoiceDto
  ): Promise<InvoiceDue> {
    if (!data.dueDate) {
      throw new Error("Fecha requerida");
    }

    if (!data.customer?.trim()) {
      throw new Error("Cliente requerido");
    }

    if (!data.description?.trim()) {
      throw new Error("Descripción requerida");
    }

    if (!data.amount || Number(data.amount) <= 0) {
      throw new Error("Monto inválido");
    }

    const result = await DB.getPool().query(
      `
      INSERT INTO cash_flow_movements (
        id,
        company_id,
        movement_date,
        customer_name,
        description,
        direction,
        category,
        amount,
        status,
        source_type
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      )
      RETURNING
        id,
        TO_CHAR(movement_date, 'YYYY-MM-DD') AS "dueDate",
        customer_name AS customer,
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
        data.dueDate,
        data.customer.trim(),
        data.description.trim(),
        "income",
        data.category || "venta",
        Number(data.amount),
        data.status || "forecast",
        "invoice_due",
      ]
    );

    return result.rows[0] as InvoiceDue;
  }

  static async delete(
    companyId: string,
    id: string
  ): Promise<void> {
    const result = await DB.getPool().query(
      `
      DELETE FROM cash_flow_movements
      WHERE id = $1
        AND company_id = $2
        AND source_type = 'invoice_due'
      RETURNING id
      `,
      [id, companyId]
    );

    if (!result.rows.length) {
      throw new Error("Factura no encontrada");
    }
  }
}