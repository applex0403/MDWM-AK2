import { Express } from "express";
import { z } from "zod";
import { createMiddlewareInstance, listMiddlewareInstances } from "./store";

const createMiddlewareSchema = z.object({
  name: z.string().min(1),
  type: z.enum([
    "nginx",
    "gateway",
    "redis",
    "kafka",
    "mq",
    "database",
    "cache",
    "search",
    "task",
    "observability",
  ]),
  environmentId: z.string().min(1),
  node: z.string().min(1),
  version: z.string().optional(),
});

export function registerMiddlewareRoutes(app: Express) {
  app.get("/api/middleware", (_req, res) => {
    res.json(listMiddlewareInstances());
  });

  app.post("/api/middleware", (req, res) => {
    const parsed = createMiddlewareSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const instance = createMiddlewareInstance(parsed.data);
    res.status(201).json(instance);
  });
}

