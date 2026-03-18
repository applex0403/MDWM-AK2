import express from "express";
import cors from "cors";
import morgan from "morgan";

import { registerEnvironmentRoutes } from "./modules/environments/routes";
import { registerMiddlewareRoutes } from "./modules/middleware/routes";
import { registerConcurrencyProfileRoutes } from "./modules/concurrency/routes";
import { registerPlanningRoutes } from "./modules/planning/routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "mump-backend" });
});

registerEnvironmentRoutes(app);
registerMiddlewareRoutes(app);
registerConcurrencyProfileRoutes(app);
registerPlanningRoutes(app);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`MUMP backend listening on port ${PORT}`);
});

