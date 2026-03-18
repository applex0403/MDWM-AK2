import { randomUUID } from "crypto";
import { ConcurrencyLevel, ConcurrencyProfile } from "./types";

const profiles = new Map<string, ConcurrencyProfile>();

export function seedDefaultProfiles() {
  if (profiles.size > 0) return;
  createConcurrencyProfile({
    name: "百万级 TPS",
    level: "million",
    minTps: 100000,
    maxTps: 999999,
    description: "中小型系统",
  });
  createConcurrencyProfile({
    name: "千万级 TPS",
    level: "ten_million",
    minTps: 1000000,
    maxTps: 9999999,
    description: "电商、政务、中型应用",
  });
  createConcurrencyProfile({
    name: "五千万级 TPS",
    level: "fifty_million",
    minTps: 10000000,
    maxTps: 49999999,
    description: "大型电商、直播、高并发业务",
  });
  createConcurrencyProfile({
    name: "亿级 TPS",
    level: "hundred_million",
    minTps: 50000000,
    maxTps: 100000000,
    description: "秒杀、大促、头部互联网业务",
  });
}

export function listConcurrencyProfiles(): ConcurrencyProfile[] {
  return Array.from(profiles.values());
}

export function createConcurrencyProfile(
  payload: Omit<ConcurrencyProfile, "id">
): ConcurrencyProfile {
  const id = randomUUID();
  const profile: ConcurrencyProfile = { id, ...payload };
  profiles.set(id, profile);
  return profile;
}

