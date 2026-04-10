'use client';

import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { ReceiptOcrDebugPanel } from '@/components/receipt-ocr-debug-panel';
import { Shell } from '@/components/shell';
import { confirmReceipt, getCategories, getReceipt, getWallets, parseReceipt, saveReceiptFeedback } from '@/lib/api';
import { MissingAuthSessionError } from '@/lib/auth-storage';
import { Category, Receipt, ReceiptStructuredExtraction, Wallet } from '@/lib/types';

const PROCESSING_JOB_STATUSES = new Set(['queued', 'preprocessing', 'ocr_running', 'extracting']);

function isProcessing(receipt: Receipt | null) {
  return receipt?.active_job ? PROCESSING_JOB_STATUSES.has(receipt.active_job.status) : false;
}

function describeStatus(receipt: Receipt | null) {
  if (!receipt) {
    return 'Loading receipt...';
  }

  if (receipt.active_job?.status === 'failed') {
    return receipt.active_job.error_message ?? 'Receipt parsing failed';
  }

  if (receipt.active_job && PROCESSING_JOB_STATUSES.has(receipt.active_job.status)) {
    return `Receipt is ${receipt.active_job.status.replaceAll('_', ' ')}`;
  }

  if (receipt.receipt.status === 'ready_for_review' || receipt.receipt.status === 'reviewed' || receipt.receipt.status === 'confirmed') {
    return 'Receipt is ready for review';
  }

  return `Receipt status: ${receipt.receipt.status}`;
}

function getExtractionDetails(receipt: Receipt | null): ReceiptStructuredExtraction | null {
  const extractedJson = receipt?.extraction_result?.extracted_json;
  if (!extractedJson || typeof extractedJson !== 'object') {
    return null;
  }
  return extractedJson as ReceiptStructuredExtraction;
}

