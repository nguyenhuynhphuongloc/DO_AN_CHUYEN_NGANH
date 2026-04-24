import { BudgetCard } from "../../components/budgets/BudgetCard";
import { PageShell } from "../../components/layout/PageShell";
import { budgets } from "../../mocks/finance";

export function BudgetsPage() {
  return (
    <PageShell
      eyebrow="Budgets"
      title="Category budgets"
      description="Track spend thresholds, overages, and remaining room by category."
      action={<button className="button button--accent">Create budget</button>}
    >
      <div className="budget-grid">
        {budgets.map((budget) => (
          <BudgetCard key={budget.id} budget={budget} />
        ))}
      </div>
    </PageShell>
  );
}
