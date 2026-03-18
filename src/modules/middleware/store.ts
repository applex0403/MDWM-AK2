import { randomUUID } from "crypto";
import { MiddlewareInstance } from "./types";

const instances = new Map<string, MiddlewareInstance>();

export function listMiddlewareInstances(): MiddlewareInstance[] {
  return Array.from(instances.values());
}

export function createMiddlewareInstance(
  payload: Omit<MiddlewareInstance, "id" | "status">
): MiddlewareInstance {
  const id = randomUUID();
  const instance: MiddlewareInstance = {
    id,
    status: "running",
    ...payload,
  };
  instances.set(id, instance);
  return instance;
}

