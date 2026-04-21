import express from "express";

import { createAuthController } from "./controllers/authController.js";
import { createHealthRoutes } from "./routes/healthRoutes.js";
import { createAuthRoutes } from "./routes/authRoutes.js";

export function createAuthApp({ repository, tokenService }) {
  const app = express();
  const controller = createAuthController({ repository, tokenService });
  const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:5000";

  app.use((request, response, next) => {
    response.header("Access-Control-Allow-Origin", allowedOrigin);
    response.header("Vary", "Origin");
    response.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-user-id");
    response.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");

    if (request.method === "OPTIONS") {
      response.sendStatus(204);
      return;
    }

    next();
  });

  app.use(express.json());
  app.use("/health", createHealthRoutes());
  app.use("/auth", createAuthRoutes(controller, tokenService));
  app.use((_request, response) => {
    response.status(404).json({
      error_code: "NOT_FOUND",
      message: "Route not found."
    });
  });

  return app;
}
