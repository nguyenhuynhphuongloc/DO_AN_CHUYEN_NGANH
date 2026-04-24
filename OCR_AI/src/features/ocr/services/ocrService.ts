import type {
  ApiError,
  ConfirmedOcrTransactionRequest,
  ConfirmedOcrTransactionResponse,
  OcrEndpointSuccessResponse,
  OcrErrorResponse,
  OcrSuccessResponse
} from "../../../types/ocr";

const FALLBACK_ERROR_MESSAGE = "Something went wrong. Please try again.";

async function parseJsonSafely(response: Response): Promise<unknown | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function buildApiError(response: Response, payload: unknown): ApiError {
  const parsedPayload =
    payload && typeof payload === "object" ? (payload as Partial<OcrErrorResponse>) : {};

  return {
    status: response.status,
    error_code: parsedPayload.error_code ?? "REQUEST_FAILED",
    message: parsedPayload.message ?? response.statusText ?? FALLBACK_ERROR_MESSAGE
  };
}

export async function uploadReceiptForOcr(
  endpoint: string,
  file: File,
  options?: { headers?: Record<string, string>; fetchImpl?: typeof fetch; categoriesJson?: string }
): Promise<OcrSuccessResponse> {
  const formData = new FormData();
  formData.append("receipt", file);
  if (options?.categoriesJson) {
    formData.append("categories_json", options.categoriesJson);
  }

  const response = await (options?.fetchImpl ?? fetch)(endpoint, {
    method: "POST",
    body: formData,
    headers: options?.headers
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw buildApiError(response, payload);
  }

  if (!payload || typeof payload !== "object") {
    throw {
      status: response.status,
      error_code: "INVALID_RESPONSE",
      message: "OCR endpoint returned an empty or non-JSON response."
    } satisfies ApiError;
  }

  const parsedPayload = payload as Partial<OcrEndpointSuccessResponse>;

  if (parsedPayload.mode === "ocr_form" && parsedPayload.receipt_data) {
    return parsedPayload.receipt_data;
  }

  if (parsedPayload.mode === "chatbot_ocr" && parsedPayload.ocr_data) {
    return parsedPayload.ocr_data;
  }

  throw {
    status: response.status,
    error_code: "INVALID_RESPONSE",
    message: "OCR endpoint returned an unexpected response shape."
  } satisfies ApiError;
}

export async function saveConfirmedOcrTransaction(
  endpoint: string,
  body: ConfirmedOcrTransactionRequest,
  options?: { headers?: Record<string, string>; fetchImpl?: typeof fetch }
): Promise<ConfirmedOcrTransactionResponse> {
  const response = await (options?.fetchImpl ?? fetch)(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...options?.headers
    },
    body: JSON.stringify(body)
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw buildApiError(response, payload);
  }

  return payload as ConfirmedOcrTransactionResponse;
}
