'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import {
  confirmReceipt,
  confirmReceiptSession,
  getCategories,
  getReceipt,
  getReceiptSession,
  getWallets,
  parseReceipt,
  parseReceiptSession,
  saveReceiptFeedback,
  saveReceiptSessionFeedback,
  uploadReceipt,
} from '@/lib/api';
import { getAccessToken, MissingAuthSessionError } from '@/lib/auth-storage';
import { Category, ReceiptStructuredExtraction, ReceiptWorkflow, Wallet } from '@/lib/types';
import { ReceiptOcrTextPanel } from './receipt-ocr-text-panel';

const PROCESSING_JOB_STATUSES = new Set(['queued', 'preprocessing', 'ocr_running', 'extracting']);

const SHOW_OCR_TEXT_PANEL = true;

function currentStatusSource(receipt: ReceiptWorkflow | null) {
  return receipt?.session?.status ?? receipt?.receipt?.status ?? 'idle';
}

function isProcessing(receipt: ReceiptWorkflow | null) {
  return receipt?.active_job ? PROCESSING_JOB_STATUSES.has(receipt.active_job.status) : false;
}

function describeStatus(receipt: ReceiptWorkflow | null) {
  if (!receipt) {
    return 'Upload a receipt to begin parsing.';
  }

  if (receipt.active_job?.status === 'failed') {
    return receipt.active_job.error_message ?? 'Receipt parsing failed';
  }

  if (receipt.active_job && PROCESSING_JOB_STATUSES.has(receipt.active_job.status)) {
    return `Parsing stage: ${receipt.active_job.status.replaceAll('_', ' ')}`;
  }

  if (currentStatusSource(receipt) === 'ready_for_review' || currentStatusSource(receipt) === 'reviewed' || currentStatusSource(receipt) === 'confirmed') {
    return 'Parsed and ready for review';
  }

  return `Receipt status: ${currentStatusSource(receipt)}`;
}

function getExtractionDetails(receipt: ReceiptWorkflow | null): ReceiptStructuredExtraction | null {
  const extractedJson = receipt?.extraction_result?.extracted_json;
  if (!extractedJson || typeof extractedJson !== 'object') {
    return null;
  }
  return extractedJson as ReceiptStructuredExtraction;
}

