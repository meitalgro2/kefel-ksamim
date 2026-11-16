/** Turn what the child typed into a number. Empty / no digits -> null. "056" -> 56. */
export function parseAnswer(raw: string): number | null {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 3);
  if (!digits) return null;
  return parseInt(digits, 10);
}
