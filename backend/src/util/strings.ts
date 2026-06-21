/**
 * Small string helpers shared across repositories/services.
 */

/**
 * Clamp a string to at most `max` characters so it can't overflow a bounded
 * VarChar column. Returns undefined/null unchanged (so optional fields stay
 * unset rather than becoming ""). Email Message-IDs and subjects from the wild
 * routinely exceed their nominal limits; clamping here is a belt-and-suspenders
 * guard alongside the widened column types.
 */
export function clamp<T extends string | null | undefined>(value: T, max: number): T {
  if (typeof value !== 'string') return value;
  return (value.length > max ? value.slice(0, max) : value) as T;
}
