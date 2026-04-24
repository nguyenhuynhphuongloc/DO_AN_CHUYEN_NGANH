import { useState } from "react";

import { PageShell } from "../../components/layout/PageShell";
import { ReportCharts } from "../../components/reports/ReportCharts";

export function ReportsPage() {
  const [period, setPeriod] = useState("90d");

  return (
    <PageShell
      eyebrow="Reports / Analytics"
      title="Financial trends"
      description="Review cash flow, category concentration, and savings performance with clearer charts and lighter surfaces."
      action={
        <select className="field-control" value={period} onChange={(event) => setPeriod(event.target.value)}>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="6m">Last 6 months</option>
          <option value="12m">Last 12 months</option>
        </select>
      }
    >
      <ReportCharts />
    </PageShell>
  );
}
