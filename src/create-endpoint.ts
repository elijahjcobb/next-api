import { NextRequest, NextResponse } from "next/server";
import { APIError } from "./api-error";
import { type RateLimitWindow, rateLimit } from "./rate-limit";

export type Handler = (
  req: NextRequest,
  getParam: (param?: string) => string
) => Promise<NextResponse>;

export interface EndpointOptions {
  rateLimit?: {
    window: RateLimitWindow;
    tokens: number;
    disable?: boolean;
  };
}

export function createEndpoint(
  handler: Handler,
  options?: EndpointOptions
): (
  req: NextRequest,
  meta: { params: Record<string, string> }
) => Promise<NextResponse> {
  return async (
    req: NextRequest,
    meta: { params: Record<string, string> }
  ): Promise<NextResponse> => {
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
        if (options?.rateLimit?.disable !== true) {
          await rateLimit({
            endpoint: `${req.method}-${req.nextUrl.pathname}`,
            identifier:
              req.cookies.get("authorization")?.value ??
              req.headers.get("x-real-ip") ??
              req.ip ??
              "unknown",
            tokens: options?.rateLimit?.tokens ?? 100,
            window: options?.rateLimit?.window ?? "1m",
          });
        }
        return await handler(req, getParam);
      } catch (e) {
        // handle custom errors here
        throw e;
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
