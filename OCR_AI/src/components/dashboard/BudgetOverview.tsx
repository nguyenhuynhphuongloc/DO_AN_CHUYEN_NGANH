import { budgets } from "../../mocks/finance";
import { formatCurrency } from "../../lib/utils";

export function BudgetOverview() {
  return (
    <div className="progress-list">
      {budgets.map((budget) => {
        const ratio = Math.min((budget.spent / budget.limit) * 100, 100);
        return (
          <article key={budget.id} className="progress-item">
            <div className="progress-item__header">
              <strong>{budget.category}</strong>
              <span>{formatCurrency(budget.limit - budget.spent)}</span>
            </div>
            <div className="progress-bar">
              <span style={{ width: `${ratio}%`, background: budget.color }} />
            </div>
            <div className="progress-item__footer">
              <span>{formatCurrency(budget.spent)} spent</span>
              <span>{ratio >= 100 ? "Exceeded" : `${ratio.toFixed(0)}% used`}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
