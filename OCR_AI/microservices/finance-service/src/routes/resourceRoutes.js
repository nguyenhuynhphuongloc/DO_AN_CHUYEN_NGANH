import { Router } from "express";

export function createResourceRoutes(controller) {
  const router = Router();

  router.get("/", controller.list);
  router.post("/", controller.create);
  router.put("/:id", controller.update);

  return router;
}
