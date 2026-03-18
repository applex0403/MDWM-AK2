export type EnvironmentType = "physical" | "docker" | "k8s";

export interface Environment {
  id: string;
  name: string;
  type: EnvironmentType;
  region?: string;
  description?: string;
}

