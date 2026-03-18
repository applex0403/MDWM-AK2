import { Express } from "express";
import { z } from "zod";
import { createEnvironment, listEnvironments, getEnvironment } from "./store";

const createEnvironmentSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["physical", "docker", "k8s"]),
  region: z.string().optional(),
  description: z.string().optional(),
});

export function registerEnvironmentRoutes(app: Express) {
  app.get("/api/environments", (_req, res) => {
    res.json(listEnvironments());
  });

  app.post("/api/environments", (req, res) => {
    const parsed = createEnvironmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const env = createEnvironment(parsed.data);
    res.status(201).json(env);
  });

  app.get("/api/environments/:id", (req, res) => {
    const env = getEnvironment(req.params.id);
    if (!env) {
      return res.status(404).json({ error: "Environment not found" });
    }
    res.json(env);
  });
}

