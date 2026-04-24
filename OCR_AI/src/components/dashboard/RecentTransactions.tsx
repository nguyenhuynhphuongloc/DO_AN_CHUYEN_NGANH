import { transactions } from "../../mocks/finance";
import { formatCurrency } from "../../lib/utils";

export function RecentTransactions() {
  return (
    <div className="list-card">
      {transactions.slice(0, 4).map((transaction) => (
        <div key={transaction.id} className="list-row">
          <div>
            <strong>{transaction.title}</strong>
            <span>{transaction.merchant}</span>
          </div>
          <div className="list-row__meta">
            <strong>{formatCurrency(transaction.amount, transaction.currency)}</strong>
            <span>{transaction.date}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
