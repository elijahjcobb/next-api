import { totp } from "otplib";
import { kv } from "@vercel/kv";
import { APIError } from "./api-error";
import { hash, genSalt } from "bcryptjs";

const TOKEN_TIMING = 360;
const TOKEN_WINDOW = 2;

totp.options = {
  digits: 6,
  step: TOKEN_TIMING,
  window: TOKEN_WINDOW,
};

const SECRET = process.env.TOTP_SECRET;

function kvKeyForIdentifier(identifier: string): string {
  return `totp-salt-${identifier}`;
}

async function generateSecret({
  identifier,
  salt,
}: {
  identifier: string;
  salt: string;
}): Promise<string> {
  return await hash(`${SECRET}${identifier}`, salt);
}

export async function totpCreate({
  identifier,
}: {
  identifier: string;
}): Promise<string> {
  const salt = await genSalt();
  const secret = await generateSecret({ identifier, salt });
  await kv.set(kvKeyForIdentifier(identifier), salt, {
    ex: TOKEN_TIMING * TOKEN_WINDOW,
  });
  return totp.generate(secret);
}

export async function totpVerify({
  identifier,
  code,
}: {
  identifier: string;
  code: string;
}): Promise<boolean> {
  try {
    const salt = await kv.get(kvKeyForIdentifier(identifier));
    if (!salt || typeof salt !== "string")
      throw new Error("Cannot find salt for identifier.");
    const secret = await generateSecret({ identifier, salt });
    return totp.verify({ token: code, secret });
  } catch {
    return false;
  }
}

export async function totpAssert({
  identifier,
  code,
}: {
  identifier: string;
  code: string;
}): Promise<void> {
  const valid = await totpVerify({ identifier, code });
  if (!valid)
    throw new APIError({
      statusCode: 401,
      message: "Incorrect OTP.",
      code: "incorrect_totp_token",
    });
}
