import { NextRequest } from "next/server";
import { verifyInternal } from "./verify-internal";
import { type ZodRawShape, z } from "zod";

export async function verifyBody<T extends ZodRawShape>(
  req: NextRequest,
  schema: z.ZodObject<T>
) {
  return verifyInternal(await req.json(), "body", schema);
}
