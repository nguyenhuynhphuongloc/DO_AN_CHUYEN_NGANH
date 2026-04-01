'use client';

import { useParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { ReceiptOcrDebugPanel } from '@/components/receipt-ocr-debug-panel';
import { Shell } from '@/components/shell';
import { confirmReceipt, getCategories, getReceipt, getWallets, parseReceipt, saveReceiptFeedback } from '@/lib/api';
import { Category, Receipt, ReceiptJob, Wallet } from '@/lib/types';

const ACTIVE_PARSE_JOB_STATUSES = new Set(['queued', 'preprocessing', 'ocr_running', 'extracting']);


function getLatestParseJob(receipt: Receipt | null): ReceiptJob | null {
  if (!receipt) {
    return null;
  }
  return receipt.jobs.find((job) => job.job_type === 'parse') ?? null;
}


function isReceiptProcessing(receipt: Receipt | null): boolean {
  const parseJob = getLatestParseJob(receipt);
  if (parseJob && ACTIVE_PARSE_JOB_STATUSES.has(parseJob.status)) {
    return true;
  }
  return receipt ? ACTIVE_PARSE_JOB_STATUSES.has(receipt.receipt.status) : false;
}

function toDateInputValue(value: string | null | undefined) {
  return value ?? '';
}

function toIsoDate(value: string) {
  return new Date(`${value}T00:00:00`).toISOString();
}

export default function ReceiptReviewPage() {
  const showOcrDebug = true;
  const params = useParams<{ id: string }>();
  const receiptId = params.id;
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [walletId, setWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [merchantName, setMerchantName] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [description, setDescription] = useState('');
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('Loading receipt...');
  const [error, setError] = useState('');

  function syncFromReceipt(receiptData: Receipt) {
    const extraction = receiptData.extraction_result;
    setReceipt(receiptData);
    if (extraction) {
      setMerchantName(extraction.merchant_name ?? '');
      setAmount(extraction.total_amount !== null && extraction.total_amount !== undefined ? String(extraction.total_amount) : '');
      setTransactionDate(toDateInputValue(extraction.transaction_date));
    }
    setFeedback(receiptData.latest_feedback?.feedback_note ?? '');
  }

  useEffect(() => {
    async function load() {
      try {
        const [receiptData, walletData, categoryData] = await Promise.all([
          getReceipt(receiptId),
          getWallets(),
          getCategories(),
        ]);
        syncFromReceipt(receiptData);
        setWallets(walletData);
        setCategories(categoryData);
        setWalletId(walletData[0]?.id ?? '');
        setCategoryId(categoryData[0]?.id ?? '');
        setStatus('Receipt loaded');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load receipt');
      }
    }

    void load();
  }, [receiptId]);

  useEffect(() => {
    if (!isReceiptProcessing(receipt)) {
      return undefined;
    }

    const intervalId = window.setInterval(async () => {
      try {
        const receiptData = await getReceipt(receiptId);
        syncFromReceipt(receiptData);
        const parseJob = getLatestParseJob(receiptData);
        if (parseJob?.status === 'failed') {
          setStatus(parseJob.error_message ?? 'Receipt parse failed');
          setError(parseJob.error_message ?? 'Receipt parse failed');
          return;
        }
        if (parseJob?.status === 'ready_for_review' || receiptData.receipt.status === 'ready_for_review') {
          setStatus('Receipt ready for review');
          return;
        }
        setStatus(`Processing receipt: ${parseJob?.status ?? receiptData.receipt.status}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to refresh receipt status');
      }
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [receipt, receiptId]);

  async function handleParse() {
    setStatus('Parsing receipt...');
    setError('');
    try {
      const payload = await parseReceipt(receiptId);
      syncFromReceipt(payload.receipt);
      if (payload.extracted_fields.merchant_name !== null && payload.extracted_fields.merchant_name !== undefined) {
        setMerchantName(String(payload.extracted_fields.merchant_name));
      }
      if (payload.extracted_fields.total_amount !== null && payload.extracted_fields.total_amount !== undefined) {
        setAmount(String(payload.extracted_fields.total_amount));
      }
      if (payload.extracted_fields.transaction_date) {
        setTransactionDate(toDateInputValue(payload.extracted_fields.transaction_date));
      }
      const parseJob = getLatestParseJob(payload.receipt);
      const detectedLines = payload.receipt.ocr_debug?.line_details?.length ?? 0;
      setStatus(
        parseJob && ACTIVE_PARSE_JOB_STATUSES.has(parseJob.status)
          ? `Receipt queued: ${parseJob.status}`
          : detectedLines > 0
            ? 'OCR parsing complete'
            : 'OCR parsing complete, but no readable text was detected',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to parse receipt');
    }
  }

  async function handleFeedback() {
    try {
      const updated = await saveReceiptFeedback(receiptId, {
        feedback,
        merchant_name: merchantName || undefined,
        transaction_date: transactionDate ? toIsoDate(transactionDate) : undefined,
        total_amount: amount ? Number(amount) : undefined,
        tax_amount: receipt?.extraction_result?.tax_amount ?? undefined,
        currency: receipt?.extraction_result?.currency ?? undefined,
      });
      syncFromReceipt(updated);
      setStatus('Feedback saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save feedback');
    }
  }

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Confirming receipt...');
    setError('');

    if (!transactionDate) {
      setError('Transaction date is required before confirmation');
      setStatus('Review requires a manual transaction date');
      return;
    }

    if (!amount) {
      setError('Amount is required before confirmation');
      setStatus('Review requires a manual amount');
      return;
    }

    try {
      const updated = await confirmReceipt(receiptId, {
        wallet_id: walletId,
        category_id: categoryId,
        type,
        amount: Number(amount),
        description,
        merchant_name: merchantName || undefined,
        transaction_date: toIsoDate(transactionDate),
      });
      syncFromReceipt(updated);
      setStatus(updated.finance_warning ?? 'Receipt confirmed and transaction created');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to confirm receipt');
    }
  }

  const latestParseJob = getLatestParseJob(receipt);
  const processingReceipt = isReceiptProcessing(receipt);

  return (
    <Shell>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,0.9fr)]">
        <aside className="rounded-[2rem] border border-black/5 bg-white/85 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-accent">Receipt details</p>
          <h2 className="mt-2 text-2xl font-semibold">{receipt?.receipt.file_name ?? 'Loading...'}</h2>
          <p className="mt-4 text-sm text-neutral-600">Status: {receipt?.receipt.status ?? 'unknown'}</p>
          <p className="mt-2 text-sm text-neutral-600">{status}</p>
          {receipt?.finance_transaction_id ? (
            <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Created finance transaction: {receipt.finance_transaction_id}
            </p>
          ) : null}
          {receipt?.finance_warning ? (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {receipt.finance_warning}
            </p>
          ) : null}
          <button
            type="button"
            onClick={handleParse}
            className="mt-6 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            disabled={processingReceipt}
          >
            {processingReceipt ? 'Parsing in background...' : 'Run OCR parse'}
          </button>
          <div className="mt-6 space-y-2 text-sm text-neutral-600">
            <p>OCR provider: {receipt?.ocr_result?.ocr_provider ?? 'Not parsed yet'}</p>
            <p>Review status: {receipt?.extraction_result?.review_status ?? 'Not parsed yet'}</p>
            <p>Model language: {receipt?.ocr_debug?.model_lang ?? 'N/A'}</p>
            <p>Model device: {receipt?.ocr_debug?.model_device ?? 'N/A'}</p>
            <p>Parse job: {latestParseJob?.status ?? 'Not queued yet'}</p>
          </div>
          {processingReceipt ? (
            <p className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
              Receipt parsing is running in the background. The page will refresh automatically when review data is ready.
            </p>
          ) : null}
          {latestParseJob?.status === 'failed' ? (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {latestParseJob.error_message ?? 'Receipt parse failed'}
            </p>
          ) : null}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium">Feedback</label>
            <textarea
              className="min-h-32 w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent"
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="Describe any extraction issues here"
            />
            <button
              type="button"
              onClick={handleFeedback}
              className="mt-3 rounded-full border border-accent px-5 py-3 text-sm font-semibold text-accent"
            >
              Save feedback
            </button>
          </div>
        </aside>

        <form onSubmit={handleConfirm} className="rounded-[2rem] border border-black/5 bg-white/85 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-accent">Review extraction</p>
          <h2 className="mt-2 text-2xl font-semibold">Edit and confirm the transaction</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Merchant name</span>
              <input
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent"
                value={merchantName}
                onChange={(event) => setMerchantName(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Amount</span>
              <input
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Enter confirmed total"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Transaction date</span>
              <input
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent"
                type="date"
                value={transactionDate}
                onChange={(event) => setTransactionDate(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Type</span>
              <select
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent"
                value={type}
                onChange={(event) => setType(event.target.value as 'INCOME' | 'EXPENSE')}
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Wallet</span>
              <select
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent"
                value={walletId}
                onChange={(event) => setWalletId(event.target.value)}
              >
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Category</span>
              <select
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-medium">Description</span>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          {error ? <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
          <button
            className="mt-6 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white"
            type="submit"
          >
            Confirm receipt
          </button>
        </form>

        {showOcrDebug ? <ReceiptOcrDebugPanel ocrDebug={receipt?.ocr_debug ?? null} /> : null}
      </section>
    </Shell>
  );
}
