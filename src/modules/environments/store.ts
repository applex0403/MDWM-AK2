import { Environment } from "./types";
import { randomUUID } from "crypto";

const environments = new Map<string, Environment>();

export function listEnvironments(): Environment[] {
  return Array.from(environments.values());
}

export function createEnvironment(
  payload: Omit<Environment, "id">
): Environment {
  const id = randomUUID();
  const env: Environment = { id, ...payload };
  environments.set(id, env);
  return env;
}

export function getEnvironment(id: string): Environment | undefined {
  return environments.get(id);
}

