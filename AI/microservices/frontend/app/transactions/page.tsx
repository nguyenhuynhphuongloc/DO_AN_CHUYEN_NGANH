import { Shell } from '@/components/shell';
import { getTransactions } from '@/lib/api';

export default async function TransactionsPage() {
  const transactions = await getTransactions();

  return (
    <Shell>
      <section className="rounded-[2rem] border border-black/5 bg-white/85 p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Transactions</p>
        <h2 className="mt-2 text-2xl font-semibold">All recorded entries</h2>
        <div className="mt-6 overflow-hidden rounded-3xl border border-neutral-100">
          <table className="min-w-full divide-y divide-neutral-100 text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Wallet</th>
                <th className="px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-4 py-3">{new Date(transaction.transactionDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{transaction.type}</td>
                  <td className="px-4 py-3">{transaction.description ?? transaction.merchantName ?? 'N/A'}</td>
                  <td className="px-4 py-3">{transaction.wallet?.name ?? 'N/A'}</td>
                  <td className="px-4 py-3">{transaction.amount.toLocaleString()} VND</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Shell>
  );
}
