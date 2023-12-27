import { JwtPayload, sign as _sign, verify as _verify } from "jsonwebtoken";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import type { TimeString } from "./time-string";

const SECRET = process.env.TOKEN_SECRET;

export function tokenSign(
  payload: string | object | Buffer,
  expiresIn: TimeString = "7d"
): string {
  if (!SECRET) throw new Error("Cannot find `TOKEN_SECRET` in env vars.");
  return _sign(payload, SECRET, {
    expiresIn,
  });
}

export function tokenVerify(
  tokenOrRequest?: NextRequest | string
): string | JwtPayload {
  if (!SECRET) throw new Error("Cannot find `TOKEN_SECRET` in env vars.");
  let t: string | undefined;
  if (typeof tokenOrRequest === "string") t = tokenOrRequest;
  else if (!tokenOrRequest) {
    t = cookies().get("token")?.value;
  } else {
    const authHeader = tokenOrRequest.headers
      .get("authorization")
      ?.split(" ")?.[1];
    if (authHeader) {
      t = authHeader;
    } else {
      t = tokenOrRequest.cookies.get("token")?.value;
    }
  }

  if (!t)
    throw new Error(
      "Token not provided and could not be parses from the `authorization` header or `token` cookie."
    );

  return _verify(t, SECRET);
}
