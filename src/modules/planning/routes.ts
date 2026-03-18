import type { Express } from "express";
import { z } from "zod";
import { listConcurrencyProfiles } from "../concurrency/store";
import { listMiddlewareInstances } from "../middleware/store";

const planSchema = z.object({
  environmentId: z.string().min(1),
  targetProfileId: z.string().min(1),
  middlewareIds: z.array(z.string().min(1)),
});

export function registerPlanningRoutes(app: Express) {
  app.post("/api/scale-plans", (req, res) => {
    const parsed = planSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { targetProfileId, middlewareIds } = parsed.data;
    const profiles = listConcurrencyProfiles();
    const profile = profiles.find((p) => p.id === targetProfileId);
    if (!profile) {
      return res.status(400).json({ error: "Concurrency profile not found" });
    }

    const allInstances = listMiddlewareInstances();
    const selected = allInstances.filter((m) => middlewareIds.includes(m.id));

    if (selected.length === 0) {
      return res
        .status(400)
        .json({ error: "No valid middleware instances selected" });
    }

    // 简化版容量评估与参数建议示例：根据并发档位给出基础建议
    const riskLevel =
      profile.level === "fifty_million" || profile.level === "hundred_million"
        ? "high"
        : "medium";

    const nginxSuggestions = selected
      .filter((m) => m.type === "nginx" || m.type === "gateway")
      .map((m) => ({
        instanceId: m.id,
        instanceName: m.name,
        params: [
          {
            key: "worker_processes",
            originalValue: "1",
            suggestedValue: "auto",
            description:
              "根据 CPU 核数自动设置 worker 数量，适用于大多数场景。",
          },
          {
            key: "worker_connections",
            originalValue: 4096,
            suggestedValue:
              profile.level === "million"
                ? 10240
                : profile.level === "ten_million"
                ? 20480
                : 65535,
            description:
              "提升单 worker 支持的最大连接数，以支撑更高并发。",
          },
          {
            key: "keepalive_timeout",
            originalValue: 75,
            suggestedValue:
              profile.level === "hundred_million" ? 30 : 60,
            description:
              "高并发场景适当缩短长连接保持时间，降低连接占用。",
          },
        ],
      }));

    const redisSuggestions = selected
      .filter((m) => m.type === "redis" || m.type === "cache")
      .map((m) => ({
        instanceId: m.id,
        instanceName: m.name,
        params: [
          {
            key: "maxclients",
            originalValue: 10000,
            suggestedValue:
              profile.level === "million"
                ? 10000
                : profile.level === "ten_million"
                ? 20000
                : 50000,
            description:
              "提高最大客户端连接数，避免在高并发下因连接数不足报错。",
          },
          {
            key: "timeout",
            originalValue: 300,
            suggestedValue: 0,
            description:
              "设置为 0 以避免长时间空闲连接被意外关闭，提升稳定性。",
          },
        ],
      }));

    const mqSuggestions = selected
      .filter((m) => m.type === "kafka" || m.type === "mq")
      .map((m) => ({
        instanceId: m.id,
        instanceName: m.name,
        params: [
          {
            key: "num.network.threads",
            originalValue: 3,
            suggestedValue: 3,
            description:
              "网络线程保持默认即可，应对绝大多数场景。",
          },
          {
            key: "num.io.threads",
            originalValue: 8,
            suggestedValue:
              profile.level === "million"
                ? 8
                : profile.level === "ten_million"
                ? 16
                : 32,
            description:
              "根据并发层级增加 IO 线程数，提升消息吞吐能力。",
          },
        ],
      }));

    const summary = {
      targetProfile: profile,
      middlewareCount: selected.length,
      riskLevel,
      suggestions: {
        nginxLike: nginxSuggestions,
        redisLike: redisSuggestions,
        mqLike: mqSuggestions,
      },
      message:
        "当前为基于并发档位的经验型建议，后续可接入真实资源数据与压测结果做精准容量评估。",
    };

    res.json(summary);
  });
}

