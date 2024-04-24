import { getEnv } from "@larskarbo/get-env";
import Redis from "ioredis";

const getRedisInstance = () => {
  return new Redis(getEnv("REDIS_URL"));
};

export const redisInstance = getRedisInstance();
