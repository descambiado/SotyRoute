/**
 * Redaction helpers for SOTY evidence output — PR 9.
 *
 * Strips or rejects fields whose names match unsafe patterns before any
 * evidence data is serialized or displayed.
 *
 * Safety: no I/O, no external calls, no system mutations.
 */

export const UNSAFE_FIELD_PATTERNS: readonly RegExp[] = [
  /query/i,
  /search_term/i,
  /password/i,
  /token/i,
  /cookie/i,
  /credential/i,
  /secret/i,
  /api_key/i,
  /external_page_content/i,
  /response_body/i,
  /raw_html/i,
  /downloaded_content/i,
  /clipboard_content/i,
];

/**
 * Redaction guarantee fields in SotyEvidenceRedactionGuarantees whose names
 * overlap with unsafe patterns but are structurally safe (all values are false).
 * Whitelisting them prevents deepStripUnsafeFields from erasing the guarantee
 * fields themselves from the JSON output.
 */
export const SAFE_FIELD_EXCEPTIONS = new Set([
  "query_content_logged",
  "external_page_content_logged",
  "credentials_logged",
  "tokens_logged",
  "cookies_logged",
  "osint_query_content_logged",
]);

export function isUnsafeFieldName(key: string): boolean {
  if (SAFE_FIELD_EXCEPTIONS.has(key)) return false;
  return UNSAFE_FIELD_PATTERNS.some((re) => re.test(key));
}

/**
 * Shallow-strips keys from `obj` whose names match unsafe patterns.
 * Returns a new object — never mutates the input.
 */
export function stripUnsafeFields<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(obj) as Array<keyof T>) {
    if (!isUnsafeFieldName(String(key))) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Recursively strips unsafe fields from a plain object/array tree.
 * Returns a new structure — never mutates the input.
 */
export function deepStripUnsafeFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(deepStripUnsafeFields);
  }
  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      if (!isUnsafeFieldName(key)) {
        result[key] = deepStripUnsafeFields(obj[key]);
      }
    }
    return result;
  }
  return value;
}
