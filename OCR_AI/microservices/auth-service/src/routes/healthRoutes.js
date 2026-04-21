import { Router } from "express";

export function createHealthRoutes() {
  const router = Router();

  router.get("/", (_request, response) => {
    response.status(200).json({
      service: "auth-service",
      status: "ok"
    });
  });

  return router;
}
