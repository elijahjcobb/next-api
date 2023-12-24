import { NextRequest } from "next/server";
import { verifyInternal } from "./verify-internal";
import { type ZodRawShape, z } from "zod";

export async function verifyParams<T extends ZodRawShape>(
  req: NextRequest,
  schema: z.ZodObject<T>
) {
  return verifyInternal(
    Object.fromEntries(req.nextUrl.searchParams.entries()),
    "params",
    schema
  );
}