export default function ReceiptReviewPage() {
  const showOcrDebug = true;
  const router = useRouter();
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
  const [isSubmittingParse, setIsSubmittingParse] = useState(false);

  function syncFromReceipt(receiptData: Receipt) {
    const extraction = receiptData.extraction_result;
    setReceipt(receiptData);
    setMerchantName(extraction?.merchant_name ?? '');
    setAmount(extraction?.total_amount !== null && extraction?.total_amount !== undefined ? String(extraction.total_amount) : '');
    setTransactionDate(
      extraction?.transaction_date ? new Date(`${extraction.transaction_date}T00:00:00`).toISOString().slice(0, 16) : '',
    );
    setFeedback(receiptData.latest_feedback?.feedback_note ?? '');
    setStatus(describeStatus(receiptData));
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
      } catch (err) {
        if (err instanceof MissingAuthSessionError) {
          router.replace('/login');
          return;
        }

        setError(err instanceof Error ? err.message : 'Unable to load receipt');
      }
    }

    void load();
  }, [receiptId, router]);

  useEffect(() => {
    if (!receipt || !isProcessing(receipt)) {
      return undefined;
    }

    const intervalId = window.setInterval(async () => {
      try {
        const refreshed = await getReceipt(receiptId);
        syncFromReceipt(refreshed);
        if (refreshed.active_job?.status === 'failed') {
          setError(refreshed.active_job.error_message ?? 'Unable to parse receipt');
        }
      } catch (err) {
        if (err instanceof MissingAuthSessionError) {
          router.replace('/login');
          return;
        }

        setError(err instanceof Error ? err.message : 'Unable to refresh receipt status');
      }
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [receipt, receiptId, router]);

  async function handleParse(force = false) {
    setIsSubmittingParse(true);
    setStatus(force ? 'Requeueing receipt parse...' : 'Queueing receipt parse...');
    setError('');
    try {
      const payload = await parseReceipt(receiptId, { force });
      syncFromReceipt(payload.receipt);
      const parsedFields =
        payload.extracted_fields && typeof payload.extracted_fields === 'object' && 'fields' in payload.extracted_fields
          ? (payload.extracted_fields.fields as Record<string, unknown> | undefined)
          : (payload.extracted_fields as Record<string, unknown> | null);
      if (parsedFields) {
        setMerchantName(String(parsedFields.merchant_name ?? ''));
        setAmount(
          parsedFields.total_amount !== null && parsedFields.total_amount !== undefined
            ? String(parsedFields.total_amount)
            : '',
        );
        setTransactionDate(
          parsedFields.transaction_date ? new Date(String(parsedFields.transaction_date)).toISOString().slice(0, 16) : '',
        );
      }
    } catch (err) {
      if (err instanceof MissingAuthSessionError) {
        router.replace('/login');
        return;
      }

      setError(err instanceof Error ? err.message : 'Unable to queue receipt parse');
    } finally {
      setIsSubmittingParse(false);
    }
  }

  async function handleFeedback() {
    try {
      const updated = await saveReceiptFeedback(receiptId, {
        feedback,
        merchant_name: merchantName || undefined,
        transaction_date: transactionDate ? new Date(transactionDate).toISOString() : undefined,
        total_amount: amount ? Number(amount) : undefined,
        currency: receipt?.extraction_result?.currency ?? undefined,
      });
      syncFromReceipt(updated);
      setStatus('Feedback saved');
    } catch (err) {
      if (err instanceof MissingAuthSessionError) {
        router.replace('/login');
        return;
      }

      setError(err instanceof Error ? err.message : 'Unable to save feedback');
    }
  }

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Confirming receipt...');
    setError('');

    try {
      const updated = await confirmReceipt(receiptId, {
        wallet_id: walletId,
        category_id: categoryId,
        type,
        amount: Number(amount),
        description,
        merchant_name: merchantName || undefined,
        transaction_date: transactionDate ? new Date(transactionDate).toISOString() : new Date().toISOString(),
      });
      syncFromReceipt(updated);
      setStatus(updated.finance_warning ?? 'Receipt confirmed and transaction created');
    } catch (err) {
      if (err instanceof MissingAuthSessionError) {
        router.replace('/login');
        return;
      }

      setError(err instanceof Error ? err.message : 'Unable to confirm receipt');
    }
  }

  const reviewReady = Boolean(receipt?.extraction_result);
  const processing = isProcessing(receipt);
  const extractionDetails = getExtractionDetails(receipt);
  const extractedFields = extractionDetails?.fields;
  const extractedItems = extractionDetails?.items ?? [];
  const needsReview = extractionDetails?.needs_review_fields ?? [];
  const fieldConfidence = extractionDetails?.field_confidence ?? {};

  return (
    <Shell>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,0.9fr)]">
        <aside className="rounded-[2rem] border border-black/5 bg-white/85 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-accent">Receipt details</p>
          <h2 className="mt-2 max-w-full break-words text-2xl font-semibold">
            {receipt?.receipt.file_name ?? 'Loading...'}
          </h2>
          <p className="mt-4 text-sm text-neutral-600">Status: {receipt?.receipt.status ?? 'unknown'}</p>
          <p className="mt-2 text-sm text-neutral-600">{status}</p>
          {receipt?.active_job?.error_message && receipt.active_job.status === 'failed' ? (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{receipt.active_job.error_message}</p>
          ) : null}
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
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleParse(receipt?.receipt.status === 'failed' || receipt?.receipt.status === 'ready_for_review')}
              className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              disabled={isSubmittingParse || processing}
            >
              {processing ? 'Parse in progress' : receipt?.receipt.status === 'failed' ? 'Retry OCR parse' : 'Queue OCR parse'}
            </button>
          </div>
          <div className="mt-6 space-y-2 text-sm text-neutral-600">
            <p>OCR provider: {receipt?.ocr_result?.ocr_provider ?? 'Pending'}</p>
            <p>OCR device: {receipt?.ocr_debug?.device ?? 'Pending'}</p>
            <p>Job state: {receipt?.active_job?.status ?? 'No parse job'}</p>
            <p>Review status: {receipt?.extraction_result?.review_status ?? 'Pending'}</p>
          </div>
          {reviewReady && (extractedFields?.payment_method || extractedFields?.receipt_number || extractedItems.length > 0 || needsReview.length > 0 || extractionDetails?.extraction_version) ? (
            <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm text-neutral-700">
              <p className="font-medium text-neutral-900">Extended extraction</p>
              {extractionDetails?.extraction_version ? <p className="mt-2">Engine: {extractionDetails.extraction_version}</p> : null}
              {extractedFields?.payment_method ? <p className="mt-2">Payment method: {extractedFields.payment_method}</p> : null}
              {extractedFields?.receipt_number ? <p className="mt-1">Receipt number: {extractedFields.receipt_number}</p> : null}
              {extractedItems.length > 0 ? <p className="mt-1">Detected items: {extractedItems.length}</p> : null}
              {needsReview.length > 0 ? <p className="mt-1">Needs review: {needsReview.join(', ')}</p> : null}
            </div>
          ) : null}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium">Feedback</label>
            <textarea
              className="min-h-32 w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent disabled:bg-neutral-100"
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="Describe any extraction issues here"
              disabled={!reviewReady}
            />
            <button
              type="button"
              onClick={handleFeedback}
              className="mt-3 rounded-full border border-accent px-5 py-3 text-sm font-semibold text-accent disabled:opacity-60"
              disabled={!reviewReady}
            >
              Save feedback
            </button>
          </div>
        </aside>

        <form onSubmit={handleConfirm} className="rounded-[2rem] border border-black/5 bg-white/85 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-accent">Review extraction</p>
          <h2 className="mt-2 text-2xl font-semibold">Edit and confirm the transaction</h2>
          {!reviewReady ? (
            <p className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
              Parsed fields will appear here once the background OCR worker finishes. You can keep this page open while it polls.
            </p>
          ) : null}
          {reviewReady && (extractedFields?.merchant_phone || extractedFields?.merchant_address || extractedFields?.cashier_name || extractedFields?.table_number || extractedFields?.guest_count || extractionDetails?.description_text || extractionDetails?.extraction_notes?.length) ? (
            <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm text-neutral-700">
              <p className="font-medium text-neutral-900">Optional receipt details</p>
              {extractedFields?.merchant_phone ? <p className="mt-2">Phone: {extractedFields.merchant_phone}</p> : null}
              {extractedFields?.merchant_address ? <p className="mt-1">Address: {extractedFields.merchant_address}</p> : null}
              {extractedFields?.cashier_name ? <p className="mt-1">Cashier: {extractedFields.cashier_name}</p> : null}
              {extractedFields?.table_number ? <p className="mt-1">Table: {extractedFields.table_number}</p> : null}
              {extractedFields?.guest_count ? <p className="mt-1">Guest count: {extractedFields.guest_count}</p> : null}
              {extractionDetails?.description_text ? <p className="mt-1">Description hint: {extractionDetails.description_text}</p> : null}
              {extractionDetails?.extraction_notes?.length ? <p className="mt-1">Notes: {extractionDetails.extraction_notes.join('; ')}</p> : null}
            </div>
          ) : null}
          {reviewReady && (fieldConfidence.merchant_name !== undefined || fieldConfidence.total_amount !== undefined || fieldConfidence.transaction_date !== undefined) ? (
            <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm text-neutral-700">
              <p className="font-medium text-neutral-900">Field confidence</p>
              {fieldConfidence.merchant_name !== undefined ? <p className="mt-2">Merchant: {fieldConfidence.merchant_name ?? 'n/a'}</p> : null}
              {fieldConfidence.transaction_date !== undefined ? <p className="mt-1">Date: {fieldConfidence.transaction_date ?? 'n/a'}</p> : null}
              {fieldConfidence.total_amount !== undefined ? <p className="mt-1">Total: {fieldConfidence.total_amount ?? 'n/a'}</p> : null}
              {fieldConfidence.payment_method !== undefined ? <p className="mt-1">Payment: {fieldConfidence.payment_method ?? 'n/a'}</p> : null}
            </div>
          ) : null}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Merchant name</span>
              <input
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent disabled:bg-neutral-100"
                value={merchantName}
                onChange={(event) => setMerchantName(event.target.value)}
                disabled={!reviewReady}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Amount</span>
              <input
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent disabled:bg-neutral-100"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={!reviewReady}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Transaction date</span>
              <input
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent disabled:bg-neutral-100"
                type="datetime-local"
                value={transactionDate}
                onChange={(event) => setTransactionDate(event.target.value)}
                disabled={!reviewReady}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Type</span>
              <select
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent disabled:bg-neutral-100"
                value={type}
                onChange={(event) => setType(event.target.value as 'INCOME' | 'EXPENSE')}
                disabled={!reviewReady}
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Wallet</span>
              <select
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent disabled:bg-neutral-100"
                value={walletId}
                onChange={(event) => setWalletId(event.target.value)}
                disabled={!reviewReady}
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
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent disabled:bg-neutral-100"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                disabled={!reviewReady}
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
              className="min-h-28 w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent disabled:bg-neutral-100"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={!reviewReady}
            />
          </label>
          {error ? <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
          <button
            className="mt-6 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            type="submit"
            disabled={!reviewReady || !amount || !transactionDate}
          >
            Confirm receipt
          </button>
        </form>

        {showOcrDebug ? <ReceiptOcrDebugPanel ocrDebug={receipt?.ocr_debug ?? null} /> : null}
      </section>
    </Shell>
  );
}
