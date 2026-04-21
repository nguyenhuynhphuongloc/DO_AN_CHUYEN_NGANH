import express from "express";

import { createResourceController } from "./controllers/resourceControllerFactory.js";
import { createTransactionController } from "./controllers/transactionController.js";
import { requireUser } from "./middleware/requireUser.js";
import { createHealthRoutes } from "./routes/healthRoutes.js";
import { createResourceRoutes } from "./routes/resourceRoutes.js";
import { createTransactionRoutes } from "./routes/transactionRoutes.js";

export function createFinanceApp({ repository }) {
  const app = express();
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
  app.use(requireUser);

  app.use(
    "/wallets",
    createResourceRoutes(
      createResourceController({
        resourceType: "wallets",
        repository,
        requiredFields: ["name"]
      })
    )
  );
  app.use(
    "/categories",
    createResourceRoutes(
      createResourceController({
        resourceType: "categories",
        repository,
        requiredFields: ["name"]
      })
    )
  );
  app.use(
    "/budget-profiles",
    createResourceRoutes(
      createResourceController({
        resourceType: "budgetProfiles",
        repository,
        requiredFields: ["name", "base_amount", "effective_from"]
      })
    )
  );
  app.use(
    "/category-allocation-rules",
    createResourceRoutes(
      createResourceController({
        resourceType: "categoryAllocationRules",
        repository,
        requiredFields: ["budget_profile_id", "category_id", "allocation_mode", "allocation_value"]
      })
    )
  );
  app.use("/transactions", createTransactionRoutes(createTransactionController(repository)));

  app.use((_request, response) => {
    response.status(404).json({
      error_code: "NOT_FOUND",
      message: "Route not found."
    });
  });

  return app;
}
