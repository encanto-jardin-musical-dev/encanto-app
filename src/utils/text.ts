/**
 * Lowercase and strip diacritics for client-side search matching, so that
 * "jose" matches "José" and "nino" matches "Niño" (Spanish-language app).
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
