import { CashFlowService } from "../cashflow/cash-flow.service";
import { InvoicesService } from "../invoices/invoices.service";
import { BillsService } from "../bills/bills.service";

export class InsightsService {
  static getAll() {
    const cashFlow = CashFlowService.getMonthlySummary();
    const invoices = InvoicesService.getSummary();
    const bills = BillsService.getSummary();

    return [
      {
        id: "insight_001",
        type: "positive",
        title: "Posición de caja controlada",
        description: "El saldo proyectado se mantiene sobre el umbral mínimo definido.",
        metric: cashFlow.lowestBalance,
      },
      {
        id: "insight_002",
        type: "warning",
        title: "Pagos concentrados",
        description: "Existe concentración de pagos próximos a proveedores.",
        metric: bills.dueThisWeek,
      },
      {
        id: "insight_003",
        type: "risk",
        title: "Facturas vencidas",
        description: "Hay facturas por cobrar vencidas que podrían afectar la liquidez.",
        metric: invoices.overdue,
      },
    ];
  }
}