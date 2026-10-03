// Every rule set passes this file: it is the proof that the config loads,
// parses with type information and is not simply reporting everything.
export interface Ship {
  readonly symbol: string;
  readonly fuel: number;
}

export async function refuel(ship: Ship, load: (symbol: string) => Promise<number>): Promise<Ship> {
  const fuel = await load(ship.symbol);
  return { ...ship, fuel };
}
