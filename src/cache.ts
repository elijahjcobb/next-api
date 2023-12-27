import kv from "@vercel/kv";

export interface CacheConfig {
  key: string;
  value: any;
  ttlSeconds?: number;
}

function getKey(key: string): string {
  return `cache:${key}`;
}

export const TTL_ONE_MINUTE = 60;
export const TTL_ONE_HOUR = 60 * TTL_ONE_MINUTE;
export const TTL_ONE_DAY = TTL_ONE_HOUR * 24;
export const TTL_ONE_WEEK = TTL_ONE_DAY * 7;
export const TTL_ONE_MONTH = TTL_ONE_WEEK * 4;

export async function setCache({
  key,
  value,
  ttlSeconds,
}: CacheConfig): Promise<void> {
  await kv.set(
    getKey(key),
    JSON.stringify(value),
    ttlSeconds === undefined ? undefined : { ex: ttlSeconds }
  );
}

export function getCache<T>(key: string): Promise<T | null> {
  return kv.get(getKey(key));
}

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  expensiveFunction: () => Promise<T>
): Promise<T> {
  let value = await getCache<T>(key);
  if (!value) {
    value = await expensiveFunction();
    await setCache({ key, value, ttlSeconds });
  }
  return value;
}
