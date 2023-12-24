import { ZodError, type ZodIssue, type ZodRawShape, type z } from "zod";
import { APIError } from ".";

export async function verifyInternal<T extends ZodRawShape>(
  json: unknown,
  location: "body" | "params",
  schema: z.ZodObject<T>
) {
  try {
    return schema.parse(json);
  } catch (e) {
    let types: ZodIssue[] | undefined;
    if (e instanceof ZodError) {
      types = e.issues;
    }
    throw new APIError({
      code: `invalid_${location}`,
      statusCode: 400,
      types,
      message: `The ${location} type is invalid. See the \`types\` property.`,
    });
  }
}
