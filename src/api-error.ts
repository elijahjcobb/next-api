import { ZodIssue } from "zod";

export interface APIErrorData {
  code: string;
  message: string;
  statusCode: number;
  types?: ZodIssue[];
}

export class APIError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly error?: unknown;
  public readonly types?: ZodIssue[];

  public constructor({
    code,
    message,
    statusCode,
    error,
    types,
  }: {
    message: string;
    code: string;
    statusCode: number;
    error?: unknown;
    types?: ZodIssue[];
  }) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.error = error;
    this.types = types;
  }

  public toJSON(): APIErrorData {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      types: this.types,
    };
  }

  public toString(): string {
    return JSON.stringify(this.toJSON());
  }
}
