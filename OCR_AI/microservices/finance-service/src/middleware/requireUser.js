import { badRequest } from "../lib/http.js";

export function requireUser(request, response, next) {
  const userId = request.headers["x-user-id"];

  if (typeof userId !== "string" || !userId.trim()) {
    badRequest(response, "MISSING_USER_ID", "x-user-id header is required.");
    return;
  }

  request.userId = userId.trim();
  next();
}
