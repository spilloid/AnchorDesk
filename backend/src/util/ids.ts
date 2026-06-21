/** Parse a positive integer route parameter without allowing NaN or decimals. */
export function parseId(raw: string | undefined): number | null {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
}
