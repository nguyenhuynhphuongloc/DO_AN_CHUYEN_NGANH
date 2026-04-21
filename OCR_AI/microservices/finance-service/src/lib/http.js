export function json(response, status, payload) {
  response.status(status).json(payload);
}

export function badRequest(response, errorCode, message, details) {
  json(response, 400, {
    error_code: errorCode,
    message,
    ...(details ? { details } : {})
  });
}

export function serverError(response, message = "Internal server error.") {
  json(response, 500, {
    error_code: "INTERNAL_ERROR",
    message
  });
}
