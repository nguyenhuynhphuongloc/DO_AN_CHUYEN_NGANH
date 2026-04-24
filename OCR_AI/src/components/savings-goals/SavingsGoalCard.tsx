import type { SavingsGoal } from "../../types/finance";
import { formatCurrency } from "../../lib/utils";

export function SavingsGoalCard({ goal }: { goal: SavingsGoal }) {
  const ratio = Math.min((goal.current / goal.target) * 100, 100);

  return (
    <article className="goal-card goal-card--detailed">
      <div className="goal-card__top">
        <strong>{goal.name}</strong>
        <span>{goal.dueDate}</span>
      </div>
      <div className="progress-bar">
        <span style={{ width: `${ratio}%` }} />
      </div>
      <div className="goal-card__meta">
        <span>{formatCurrency(goal.current)}</span>
        <span>{formatCurrency(goal.target)}</span>
      </div>
      <small>{formatCurrency(goal.contribution)} monthly contribution</small>
    </article>
  );
}
