import { NextRequest, NextResponse } from "next/server";
import { APIError, APIErrorData } from "./api-error";
import { rateLimit } from "./rate-limit";
import { createSema } from "./sema";
import { Semaphore } from "redis-semaphore";
import type { TimeString } from "./time-string";

export type Handler<T> = (
  req: NextRequest,
  getParam: (param?: string) => string
) => Promise<NextResponse<T>>;

export interface EndpointOptions {
  rateLimit?: {
    window: TimeString;
    tokens: number;
    disable?: boolean;
  };
  concurrencyLimit?: number;
}

export function createEndpoint<T>(
  handler: Handler<T>,
  options?: EndpointOptions
): (
  req: NextRequest,
  meta: { params: Record<string, string> }
) => Promise<NextResponse<T | APIErrorData>> {
  return async (
    req: NextRequest,
    meta: { params: Record<string, string> }
  ): Promise<NextResponse<T | APIErrorData>> => {
    let sema: Semaphore | undefined;
    try {
      try {
        const getParam = (param?: string): string => {
          let key = param ?? "id";
          let value = meta?.params?.[key];
          if (!value)
            throw new APIError({
              statusCode: 400,
              message: `Missing dynamic slug parameter for ${key}.`,
              code: "missing-slug-parameter",
            });
          return value;
        };
        const userIdentifier =
          req.cookies.get("token")?.value ??
          req.headers.get("authorization") ??
          "default";
        const endpointIdentifier = `${req.method}-${req.nextUrl.pathname}`;
        if (options?.rateLimit?.disable !== true) {
          await rateLimit({
            endpoint: endpointIdentifier,
            identifier: userIdentifier,
            tokens: options?.rateLimit?.tokens ?? 100,
            window: options?.rateLimit?.window ?? "1m",
          });
        }
        if (options?.concurrencyLimit) {
          sema = createSema(endpointIdentifier, options.concurrencyLimit);
          await sema.acquire();
        }
        return await handler(req, getParam);
      } catch (e) {
        // handle custom errors here
        throw e;
      } finally {
        if (sema) await sema.release();
      }
    } catch (e) {
      let error: APIError;
      if (e instanceof APIError) {
        error = e;
      } else {
        error = new APIError({
          message: "Internal server error.",
          statusCode: 500,
          code: "internal-server-error",
        });
      }
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
  };
}
