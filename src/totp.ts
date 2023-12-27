import { hash } from "bcrypt";
import { totp } from "otplib";
import { kv } from "@vercel/kv";
import { randomBytes } from "crypto";

const TOKEN_TIMING = 360;
const TOKEN_WINDOW = 2;

totp.options = {
  digits: 6,
  step: TOKEN_TIMING,
  window: TOKEN_WINDOW,
};

const SECRET = process.env.TOTP_SECRET;

async function createSecret({
  salt,
  identifier,
}: {
  identifier: string;
  salt: string;
}): Promise<string> {
  if (!SECRET)
    throw new Error("Cannot find `TOTP_SECRET` environment variable.");
  return await hash(`${SECRET}:${identifier}`, salt);
}

function kvKeyForIdentifier(identifier: string): string {
  return `totp-salt-${identifier}`;
}

export async function totpCreate({
  identifier,
}: {
  identifier: string;
}): Promise<string> {
  const salt = randomBytes(32).toString("hex");
  const secret = await createSecret({ salt, identifier });
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
    const secret = await createSecret({ salt, identifier });
    return totp.verify({ token: code, secret });
  } catch {
    return false;
  }
}
