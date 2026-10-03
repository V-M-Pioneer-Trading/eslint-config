// Just enough of React's surface for the hooks plugin to recognise the
// imports; the fixtures need no real React.
declare module "react" {
  export function useState<T>(initial: T): [T, (next: T) => void];
  export function useEffect(effect: () => void, deps?: readonly unknown[]): void;
}
