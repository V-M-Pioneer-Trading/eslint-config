// JavaScript opted into type information through `files`, which is how a
// JavaScript React app is linted: type-aware rules fire here too.
async function load() {
  await Promise.resolve();
}

export function App() {
  load();
  return <main />;
}
