export async function noThrow<T>(promise: Promise<T>): Promise<T | Error> {
  try {
    return await promise;
  } catch (e) {
    if (e instanceof Error) return e;
    return new Error("Unknown error");
  }
}
