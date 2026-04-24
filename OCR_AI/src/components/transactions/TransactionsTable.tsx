import type { TransactionRecord } from "../../types/finance";
import { formatCurrency } from "../../lib/utils";
import { DataTable } from "../shared/DataTable";

export function TransactionsTable({ transactions }: { transactions: TransactionRecord[] }) {
  return (
    <DataTable headers={["Transaction", "Category", "Date", "Account", "Amount", "Actions"]}>
      {transactions.map((transaction) => (
        <tr key={transaction.id}>
          <td>
            <div className="table-title">
              <strong>{transaction.title}</strong>
              <span>{transaction.merchant}</span>
            </div>
          </td>
          <td>{transaction.category}</td>
          <td>{transaction.date}</td>
          <td>{transaction.account}</td>
          <td className={transaction.type === "expense" ? "amount amount--negative" : "amount"}>
            {transaction.type === "expense" ? "-" : ""}
            {formatCurrency(transaction.amount, transaction.currency)}
          </td>
          <td>
            <div className="table-actions">
              <button className="button button--ghost" type="button">View</button>
              <button className="button button--ghost" type="button">Edit</button>
              <button className="button button--ghost" type="button">Delete</button>
            </div>
          </td>
        </tr>
      ))}
    </DataTable>
  );
}
