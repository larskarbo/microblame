import { getEnv } from "@larskarbo/get-env";
import Redis from "ioredis";

export const getEverythingRedis = () => {
  return new Redis(getEnv("EVERYTHING_REDIS_URL"));
};

export const everythingRedis = getEverythingRedis();
