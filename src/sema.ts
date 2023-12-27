import { Semaphore } from "redis-semaphore";
import Redis from "ioredis";

const url = process.env.KV_URL;
if (!url) throw new Error("Cannot find `KV_URL` environment variable.");

const redis = new Redis(url, { tls: {} });

export function createSema(identifier: string, limit: number): Semaphore {
  return new Semaphore(redis, `semaphore:${identifier}`, limit);
}

export async function withSema<T>(
  identifier: string,
  limit: number,
  fn: () => Promise<T>
): Promise<T> {
  const semaphore = createSema(identifier, limit);
  await semaphore.acquire();
  try {
    return await fn();
  } finally {
    await semaphore.release();
  }
}
