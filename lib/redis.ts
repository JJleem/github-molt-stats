import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

/** 환경변수가 없으면 null — 로컬 개발에서는 Redis 없이도 카드가 렌더링됩니다. */
export const redis: Redis | null = url && token ? new Redis({ url, token }) : null;

/** 지정 시간 안에 끝나지 않으면 reject. 카드 응답이 외부 서비스 지연에 끌려가지 않게 합니다. */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
