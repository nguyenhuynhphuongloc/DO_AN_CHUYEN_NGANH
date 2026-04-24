import { savingsGoals } from "../../mocks/finance";
import { formatCurrency } from "../../lib/utils";

export function SavingsOverview() {
  return (
    <div className="goal-grid">
      {savingsGoals.map((goal) => {
        const ratio = Math.min((goal.current / goal.target) * 100, 100);
        return (
          <article key={goal.id} className="goal-card">
            <strong>{goal.name}</strong>
            <span>{goal.dueDate}</span>
            <div className="progress-bar">
              <span style={{ width: `${ratio}%` }} />
            </div>
            <div className="goal-card__meta">
              <span>{formatCurrency(goal.current)}</span>
              <span>{formatCurrency(goal.target)}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
