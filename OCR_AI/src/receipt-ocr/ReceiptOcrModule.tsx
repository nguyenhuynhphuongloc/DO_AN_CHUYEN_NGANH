import type { ReactNode } from "react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_CATEGORY_OPTIONS, DEFAULT_UPLOAD_LABEL } from "./constants";
import { saveConfirmedOcrTransaction, uploadReceiptForOcr } from "./api";
import type {
  ApiError,
  ConfirmedOcrTransactionResponse,
  ReceiptOcrModuleProps,
  ReceiptReviewFormData
} from "./types";

function createEmptyFormData(walletId = ""): ReceiptReviewFormData {
  return {
    total_amount: 0,
    currency: "",
    transaction_datetime: "",
    merchant_name: "",
    payment_method: "",
    ai_suggested_category: "",
    wallet_id: walletId,
    final_category: "",
    notes: ""
  };
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as ApiError).message);
  }

  return "Request failed. Please try again.";
}

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase();
}

function resolveWalletId(currentWalletId: string, fallbackWalletId: string) {
  return currentWalletId || fallbackWalletId;
}

export function ReceiptOcrModule({
  ocrEndpoint,
  saveEndpoint,
  walletOptions,
  defaultWalletId,
  categoryOptions = DEFAULT_CATEGORY_OPTIONS,
  className,
  ocrRequestHeaders,
  saveRequestHeaders,
  fetchImpl,
  onSaveSuccess
}: ReceiptOcrModuleProps) {
  const fallbackWalletId = defaultWalletId ?? walletOptions[0]?.id ?? "";
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<ReceiptReviewFormData>(() =>
    createEmptyFormData(fallbackWalletId)
  );
  const [ocrError, setOcrError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      wallet_id: resolveWalletId(current.wallet_id, fallbackWalletId)
    }));
  }, [fallbackWalletId]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }

        return null;
      });
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return nextPreviewUrl;
    });

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [selectedFile]);

  function updateField<K extends keyof ReceiptReviewFormData>(
    field: K,
    value: ReceiptReviewFormData[K]
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value
    }));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setOcrError("");
    setSaveError("");
    setSaveSuccess("");

    if (!file) {
      setFormData(createEmptyFormData(fallbackWalletId));
    }
  }

  async function handleOcrSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setOcrError("Please choose a receipt image before starting OCR.");
      return;
    }

    setIsUploading(true);
    setOcrError("");
    setSaveError("");
    setSaveSuccess("");

    try {
      const response = await uploadReceiptForOcr(ocrEndpoint, selectedFile, {
        headers: ocrRequestHeaders,
        fetchImpl
      });
      const matchedCategory =
        categoryOptions.find(
          (option) => normalizeText(option) === normalizeText(response.ai_suggested_category)
        ) ?? response.ai_suggested_category;

      setFormData({
        ...response,
        wallet_id: resolveWalletId(formData.wallet_id, fallbackWalletId),
        final_category: matchedCategory,
        notes: ""
      });
    } catch (error) {
      setFormData(createEmptyFormData(fallbackWalletId));
      setOcrError(getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSaveSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.wallet_id) {
      setSaveError("Please choose a wallet before saving.");
      return;
    }

    if (!formData.final_category) {
      setSaveError("Please choose a final category before saving.");
      return;
    }

    setSaveError("");
    setSaveSuccess("");
    setIsSaving(true);

    try {
      const response = await saveConfirmedOcrTransaction(
        saveEndpoint,
        {
          ...formData,
          original_suggested_category: formData.ai_suggested_category
        },
        {
          headers: saveRequestHeaders,
          fetchImpl
        }
      );

      setSaveSuccess(response.message);
      onSaveSuccess?.(response);
    } catch (error) {
      setSaveError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  const hasOcrResult = Boolean(
    formData.currency || formData.merchant_name || formData.transaction_datetime
  );
  const resolvedCategoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [formData.ai_suggested_category, ...categoryOptions].filter(
            (option): option is string => Boolean(option)
          )
        )
      ),
    [categoryOptions, formData.ai_suggested_category]
  );
  const resolvedClassName =
    "mx-auto w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm " +
    (className ?? "");

  return (
    <div className={resolvedClassName}>
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Receipt OCR Review</h2>
        <p className="text-sm text-slate-600">
          Upload a receipt, review the extracted values, choose the destination wallet and category,
          then save the confirmed transaction.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
        <form
          className="space-y-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4"
          onSubmit={handleOcrSubmit}
        >
          <div>
            <h3 className="text-lg font-medium text-slate-900">{DEFAULT_UPLOAD_LABEL}</h3>
            <p className="mt-1 text-sm text-slate-500">
              Supported by the OCR flow through the configured `receipt` file upload field.
            </p>
          </div>

          <label
            className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500 hover:border-slate-300"
            htmlFor="receipt-upload-input"
          >
            <span className="font-medium text-slate-700">Choose a receipt image</span>
            <span className="mt-2 text-xs text-slate-500">
              PNG, JPG, or other image formats accepted by your OCR backend
            </span>
          </label>

          <input
            ref={fileInputRef}
            id="receipt-upload-input"
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            onClick={() => fileInputRef.current?.click()}
          >
            Browse file
          </button>

          {selectedFile ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-sm font-medium text-slate-700">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">{Math.round(selectedFile.size / 1024)} KB</p>
            </div>
          ) : null}

          {previewUrl ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <img
                src={previewUrl}
                alt="Selected receipt preview"
                className="h-80 w-full object-contain bg-slate-100"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-400">
              Receipt preview appears here after a file is selected.
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isUploading ? "Running OCR..." : "Run OCR"}
          </button>

          {ocrError ? <MessageBox tone="error">{ocrError}</MessageBox> : null}
        </form>

        <form
          className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
          onSubmit={handleSaveSubmit}
        >
          <div>
            <h3 className="text-lg font-medium text-slate-900">Review OCR Result</h3>
            <p className="mt-1 text-sm text-slate-500">
              The fields stay editable after OCR so users can correct extracted values before
              saving.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Total amount">
                <input
                  className={INPUT_CLASS}
                  type="number"
                  value={formData.total_amount || ""}
                  onChange={(event) =>
                    updateField(
                      "total_amount",
                      event.target.value === "" ? 0 : Number(event.target.value)
                    )
                  }
                />
              </Field>

              <Field label="Currency">
                <input
                  className={INPUT_CLASS}
                  type="text"
                  value={formData.currency}
                  onChange={(event) => updateField("currency", event.target.value)}
                />
              </Field>

              <Field label="Transaction date">
                <input
                  className={INPUT_CLASS}
                  type="text"
                  value={formData.transaction_datetime}
                  onChange={(event) => updateField("transaction_datetime", event.target.value)}
                />
              </Field>

              <Field label="Merchant name">
                <input
                  className={INPUT_CLASS}
                  type="text"
                  value={formData.merchant_name}
                  onChange={(event) => updateField("merchant_name", event.target.value)}
                />
              </Field>

              <Field label="Payment method">
                <input
                  className={INPUT_CLASS}
                  type="text"
                  value={formData.payment_method}
                  onChange={(event) => updateField("payment_method", event.target.value)}
                />
              </Field>

              <Field label="Suggested category">
                <input
                  className={INPUT_CLASS}
                  type="text"
                  value={formData.ai_suggested_category}
                  onChange={(event) => updateField("ai_suggested_category", event.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Wallet">
                <select
                  className={INPUT_CLASS}
                  value={formData.wallet_id}
                  onChange={(event) => updateField("wallet_id", event.target.value)}
                >
                  <option value="">Select a wallet</option>
                  {walletOptions.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.name} ({wallet.currency})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Category">
                <select
                  className={INPUT_CLASS}
                  value={formData.final_category}
                  onChange={(event) => updateField("final_category", event.target.value)}
                >
                  <option value="">Select a category</option>
                  {resolvedCategoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Notes">
              <textarea
                className={`${INPUT_CLASS} min-h-28 resize-y`}
                value={formData.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Add context or manual corrections"
              />
            </Field>

            {saveError ? <MessageBox tone="error">{saveError}</MessageBox> : null}

            {saveSuccess ? <MessageBox tone="success">{saveSuccess}</MessageBox> : null}

            <button
              type="submit"
              disabled={!hasOcrResult || isSaving}
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {isSaving ? "Saving..." : "Save transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const INPUT_CLASS =
  "w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

function Field(props: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-700">{props.label}</span>
      {props.children}
    </label>
  );
}

function MessageBox({
  tone,
  children
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  const toneClass =
    tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClass}`}>{children}</div>;
}
