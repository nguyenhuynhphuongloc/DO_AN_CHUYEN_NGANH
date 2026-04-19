'use client';

import { useEffect, useState } from 'react';

import { getReceiptArtifactBlob } from '@/lib/api';
import { ReceiptOcrDebug, ReceiptWorkflow } from '@/lib/types';

type ReceiptOcrTextPanelProps = {
  receipt: ReceiptWorkflow | null;
  ocrDebug: ReceiptOcrDebug | null;
  isProcessing: boolean;
  onRetryParse: () => void;
  retryDisabled: boolean;
};

export function ReceiptOcrTextPanel({ receipt, ocrDebug, isProcessing, onRetryParse, retryDisabled }: ReceiptOcrTextPanelProps) {
  const failed = receipt?.active_job?.status === 'failed';
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [layoutPreviewUrl, setLayoutPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [textDownloadUrl, setTextDownloadUrl] = useState<string | null>(null);
  const layout = ocrDebug?.layout ?? null;
  const layoutBlocks = Array.isArray(layout?.blocks) ? layout.blocks : [];

  useEffect(() => {
    let revokedImageUrl: string | null = null;
    let revokedLayoutUrl: string | null = null;
    let revokedTextUrl: string | null = null;
    let cancelled = false;

    async function loadArtifacts() {
      setImageError(null);
      setImagePreviewUrl(null);
      setLayoutPreviewUrl(null);
      setTextDownloadUrl(null);

      if (!ocrDebug?.boxed_image_url && !ocrDebug?.layout_image_url && !ocrDebug?.text_file_url) {
        return;
      }

      try {
        if (ocrDebug.boxed_image_url) {
          const imageBlob = await getReceiptArtifactBlob(ocrDebug.boxed_image_url);
          if (!cancelled) {
            revokedImageUrl = URL.createObjectURL(imageBlob);
            setImagePreviewUrl(revokedImageUrl);
          }
        }

        if (ocrDebug.layout_image_url) {
          const layoutBlob = await getReceiptArtifactBlob(ocrDebug.layout_image_url);
          if (!cancelled) {
            revokedLayoutUrl = URL.createObjectURL(layoutBlob);
            setLayoutPreviewUrl(revokedLayoutUrl);
          }
        }

        if (ocrDebug?.text_file_url) {
          const textBlob = await getReceiptArtifactBlob(ocrDebug.text_file_url);
          if (!cancelled) {
            revokedTextUrl = URL.createObjectURL(textBlob);
            setTextDownloadUrl(revokedTextUrl);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setImageError(error instanceof Error ? error.message : 'Unable to load OCR artifacts.');
        }
      }
    }

    void loadArtifacts();
    return () => {
      cancelled = true;
      if (revokedImageUrl) URL.revokeObjectURL(revokedImageUrl);
      if (revokedLayoutUrl) URL.revokeObjectURL(revokedLayoutUrl);
      if (revokedTextUrl) URL.revokeObjectURL(revokedTextUrl);
    };
  }, [ocrDebug?.boxed_image_url, ocrDebug?.layout_image_url, ocrDebug?.text_file_url]);

  return (
    <section className="rounded-[1.75rem] border border-black/10 bg-white/80 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">Step 2</p>
          <h3 className="mt-1 text-xl font-semibold text-ink">OCR Output</h3>
          <p className="mt-1 text-sm text-neutral-600">Kiểm tra layout, bounding box OCR, và tải file văn bản OCR.</p>
        </div>
        <div className="text-right text-xs text-neutral-500">
          <p>Provider: {ocrDebug?.provider ?? 'Pending'}</p>
          <p>Device: {ocrDebug?.device ?? 'Pending'}</p>
          <p>Boxes: {ocrDebug?.detected_box_count ?? 0}</p>
          <p>Lines: {ocrDebug?.line_count ?? 0}</p>
          <p>Layout used: {String(layout?.used ?? false)}</p>
        </div>
      </div>

      {isProcessing && !ocrDebug?.boxed_image_url && !ocrDebug?.layout_image_url && !ocrDebug?.text_file_url ? (
        <div className="mt-4 rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-sm text-neutral-600">Đang tạo đầu ra OCR...</p>
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-neutral-200" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-neutral-200" />
          </div>
        </div>
      ) : null}

      {!isProcessing && !failed && !ocrDebug?.boxed_image_url && !ocrDebug?.layout_image_url && !ocrDebug?.text_file_url ? (
        <p className="mt-4 rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-5 text-sm text-neutral-600">
          Đầu ra OCR sẽ xuất hiện ở đây sau khi parse hoàn tất.
        </p>
      ) : null}

      {failed ? (
        <div className="mt-4 rounded-3xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{receipt?.active_job?.error_message ?? 'OCR parsing failed.'}</p>
          <button
            type="button"
            className="mt-3 rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-700 disabled:opacity-60"
            onClick={onRetryParse}
            disabled={retryDisabled}
          >
            Retry OCR
          </button>
        </div>
      ) : null}

      {imageError ? (
        <p className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{imageError}</p>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <div className="space-y-4">
          {layoutPreviewUrl ? (
            <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-50">
              <div className="border-b border-neutral-200 px-4 py-3">
                <p className="text-sm font-semibold text-neutral-900">Layout Detection Preview</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Box lớn phải chia hợp lý thành header, items, totals, footer. Nếu box chồng chéo hoặc sai vùng, layout chưa ổn.
                </p>
              </div>
              <img src={layoutPreviewUrl} alt="Layout detection preview" className="h-auto w-full object-contain" />
            </div>
          ) : null}

          {imagePreviewUrl ? (
            <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-50">
              <div className="border-b border-neutral-200 px-4 py-3">
                <p className="text-sm font-semibold text-neutral-900">OCR Bounding Boxes</p>
                <p className="mt-1 text-xs text-neutral-500">Dùng ảnh này để xem OCR text line có bỏ sót hoặc bắt dính nhau không.</p>
              </div>
              <img src={imagePreviewUrl} alt="OCR bounding boxes" className="h-auto w-full object-contain" />
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-4">
            <p className="text-sm font-semibold text-neutral-900">Cách tự đánh giá layout đúng</p>
            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              <li>Header phải ôm phần tên cửa hàng, địa chỉ, ngày giờ đầu biên lai.</li>
              <li>Items phải nằm ở vùng thân giữa, chứa danh sách món hoặc dòng hàng.</li>
              <li>Totals phải bắt được vùng gần cuối có tổng tiền, VAT, thanh toán.</li>
              <li>Thứ tự block nên đi từ trên xuống dưới, không nhảy lung tung.</li>
              <li>Nếu toàn bộ block bị dồn thành `metadata` hoặc quá ít block, layout chưa đáng tin.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-4">
            <p className="text-sm font-semibold text-neutral-900">Layout Status</p>
            <div className="mt-3 space-y-1 text-sm text-neutral-700">
              <p>Enabled: {String(layout?.enabled ?? false)}</p>
              <p>Used: {String(layout?.used ?? false)}</p>
              <p>Fallback: {String(layout?.fallback_reason ?? 'none')}</p>
              <p>Raw detections: {String(layout?.raw_detections_count ?? 0)}</p>
              <p>Final blocks: {String(layout?.postprocessed_block_count ?? 0)}</p>
            </div>
          </div>

          {layoutBlocks.length > 0 ? (
            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-4">
              <p className="text-sm font-semibold text-neutral-900">Reading Order</p>
              <ol className="mt-3 space-y-3 text-sm text-neutral-700">
                {layoutBlocks.map((block, index) => {
                  const entry = block as Record<string, unknown>;
                  const bbox = Array.isArray(entry.bbox) ? entry.bbox.join(', ') : 'n/a';
                  return (
                    <li key={`${entry.index ?? index}-${entry.label ?? 'block'}`} className="rounded-2xl border border-white bg-white px-3 py-3">
                      <p className="font-semibold text-neutral-900">
                        {index + 1}. {String(entry.label ?? 'unknown')}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">raw: {String(entry.raw_label ?? 'n/a')}</p>
                      <p className="mt-1 text-xs text-neutral-500">bbox: {bbox}</p>
                      <p className="mt-1 text-xs text-neutral-500">confidence: {String(entry.confidence ?? 'n/a')}</p>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : null}
        </div>
      </div>

      {textDownloadUrl ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3">
          <a
            href={textDownloadUrl}
            download={`${receipt?.receipt?.file_name ?? receipt?.session?.file_name ?? 'receipt'}-ocr.txt`}
            className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700"
          >
            Download OCR TXT
          </a>
          <span className="text-xs text-neutral-500">Văn bản OCR đã được lưu thành file `.txt`.</span>
        </div>
      ) : null}
    </section>
  );
}
