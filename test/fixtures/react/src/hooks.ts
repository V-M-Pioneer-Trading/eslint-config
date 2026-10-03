declare function useState<T>(initial: T): [T, (next: T) => void];

export function useCounter(enabled: boolean): number {
  if (enabled) {
    const [count] = useState(0);
    return count;
  }
  return 0;
}
