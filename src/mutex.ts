import Redis from "ioredis";
import { Mutex } from "redis-semaphore";

const url = process.env.KV_URL;
if (!url) throw new Error("Cannot find `KV_URL` environment variable.");

const redis = new Redis(url);

export function createMutex(identifier: string): Mutex {
  return new Mutex(redis, `mutex:${identifier}`);
}

export async function withMutex<T>(
  identifier: string,
  fn: () => Promise<T>
): Promise<T> {
  const mutex = createMutex(identifier);
  await mutex.acquire();
  try {
    return await fn();
  } finally {
    await mutex.release();
  }
}
