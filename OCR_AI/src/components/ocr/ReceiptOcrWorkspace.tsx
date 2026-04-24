import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { mockOcrReviewResult } from "../../mocks/ocr";
import type { CategoryOption, WalletOption } from "../../types/finance";
import type { ApiError, ReceiptReviewFormData } from "../../types/ocr";
import { InlineMessage } from "../shared/InlineMessage";
import { OcrProcessingState } from "./OcrProcessingState";
import { OcrResultForm } from "./OcrResultForm";
import { OcrReviewPanel } from "./OcrReviewPanel";
import { ReceiptPreview } from "./ReceiptPreview";
import { ReceiptUploadBox } from "./ReceiptUploadBox";
import { saveConfirmedOcrTransaction, uploadReceiptForOcr } from "../../features/ocr/services/ocrService";

function createEmptyFormData(walletId = ""): ReceiptReviewFormData {
  return {
    total_amount: 0,
    tax_amount: null,
    currency: "USD",
    transaction_datetime: "",
    merchant_name: "",
    payment_method: null,
    ai_suggested_category: "",
    ai_suggested_category_id: null,
    warnings: [],
    needs_review: false,
    wallet_id: walletId,
    final_category: "",
    notes: "",
    line_items: []
  };
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as ApiError).message);
  }

  return "Request failed. Please try again.";
}

export function ReceiptOcrWorkspace({
  ocrEndpoint,
  saveEndpoint,
  walletOptions,
  categoryOptions,
  defaultWalletId,
  ocrRequestHeaders,
  saveRequestHeaders,
  workspaceLabel = "OCR Receipts",
  fetchImpl,
  demoFallbackOnOcrError = true,
  onSaveSuccess
}: {
  ocrEndpoint: string;
  saveEndpoint: string;
  walletOptions: WalletOption[];
  categoryOptions: CategoryOption[];
  defaultWalletId: string;
  ocrRequestHeaders?: Record<string, string>;
  saveRequestHeaders?: Record<string, string>;
  workspaceLabel?: string;
  fetchImpl?: typeof fetch;
  demoFallbackOnOcrError?: boolean;
  onSaveSuccess?: (message: string) => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<ReceiptReviewFormData>(() => createEmptyFormData(defaultWalletId));
  const [ocrError, setOcrError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData((current) => ({ ...current, wallet_id: current.wallet_id || defaultWalletId }));
  }, [defaultWalletId]);

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

    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [selectedFile]);

  const resolvedCategories = useMemo(() => {
    if (!formData.ai_suggested_category) {
      return categoryOptions;
    }

    const exists = categoryOptions.some((category) => category.name === formData.ai_suggested_category);
    return exists
      ? categoryOptions
      : [{ id: "suggested", name: formData.ai_suggested_category, category_type: "expense" }, ...categoryOptions];
  }, [categoryOptions, formData.ai_suggested_category]);

  const categoriesJson = useMemo(() => {
    if (!categoryOptions.length) {
      return undefined;
    }

    return JSON.stringify(
      categoryOptions.map((category) => ({
        id: category.id,
        name: category.name,
        aliases: []
      }))
    );
  }, [categoryOptions]);

  function updateField<K extends keyof ReceiptReviewFormData>(field: K, value: ReceiptReviewFormData[K]) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setOcrError("");
    setSaveError("");
    setSaveSuccess("");
  }

  async function handleRunOcr(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setOcrError("Please choose a receipt image before starting OCR.");
      return;
    }

    setIsUploading(true);
    setOcrError("");

    try {
      const result = await uploadReceiptForOcr(ocrEndpoint, selectedFile, {
        headers: ocrRequestHeaders,
        fetchImpl,
        categoriesJson
      });
      setFormData({
        ...createEmptyFormData(defaultWalletId),
        ...result,
        merchant_name: result.merchant_name ?? "",
        transaction_datetime: result.transaction_datetime ?? "",
        payment_method: result.payment_method ?? "",
        ai_suggested_category: result.ai_suggested_category ?? "",
        tax_amount: result.tax_amount ?? null,
        wallet_id: defaultWalletId,
        final_category: result.ai_suggested_category || ""
      });
    } catch (error) {
      setOcrError(
        demoFallbackOnOcrError
          ? `${getErrorMessage(error)} Loaded demo extraction so the review flow stays usable.`
          : getErrorMessage(error)
      );
      if (demoFallbackOnOcrError) {
        setFormData({
          ...mockOcrReviewResult,
          wallet_id: defaultWalletId || mockOcrReviewResult.wallet_id
        });
      }
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.wallet_id || !formData.final_category) {
      setSaveError("Wallet and final category are required before saving.");
      return;
    }

    setIsSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const response = await saveConfirmedOcrTransaction(
        saveEndpoint,
        {
          total_amount: formData.total_amount,
          currency: formData.currency,
          transaction_datetime: formData.transaction_datetime ?? "",
          merchant_name: formData.merchant_name ?? "",
          payment_method: formData.payment_method ?? "",
          ai_suggested_category: formData.ai_suggested_category ?? "",
          wallet_id: formData.wallet_id,
          final_category: formData.final_category,
          notes: formData.notes,
          original_suggested_category: formData.ai_suggested_category ?? ""
        },
        { headers: saveRequestHeaders, fetchImpl }
      );
      setSaveSuccess(response.message);
      onSaveSuccess?.(response.message);
    } catch (error) {
      setSaveError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="ocr-workspace">
      <div className="ocr-workspace__top">
        <div>
          <div className="section-header__eyebrow">{workspaceLabel}</div>
          <h2>Receipt scanning workflow</h2>
          <p>Upload, preview, scan, review, edit, and confirm receipt data into finance records.</p>
          <p className="ocr-workspace__endpoint">
            OCR request target: <code>{ocrEndpoint}</code>
          </p>
        </div>
        <OcrProcessingState isProcessing={isUploading} />
      </div>

      <div className="ocr-workspace__grid">
        <form className="panel-card ocr-stack" onSubmit={handleRunOcr}>
          <ReceiptUploadBox
            onBrowse={() => fileInputRef.current?.click()}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            selectedFileName={selectedFile?.name}
          />
          <ReceiptPreview previewUrl={previewUrl} />
          <button className="button button--primary button--block" type="submit" disabled={isUploading}>
            {isUploading ? "Running OCR..." : "Run OCR via n8n"}
          </button>
          {ocrError ? <InlineMessage tone="error">{ocrError}</InlineMessage> : null}
        </form>

        <form className="panel-card ocr-stack" onSubmit={handleSave}>
          <OcrReviewPanel formData={formData} />
          <OcrResultForm
            formData={formData}
            wallets={walletOptions}
            categories={resolvedCategories}
            onChange={updateField}
          />
          {saveError ? <InlineMessage tone="error">{saveError}</InlineMessage> : null}
          {saveSuccess ? <InlineMessage tone="success">{saveSuccess}</InlineMessage> : null}
          <button className="button button--accent button--block" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save transaction"}
          </button>
        </form>
      </div>
    </div>
  );
}
