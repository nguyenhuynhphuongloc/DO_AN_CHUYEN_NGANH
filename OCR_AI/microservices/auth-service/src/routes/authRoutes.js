import { Router } from "express";

import { createAuthenticateAccessToken } from "../middleware/authenticate.js";

export function createAuthRoutes(controller, tokenService) {
  const router = Router();
  const authenticateAccessToken = createAuthenticateAccessToken(tokenService);

  router.post("/register", controller.register);
  router.post("/login", controller.login);
  router.post("/refresh", controller.refresh);
  router.get("/me", authenticateAccessToken, controller.me);

  return router;
}
