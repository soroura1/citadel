/**
 * Localisation.
 *
 * NO USER-VISIBLE STRING IS EVER A LITERAL IN SOURCE — including error messages, refusal
 * explanations, button labels and alt text. A literal cannot be translated, and the prior attempt
 * recorded localisation as a BLOCKING gap: its content was substantially bilingual and its platform
 * was not.
 *
 * ⚠️ Arabic has SIX plural categories. A key-value lookup cannot express them. This is a temporary
 * shim for R0's handful of strings; ICU MessageFormat (FormatJS) replaces it before any pluralised
 * or gendered string exists. Recorded so nobody mistakes the shim for the design.
 */

import en from './en.json' with { type: 'json' };
import ar from './ar.json' with { type: 'json' };

const CATALOGUES = { en, ar };
export const AVAILABLE_LOCALES = Object.keys(CATALOGUES);

/** Right-to-left is a LAYOUT MODE, mirrored via CSS logical properties — never a patched stylesheet. */
export const RTL_LOCALES = new Set(['ar']);
export const directionFor = (locale) => (RTL_LOCALES.has(locale) ? 'rtl' : 'ltr');

let current = 'en';
export function setLocale(locale) {
  if (!CATALOGUES[locale]) throw new Error(`unknown locale: ${locale}`);
  current = locale;
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
    document.documentElement.dir = directionFor(locale);
  }
}
export const getLocale = () => current;

export function t(key) {
  const value = CATALOGUES[current]?.[key];
  if (value !== undefined) return value;
  // Fall back to English rather than showing a raw key to a user — but make the gap
  // visible to the coverage report rather than silently acceptable.
  return CATALOGUES.en[key] ?? `⟨${key}⟩`;
}

/**
 * Locale coverage, COMPUTED. A missing translation appears in a report, never discovered by a user.
 */
export function localeCoverage() {
  const keys = Object.keys(en);
  return Object.fromEntries(
    AVAILABLE_LOCALES.map((l) => {
      const missing = keys.filter((k) => CATALOGUES[l][k] === undefined);
      return [l, { total: keys.length, translated: keys.length - missing.length, missing }];
    }),
  );
}
