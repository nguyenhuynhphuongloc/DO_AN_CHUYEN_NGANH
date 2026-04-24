import type { BudgetSummary } from "../../types/finance";
import { formatCurrency } from "../../lib/utils";

export function BudgetCard({ budget }: { budget: BudgetSummary }) {
  const ratio = Math.min((budget.spent / budget.limit) * 100, 100);

  return (
    <article className="budget-card">
      <div className="budget-card__header">
        <strong>{budget.category}</strong>
        <span>{ratio > 100 ? "Exceeded" : "On track"}</span>
      </div>
      <div className="progress-bar">
        <span style={{ width: `${ratio}%`, background: budget.color }} />
      </div>
      <div className="budget-card__meta">
        <span>{formatCurrency(budget.spent)} spent</span>
        <span>{formatCurrency(budget.limit)} limit</span>
      </div>
    </article>
  );
}
