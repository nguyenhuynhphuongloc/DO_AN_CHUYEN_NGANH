import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, CartesianGrid } from "recharts";

import { BudgetOverview } from "../../components/dashboard/BudgetOverview";
import { QuickActions } from "../../components/dashboard/QuickActions";
import { RecentTransactions } from "../../components/dashboard/RecentTransactions";
import { SavingsOverview } from "../../components/dashboard/SavingsOverview";
import { PageShell } from "../../components/layout/PageShell";
import { StatCard } from "../../components/shared/StatCard";
import { categorySpend, dashboardStats } from "../../mocks/finance";

export function DashboardPage() {
  return (
    <PageShell
      eyebrow="Dashboard"
      title="Financial command"
      description="A cleaner overview of balances, income, spending, budgets, savings, and fast actions."
    >
      <div className="stats-grid">
        {dashboardStats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="panel-card">
          <h3>Quick actions</h3>
          <QuickActions />
        </div>
        <div className="panel-card">
          <h3>Spending by category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categorySpend}>
              <CartesianGrid stroke="rgba(21, 38, 62, 0.08)" vertical={false} />
              <XAxis dataKey="category" stroke="currentColor" />
              <Tooltip />
              <Bar dataKey="value" fill="#d4af37" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="panel-card">
          <h3>Recent transactions</h3>
          <RecentTransactions />
        </div>
        <div className="panel-card">
          <h3>Budget progress</h3>
          <BudgetOverview />
        </div>
        <div className="panel-card panel-card--wide">
          <h3>Savings goals</h3>
          <SavingsOverview />
        </div>
      </div>
    </PageShell>
  );
}
