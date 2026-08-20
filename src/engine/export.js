/**
 * ★ THE PARTICIPANT TAKES IT AWAY. (EVS-6)
 *
 * ============================================================================
 * IT MUST WORK WITHOUT LATER PLATFORM ACCESS.
 * ============================================================================
 * The observation is the one thing a participant leaves with. If reading it
 * again next month requires logging in, the product has kept their note about
 * their own hospital — which is what the privacy condition forbids.
 *
 * So an export is a STRING. Two of them: one a person reads, one a machine
 * does. Neither needs this application to exist.
 *
 * ★ EVERY EXPORT CARRIES BOUNDARY 5, VERBATIM, BESIDE THE SCOPE BOUNDARY.
 * The label is a `const` in the contract so it cannot be softened, shortened or
 * localised into something that sounds like a finding — and a note that leaves
 * here and is read by a colleague in six months has only that sentence to say
 * what it is not.
 */

import { EXPORT_LABEL, SECTIONS, assertObservationIsBounded } from './observation.js';

/** The plain-text export. Printable, pasteable, and readable with nothing installed. */
export function observationAsText(observation, t) {
  assertObservationIsBounded(observation);

  const lines = [
    t('observation.export.heading'),
    '',
    // ★ B5, first, before anything a reader might mistake for a finding.
    EXPORT_LABEL.toUpperCase(),
    t('boundary.statement'),
    '',
  ];

  for (const section of SECTIONS) {
    lines.push(t(observation.sections[section].promptKey));
    lines.push(`  ${observation.sections[section].text}`);
    lines.push('');
  }

  lines.push(t('observation.export.footer'));
  return lines.join('\n');
}

/** The machine-readable export. Same content, same label, no extra status. */
export function observationAsJson(observation) {
  assertObservationIsBounded(observation);
  return JSON.stringify({
    ...observation,
    // Repeated at the top level of the export so a tool reading one field reads
    // this one. It is already on the record; an export is read out of context.
    exportLabel: EXPORT_LABEL,
  }, null, 2);
}

/**
 * Hand the string to the participant.
 *
 * ⚠️ NOT A NETWORK CALL, AND NOT A SERVICE. A blob URL, built in the page from
 * a string the page already holds. The privacy tests assert that no fetch,
 * XHR, beacon or socket is opened anywhere in this flow, and this is the
 * function that would break that if it were written the easy way.
 */
export function downloadAsFile({ text, filename, documentImpl = globalThis.document, urlImpl = globalThis.URL }) {
  if (!documentImpl || !urlImpl) return { downloaded: false, reason: 'no-document' };
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const href = urlImpl.createObjectURL(blob);
  const a = documentImpl.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
  urlImpl.revokeObjectURL(href);
  return { downloaded: true, filename };
}
