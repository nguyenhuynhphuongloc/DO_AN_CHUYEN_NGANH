import { PageShell } from "../../components/layout/PageShell";
import { SavingsGoalCard } from "../../components/savings-goals/SavingsGoalCard";
import { savingsGoals } from "../../mocks/finance";

export function SavingsGoalsPage() {
  return (
    <PageShell
      eyebrow="Savings Goals"
      title="Goal tracking"
      description="Follow target progress, completion pace, and contribution cadence."
      action={<button className="button button--accent">Create goal</button>}
    >
      <div className="goal-grid">
        {savingsGoals.map((goal) => (
          <SavingsGoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </PageShell>
  );
}
