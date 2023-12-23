import { compare, hash } from "bcrypt";

const SALT_ITERATION = 10;

export async function createPassword(rawPassword: string): Promise<string> {
  return await hash(rawPassword, SALT_ITERATION);
}

export async function verifyPassword(
  rawPassword: string,
  password: string
): Promise<boolean> {
  try {
    return await compare(rawPassword, password);
  } catch {
    return false;
  }
}
