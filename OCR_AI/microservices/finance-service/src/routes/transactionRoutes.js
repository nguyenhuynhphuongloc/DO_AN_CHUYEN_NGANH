import { Router } from "express";

export function createTransactionRoutes(controller) {
  const router = Router();

  router.get("/", controller.list);
  router.post("/", controller.create);
  router.post("/confirmed-ocr", controller.createConfirmedOcr);

  return router;
}
