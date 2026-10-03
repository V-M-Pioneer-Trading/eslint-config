// vite's preset allows a constant next to components (allowConstantExport).
export const MAX = 3;

export function Gauge(): unknown {
  return <meter max={MAX} />;
}
