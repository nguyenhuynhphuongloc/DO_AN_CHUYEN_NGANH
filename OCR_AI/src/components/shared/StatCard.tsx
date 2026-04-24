import { formatCurrency, formatPercent } from "../../lib/utils";

export function StatCard({
  label,
  value,
  currency,
  suffix,
  change,
  tone = "gold"
}: {
  label: string;
  value: number;
  currency?: string;
  suffix?: string;
  change: string;
  tone?: "gold" | "green" | "red" | "blue";
}) {
  const renderedValue = currency
    ? formatCurrency(value, currency)
    : suffix === "%"
      ? formatPercent(value)
      : `${value}${suffix ?? ""}`;

  return (
    <article className={`stat-card stat-card--${tone}`}>
      <span className="stat-card__label">{label}</span>
      <strong className="stat-card__value">{renderedValue}</strong>
      <span className="stat-card__change">{change}</span>
    </article>
  );
}
