// Reported by strictTypeChecked and NOT by recommendedTypeChecked: the
// condition can never be false, so the check is dead code.
export function describe(ship: { symbol: string }): string {
  if (ship) {
    return ship.symbol;
  }
  return "none";
}
