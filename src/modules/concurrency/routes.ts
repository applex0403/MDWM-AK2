import type { Express } from "express";
import { z } from "zod";
import {
  createConcurrencyProfile,
  listConcurrencyProfiles,
  seedDefaultProfiles,
} from "./store";

const createProfileSchema = z.object({
  name: z.string().min(1),
  level: z.enum(["million", "ten_million", "fifty_million", "hundred_million"]),
  minTps: z.number().int().positive(),
  maxTps: z.number().int().positive(),
  description: z.string().optional(),
});

export function registerConcurrencyProfileRoutes(app: Express) {
  seedDefaultProfiles();

  app.get("/api/concurrency-profiles", (_req, res) => {
    res.json(listConcurrencyProfiles());
  });

  app.post("/api/concurrency-profiles", (req, res) => {
    const parsed = createProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const profile = createConcurrencyProfile(parsed.data);
    res.status(201).json(profile);
  });
}

