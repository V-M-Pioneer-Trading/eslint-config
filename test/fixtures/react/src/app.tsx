async function load(): Promise<void> {
  await Promise.resolve();
}

export function App(): unknown {
  load();
  return <main />;
}
