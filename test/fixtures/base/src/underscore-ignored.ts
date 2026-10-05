// Underscore-prefixed names say "unused on purpose": Express tells an error
// handler from a normal one by its arity, so `_next` must be declared.
interface Res {
  status(code: number): Res;
  send(body: string): void;
}

export function errorHandler(err: Error, _req: unknown, res: Res, _next: () => void): void {
  res.status(500).send(err.message);
}

export function parse(text: string): number | undefined {
  try {
    return Number(text);
  } catch (_e) {
    return undefined;
  }
}
