import { unauthorized } from "../lib/http.js";

export function createAuthenticateAccessToken(tokenService) {
  return async (request, response, next) => {
    const authorization = request.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      unauthorized(response, "Missing bearer access token.");
      return;
    }

    const token = authorization.slice("Bearer ".length);

    try {
      request.auth = tokenService.verifyAccessToken(token);
      next();
    } catch {
      unauthorized(response, "Invalid or expired access token.");
    }
  };
}
