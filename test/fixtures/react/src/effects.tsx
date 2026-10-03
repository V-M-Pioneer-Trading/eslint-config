import { useEffect, useState } from "react";

export function Tracker({ symbol }: { symbol: string }): unknown {
  const [seen, setSeen] = useState("");
  useEffect(() => {
    setSeen(symbol);
  }, []);
  return <p>{seen}</p>;
}
