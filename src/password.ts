import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const SALT_ITERATION = 32;
const SALT_SIZE = 64;

export function hashPassword(
  rawPassword: string,
  salt: string
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    scrypt(rawPassword, salt, SALT_ITERATION, (err, password) => {
      if (err) {
        reject(err);
      } else {
        resolve(password.toString("hex"));
      }
    });
  });
}

export async function createPassword(rawPassword: string): Promise<string> {
  const salt = randomBytes(SALT_SIZE / 2).toString("hex");
  const password = await hashPassword(rawPassword, salt);
  return password + salt;
}

export async function verifyPassword(
  rawPassword: string,
  hash: string
): Promise<boolean> {
  try {
    const salt = hash.slice(-SALT_SIZE);
    const hashedPassword = hash.substring(0, hash.length - SALT_SIZE);
    const newHash = await hashPassword(rawPassword, salt);
    return timingSafeEqual(Buffer.from(newHash), Buffer.from(hashedPassword));
  } catch {
    return false;
  }
}
