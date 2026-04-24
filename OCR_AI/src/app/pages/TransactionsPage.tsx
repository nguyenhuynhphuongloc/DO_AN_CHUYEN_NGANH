import { useMemo, useState } from "react";

import { PageShell } from "../../components/layout/PageShell";
import { EmptyState } from "../../components/shared/EmptyState";
import { transactions } from "../../mocks/finance";
import { TransactionFilters } from "../../components/transactions/TransactionFilters";
import { TransactionsTable } from "../../components/transactions/TransactionsTable";

export function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("all");

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        const matchesSearch =
          !search ||
          `${transaction.title} ${transaction.merchant}`.toLowerCase().includes(search.toLowerCase());
        const matchesType = type === "all" || transaction.type === type;
        const matchesCategory = category === "all" || transaction.category === category;
        return matchesSearch && matchesType && matchesCategory;
      }),
    [search, type, category]
  );

  return (
    <PageShell
      eyebrow="Transactions"
      title="Transaction management"
      description="Filter, inspect, and operate across personal income, expense, and transfer entries."
      action={<button className="button button--accent">Add transaction</button>}
    >
      <TransactionFilters
        search={search}
        onSearch={setSearch}
        type={type}
        onType={setType}
        category={category}
        onCategory={setCategory}
      />
      {filteredTransactions.length ? (
        <TransactionsTable transactions={filteredTransactions} />
      ) : (
        <EmptyState
          title="No transactions match the current filters"
          description="Adjust search or filter criteria to reveal transaction history."
          action={<button className="button button--ghost">Clear filters</button>}
        />
      )}
    </PageShell>
  );
}
