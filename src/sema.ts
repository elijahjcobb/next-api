import { Semaphore } from "redis-semaphore";
import Redis from "ioredis";

const url = process.env.KV_URL;
if (!url) throw new Error("Cannot find `KV_URL` environment variable.");

const redis = new Redis(url);

export async function withSemaphore<T>(
  identifier: string,
  limit: number,
  fn: () => Promise<T>
): Promise<T> {
  const semaphore = new Semaphore(redis, `semaphore:${identifier}`, limit);
  await semaphore.acquire();
  try {
    return await fn();
  } finally {
    await semaphore.release();
  }
}
