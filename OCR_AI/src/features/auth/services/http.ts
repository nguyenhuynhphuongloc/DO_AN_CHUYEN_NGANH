import type { ApiError, OcrErrorResponse } from "../../../types/ocr";

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

export async function requestJson<T>(
  input: string,
  init?: RequestInit & { fetchImpl?: typeof fetch }
): Promise<T> {
  const response = await (init?.fetchImpl ?? fetch)(input, init);
  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    const parsedPayload =
      payload && typeof payload === "object" ? (payload as Partial<OcrErrorResponse>) : {};

    const error: ApiError = {
      status: response.status,
      error_code: parsedPayload.error_code ?? "REQUEST_FAILED",
      message: parsedPayload.message ?? response.statusText ?? FALLBACK_ERROR_MESSAGE,
      ...(parsedPayload.details ? { details: parsedPayload.details } : {})
    };

    throw error;
  }

  return payload as T;
}
