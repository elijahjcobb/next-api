import { kv } from "@vercel/kv";
import { Mutex } from "redis-semaphore";

const url = process.env.KV_URL;
if (!url) throw new Error("Cannot find `KV_URL` environment variable.");

export function createMutex(identifier: string): Mutex {
  // @ts-expect-error - ignore the type error
  return new Mutex(kv, `mutex:${identifier}`);
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
