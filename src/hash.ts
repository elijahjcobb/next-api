import { createHash } from "node:crypto";

const ALGO = "sha256";

export function hash(value: string): string {
  const hasher = createHash(ALGO);
  hasher.update(value);
  return hasher.digest("hex");
}
