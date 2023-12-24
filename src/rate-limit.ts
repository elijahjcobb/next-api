import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";
import { APIError } from "./api-error";
import type { TimeString } from "./time-string";

export async function rateLimit({
  endpoint,
  identifier,
  tokens,
  window,
}: {
  endpoint: string;
  identifier: string;
  tokens: number;
  window: TimeString;
}): Promise<void> {
  const r = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(tokens, window),
    analytics: true,
    prefix: `@upstash/ratelimit/${endpoint}`,
  });

  const { success } = await r.limit(identifier);
  if (!success) {
    throw new APIError({
      statusCode: 429,
      message: "Too Many Requests",
      code: "too_many_requests",
    });
  }
}