function buildDateTimeInput(value: string | null | undefined) {
  if (!value) {
    return '';
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T12:00`;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return parsed.toISOString().slice(0, 16);
}

type ImageQualityHint = {
  label: string;
  state: 'good' | 'warn';
};

function getImageHints(file: File | null, imageSize: { width: number; height: number } | null): ImageQualityHint[] {
  const hints: ImageQualityHint[] = [
    { label: 'Full receipt visible', state: 'good' },
    { label: 'Corners are not cut off', state: 'good' },
    { label: 'No strong blur or motion', state: 'good' },
  ];

  if (!file || !imageSize) {
    return hints;
  }

  const longestSide = Math.max(imageSize.width, imageSize.height);
  if (longestSide < 1200) {
    hints[2] = { label: 'Low resolution image, OCR quality may drop', state: 'warn' };
  }

  if (file.size < 140_000) {
    hints.push({ label: 'File is highly compressed, text may be noisy', state: 'warn' });
  }

  const aspect = imageSize.height === 0 ? 1 : imageSize.width / imageSize.height;
  if (aspect > 1.25) {
    hints.push({ label: 'Landscape framing detected, ensure full receipt is still captured', state: 'warn' });
  }

  return hints;
}

export function ReceiptWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialReceiptId = searchParams.get('receiptId');
  const initialSessionId = searchParams.get('sessionId');

  const [receipt, setReceipt] = useState<ReceiptWorkflow | null>(null);
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
  const [status, setStatus] = useState('Upload a receipt to begin parsing.');
  const [error, setError] = useState('');
  const [isSubmittingParse, setIsSubmittingParse] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [receiptId, setReceiptId] = useState<string | null>(initialReceiptId);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);

  function syncFromReceipt(receiptData: ReceiptWorkflow) {
    const extraction = receiptData.extraction_result;
    const extractionDetails =
      extraction?.extracted_json && typeof extraction.extracted_json === 'object'
        ? (extraction.extracted_json as ReceiptStructuredExtraction)
        : null;
    setReceipt(receiptData);
    setMerchantName(extraction?.merchant_name ?? '');
    setAmount(extraction?.total_amount !== null && extraction?.total_amount !== undefined ? String(extraction.total_amount) : '');
    setTransactionDate(buildDateTimeInput(extraction?.transaction_date));
    setDescription((prev) => prev || extractionDetails?.description_text || '');
    setFeedback(receiptData.latest_feedback?.feedback_note ?? '');
    setStatus(describeStatus(receiptData));
    setReceiptId(receiptData.receipt?.id ?? receiptData.confirmed_receipt?.id ?? null);
    setSessionId(receiptData.session?.id ?? null);
  }

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/login');
      return;
    }

    async function loadBaseData() {
      try {
        const [walletData, categoryData] = await Promise.all([getWallets(), getCategories()]);
        setWallets(walletData);
        setCategories(categoryData);
        setWalletId((prev) => prev || walletData[0]?.id || '');
        setCategoryId((prev) => prev || categoryData[0]?.id || '');
      } catch (err) {
        if (err instanceof MissingAuthSessionError) {
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Unable to load workspace options');
      }
    }

    void loadBaseData();
  }, [router]);

  useEffect(() => {
    if (!receiptId && !sessionId) {
      return;
    }
    const currentReceiptId = receiptId;
    const currentSessionId = sessionId;

    async function loadReceiptById() {
      try {
        const receiptData = currentSessionId ? await getReceiptSession(currentSessionId) : await getReceipt(currentReceiptId as string);
        syncFromReceipt(receiptData);
      } catch (err) {
        if (err instanceof MissingAuthSessionError) {
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Unable to load receipt workspace');
      }
    }

    void loadReceiptById();
  }, [receiptId, sessionId, router]);

  useEffect(() => {
    if (!receipt || !isProcessing(receipt)) {
      return undefined;
    }

    const intervalId = window.setInterval(async () => {
      try {
        const refreshed = receipt.session?.id ? await getReceiptSession(receipt.session.id) : await getReceipt(receipt.receipt?.id as string);
        syncFromReceipt(refreshed);
      } catch (err) {
        if (err instanceof MissingAuthSessionError) {
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Unable to refresh receipt status');
      }
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [receipt, router]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleImageFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG, WEBP)');
      return;
    }

    setError('');
    setSelectedFile(file);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    const image = new Image();
    image.onload = () => {
      setImageSize({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.src = objectUrl;
  }

  function onFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    void handleImageFile(file);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }
    void handleImageFile(file);
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) {
      setError('Choose a receipt image first');
      return;
    }

    setUploading(true);
    setError('');
    setStatus('Uploading receipt and creating parse job...');

    try {
      const uploaded = await uploadReceipt(selectedFile);
      syncFromReceipt(uploaded);
      if (uploaded.session?.id) {
        setSessionId(uploaded.session.id);
        setReceiptId(uploaded.confirmed_receipt?.id ?? null);
        router.replace(`/receipts/upload?sessionId=${uploaded.session.id}`);
      } else if (uploaded.receipt?.id) {
        setReceiptId(uploaded.receipt.id);
        setSessionId(null);
        router.replace(`/receipts/upload?receiptId=${uploaded.receipt.id}`);
      }
    } catch (err) {
      if (err instanceof MissingAuthSessionError) {
        router.replace('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleParse(force = false) {
    if (!receiptId && !sessionId) {
      return;
    }
    setIsSubmittingParse(true);
    setStatus(force ? 'Requeueing parser run...' : 'Queueing parser run...');
    setError('');
    try {
      const payload = sessionId ? await parseReceiptSession(sessionId, { force }) : await parseReceipt(receiptId as string, { force });
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
        setTransactionDate(buildDateTimeInput(parsedFields.transaction_date ? String(parsedFields.transaction_date) : null));
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
    if (!receiptId && !sessionId) {
      return;
    }

    try {
      const save = sessionId ? saveReceiptSessionFeedback : saveReceiptFeedback;
      const updated = await save((sessionId ?? receiptId) as string, {
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
    if (!receiptId && !sessionId) {
      return;
    }
    setStatus('Confirming receipt...');
    setError('');

    try {
      const confirm = sessionId ? confirmReceiptSession : confirmReceipt;
      const updated = await confirm((sessionId ?? receiptId) as string, {
        wallet_id: walletId,
        category_id: categoryId,
        type,
        amount: Number(amount),
        description,
        merchant_name: merchantName || undefined,
        transaction_date: transactionDate ? new Date(transactionDate).toISOString() : new Date().toISOString(),
      });
      syncFromReceipt(updated);
      if (updated.confirmed_receipt?.id) {
        setReceiptId(updated.confirmed_receipt.id);
      }
      setStatus(updated.finance_warning ?? 'Receipt confirmed and transaction created');
    } catch (err) {
      if (err instanceof MissingAuthSessionError) {
        router.replace('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Unable to confirm receipt');
    }
  }

  const extractionDetails = getExtractionDetails(receipt);
  const extractedFields = extractionDetails?.fields;
  const needsReview = extractionDetails?.needs_review_fields ?? [];
  const fieldConfidence = extractionDetails?.field_confidence ?? {};
  const reviewReady = Boolean(receipt?.extraction_result);
  const processing = isProcessing(receipt);
  const qualityHints = useMemo(() => getImageHints(selectedFile, imageSize), [selectedFile, imageSize]);

  function fieldStyle(fieldName: string) {
    if (needsReview.includes(fieldName)) {
      return 'border-amber-300 bg-amber-50/40 focus:border-amber-500';
    }
    return 'border-neutral-200 bg-white focus:border-accent';
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-black/10 bg-white/85 px-6 py-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">Receipt Workspace</p>
        <h2 className="mt-1 text-2xl font-semibold text-ink">Upload, OCR review, and confirmation in one guided flow</h2>
        <p className="mt-2 text-sm text-neutral-600">{status}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="rounded-[1.75rem] border border-black/10 bg-white/90 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">Step 1</p>
          <h3 className="mt-1 text-xl font-semibold text-ink">Receipt Image</h3>
          <p className="mt-1 text-sm text-neutral-600">Upload once, verify quality, and continue without leaving this page.</p>

          <form className="mt-4 space-y-4" onSubmit={handleUpload}>
            <label
              onDrop={onDrop}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              className={`block cursor-pointer rounded-3xl border border-dashed p-6 text-center transition ${
                dragActive ? 'border-accent bg-accent/5' : 'border-neutral-300 bg-neutral-50'
              }`}
            >
              <p className="text-base font-semibold text-ink">Drag and drop receipt image here</p>
              <p className="mt-1 text-sm text-neutral-600">or click to select JPG/PNG/WEBP</p>
              <input className="mt-4 block w-full text-sm" type="file" accept="image/*" onChange={onFileInputChange} />
            </label>

            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-3">
              {previewUrl ? (
                <div className="relative h-[26rem] overflow-hidden rounded-2xl bg-white">
                  <img src={previewUrl} alt="Receipt preview" className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="flex h-[26rem] items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white text-sm text-neutral-500">
                  Image preview will appear here immediately after selection.
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-semibold text-neutral-700">Quality checklist</p>
              <ul className="mt-2 space-y-2 text-sm text-neutral-700">
                {qualityHints.map((hint) => (
                  <li key={hint.label} className={hint.state === 'warn' ? 'text-amber-700' : ''}>
                    {hint.state === 'warn' ? '!' : 'OK'} {hint.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                disabled={!selectedFile || uploading}
              >
                {uploading ? 'Uploading...' : receipt ? 'Upload as new receipt' : 'Upload receipt'}
              </button>
              <button
                type="button"
                className="rounded-full border border-ink px-5 py-3 text-sm font-semibold text-ink disabled:opacity-60"
                onClick={() => void handleParse(currentStatusSource(receipt) === 'failed' || currentStatusSource(receipt) === 'ready_for_review')}
                disabled={(!receiptId && !sessionId) || processing || isSubmittingParse}
              >
                {processing ? 'Parse running...' : receipt?.active_job?.status === 'failed' ? 'Retry parse' : 'Re-parse'}
              </button>
            </div>
          </form>
        </section>

        <form onSubmit={handleConfirm} className="rounded-[1.75rem] border border-black/10 bg-white/90 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">Step 3</p>
          <h3 className="mt-1 text-xl font-semibold text-ink">Structured Fields</h3>
          <p className="mt-1 text-sm text-neutral-600">Main business panel. Review extracted fields, fix uncertain values, then confirm.</p>

          {!reviewReady ? (
            <p className="mt-4 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
              Parsed fields appear after background OCR completes. Keep this page open while it auto-refreshes.
            </p>
          ) : null}

          {reviewReady && needsReview.length > 0 ? (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Low-confidence fields: {needsReview.join(', ')}
            </p>
          ) : null}

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Merchant name</span>
              <input
                className={`w-full rounded-2xl border px-4 py-3 outline-none disabled:bg-neutral-100 ${fieldStyle('merchant_name')}`}
                value={merchantName}
                onChange={(event) => setMerchantName(event.target.value)}
                disabled={!reviewReady}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Amount</span>
              <input
                className={`w-full rounded-2xl border px-4 py-3 outline-none disabled:bg-neutral-100 ${fieldStyle('total_amount')}`}
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
                className={`w-full rounded-2xl border px-4 py-3 outline-none disabled:bg-neutral-100 ${fieldStyle('transaction_date')}`}
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

          {reviewReady && (fieldConfidence.merchant_name !== undefined || fieldConfidence.total_amount !== undefined || fieldConfidence.transaction_date !== undefined) ? (
            <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
              <p className="font-medium text-neutral-900">Confidence</p>
              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                <p>Merchant: {fieldConfidence.merchant_name ?? 'n/a'}</p>
                <p>Date: {fieldConfidence.transaction_date ?? 'n/a'}</p>
                <p>Total: {fieldConfidence.total_amount ?? 'n/a'}</p>
                <p>Payment: {fieldConfidence.payment_method ?? 'n/a'}</p>
              </div>
            </div>
          ) : null}

          {reviewReady && (extractedFields?.merchant_phone || extractedFields?.merchant_address || extractedFields?.receipt_number) ? (
            <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
              <p className="font-medium text-neutral-900">Detected metadata</p>
              {extractedFields?.receipt_number ? <p className="mt-1">Receipt #: {extractedFields.receipt_number}</p> : null}
              {extractedFields?.merchant_phone ? <p className="mt-1">Phone: {extractedFields.merchant_phone}</p> : null}
              {extractedFields?.merchant_address ? <p className="mt-1">Address: {extractedFields.merchant_address}</p> : null}
            </div>
          ) : null}

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-medium">Description</span>
            <textarea
              className="min-h-24 w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent disabled:bg-neutral-100"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={!reviewReady}
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-medium">Reviewer note</span>
            <textarea
              className="min-h-24 w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-accent disabled:bg-neutral-100"
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              disabled={!reviewReady}
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleFeedback}
              className="rounded-full border border-accent px-5 py-3 text-sm font-semibold text-accent disabled:opacity-60"
              disabled={!reviewReady}
            >
              Save feedback
            </button>
            <button
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              type="submit"
              disabled={!reviewReady || !amount || !transactionDate}
            >
              Confirm receipt
            </button>
          </div>
        </form>
      </div>

      {SHOW_OCR_TEXT_PANEL ? (
        <ReceiptOcrTextPanel
          receipt={receipt}
          ocrDebug={receipt?.ocr_debug ?? null}
          isProcessing={processing}
          onRetryParse={() => void handleParse(true)}
          retryDisabled={isSubmittingParse || processing || (!receiptId && !sessionId)}
        />
      ) : null}

      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
