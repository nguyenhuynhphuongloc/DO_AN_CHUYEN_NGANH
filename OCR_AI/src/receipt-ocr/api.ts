import type {
  ApiError,
  ConfirmedOcrTransactionRequest,
  ConfirmedOcrTransactionResponse,
  OcrErrorResponse,
  OcrSuccessResponse
} from "./types";

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
  options?: {
    headers?: Record<string, string>;
    fetchImpl?: typeof fetch;
  }
): Promise<OcrSuccessResponse> {
  const formData = new FormData();
  formData.append("receipt", file);

  const response = await (options?.fetchImpl ?? fetch)(endpoint, {
    method: "POST",
    body: formData,
    headers: options?.headers
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw buildApiError(response, payload);
  }

  return payload as OcrSuccessResponse;
}

export async function saveConfirmedOcrTransaction(
  endpoint: string,
  body: ConfirmedOcrTransactionRequest,
  options?: {
    headers?: Record<string, string>;
    fetchImpl?: typeof fetch;
  }
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
