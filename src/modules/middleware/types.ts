export type MiddlewareType =
  | "nginx"
  | "gateway"
  | "redis"
  | "kafka"
  | "mq"
  | "database"
  | "cache"
  | "search"
  | "task"
  | "observability";

export interface MiddlewareInstance {
  id: string;
  name: string;
  type: MiddlewareType;
  environmentId: string;
  node: string;
  version?: string;
  status: "running" | "stopped" | "error";
}

