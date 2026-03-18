export type ConcurrencyLevel = "million" | "ten_million" | "fifty_million" | "hundred_million";

export interface ConcurrencyProfile {
  id: string;
  name: string;
  level: ConcurrencyLevel;
  minTps: number;
  maxTps: number;
  description?: string;
}

