import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { categorySpend, reportSeries } from "../../mocks/finance";

export function ReportCharts() {
  return (
    <div className="chart-grid">
      <article className="chart-card">
        <h3>Income vs Expense Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={reportSeries}>
            <CartesianGrid stroke="rgba(21, 38, 62, 0.08)" vertical={false} />
            <XAxis dataKey="month" stroke="currentColor" />
            <YAxis stroke="currentColor" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#d4af37" strokeWidth={2.4} />
            <Line type="monotone" dataKey="expense" stroke="#4f7cff" strokeWidth={2.4} />
          </LineChart>
        </ResponsiveContainer>
      </article>
      <article className="chart-card">
        <h3>Spending by Category</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={categorySpend} dataKey="value" nameKey="category" innerRadius={62} outerRadius={92}>
              {categorySpend.map((entry) => (
                <Cell key={entry.category} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </article>
      <article className="chart-card chart-card--wide">
        <h3>Cash Flow Snapshot</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={reportSeries}>
            <CartesianGrid stroke="rgba(21, 38, 62, 0.08)" vertical={false} />
            <XAxis dataKey="month" stroke="currentColor" />
            <YAxis stroke="currentColor" />
            <Tooltip />
            <Legend />
            <Bar dataKey="savings" fill="#2bc28b" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </article>
    </div>
  );
}
