import { Semaphore } from "redis-semaphore";
import { kv } from "@vercel/kv";

const url = process.env.KV_URL;
if (!url) throw new Error("Cannot find `KV_URL` environment variable.");

export function createSema(identifier: string, limit: number): Semaphore {
  // @ts-expect-error - ignore the type error
  return new Semaphore(kv, `semaphore:${identifier}`, limit);
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
