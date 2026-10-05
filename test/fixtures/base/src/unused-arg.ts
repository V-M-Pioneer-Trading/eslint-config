// The same shapes without the underscore are still dead code.
interface Res {
  status(code: number): Res;
  send(body: string): void;
}

export function errorHandler(err: Error, req: unknown, res: Res, next: () => void): void {
  res.status(500).send(err.message);
}

export function parse(text: string): number | undefined {
  try {
    return Number(text);
  } catch (e) {
    return undefined;
  }
}
