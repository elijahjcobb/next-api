import { z } from "zod";

const apiErrorDataSchema = z.object({
  code: z.string(),
  message: z.string(),
  statusCode: z.number(),
});

export function isAPIError(value: unknown): value is APIError {
  return apiErrorDataSchema.safeParse(value).success;
}

export type APIErrorData = z.infer<typeof apiErrorDataSchema>;

export class APIError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly error?: unknown;

  public constructor({
    code,
    message,
    statusCode,
    error,
  }: {
    message: string;
    code: string;
    statusCode: number;
    error?: unknown;
  }) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.error = error;
  }

  public toJSON(): APIErrorData {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }

  public toString(): string {
    return JSON.stringify(this.toJSON());
  }
}
