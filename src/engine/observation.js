/**
 * ★ THE OBSERVATION RECORD — Chapter 1's real output. (EVS-6)
 *
 * ============================================================================
 * ⚠️ THE SIX BOUNDARIES ARE WHAT KEEP THIS FROM BEING THE ARTIFACT CANON
 * PROHIBITS.
 * ============================================================================
 * Canon: *"No formal assessment or transfer artifact is completed in Chapters
 * 1-3."* This is what Chapter 1 produces instead — a PERSONAL PREPAREDNESS
 * OBSERVATION. If any boundary is violated, it is the prohibited artifact with
 * a new noun on it.
 *
 *   B1  Participant-owned and PRIVATE until deliberately promoted.
 *   B2  Carries no review, approval, completeness, evidence or capability
 *       status. There is no state field to set.
 *   B3  Earns NO recognition and resolves no flag. Nothing congratulates.
 *   B4  Records UNCERTAINTY and a FOLLOW-UP QUESTION rather than asserting an
 *       assessed dependency.
 *   B5  Every export carries the label, verbatim, beside the scope boundary.
 *   B6  Enters Chapter 4 only through explicit confirmation and correction.
 *
 * ★ B2 AND B3 ARE ENFORCED BY ABSENCE. `observation-record.schema.json` is
 * `additionalProperties: false` and has no `reviewState`, no `approvedBy`, no
 * `completeness`, no `capabilityCredit`, no flag — so such a record is
 * UNREPRESENTABLE rather than refused. This module builds only what that shape
 * allows.
 *
 * ⚠️ AND IT DOES NOT RUN AJV. The schema is compiled against these records in
 * `test/observation.test.js`; putting a validator in the browser bundle would
 * multiply its size for a check the tests already make, and this audience is on
 * slow connections.
 */

/** ★ B5 — verbatim, and a `const` in the schema so it cannot be softened. */
export const EXPORT_LABEL = 'unverified personal preparedness observation — not an assessment';

/** ★ B1 — there is no other value. Not a coordinator's, not the facility's. */
export const VISIBILITY = 'participant-private';

/**
 * The four prompts, transcribed from the Chapter 1 definition of done § 4.
 *
 * ★ ROWS THREE AND FOUR ARE WHAT MAKE THIS AN OBSERVATION. Without them it
 * asserts an assessed dependency, which is the artifact. They are required by
 * the schema, and required here.
 */
export const SECTIONS = Object.freeze(['service', 'undocumentedDependency', 'notSureAbout', 'questionToAsk']);
export const PROMPT_KEYS = Object.freeze({
  service: 'observation.service.prompt',
  undocumentedDependency: 'observation.undocumented_dependency.prompt',
  notSureAbout: 'observation.not_sure_about.prompt',
  questionToAsk: 'observation.question_to_ask.prompt',
});

export class ObservationRefusal extends Error {
  constructor(refusal, detail) {
    super(detail ? `${refusal}: ${detail}` : refusal);
    this.refusal = refusal;
    this.detail = detail;
  }
}

/**
 * ⚠️ `participantRef` IS AN OPAQUE LOCAL ID, NEVER THE DISPLAY NAME.
 *
 * A name identifies a person, and this record is about their hospital. Keyed by
 * a name it becomes a document about a named professional's workplace — which
 * is the thing B1 exists to prevent, arrived at from a different direction than
 * facility visibility. The id is generated in the browser and never leaves it.
 */
export const newParticipantRef = () =>
  (globalThis.crypto?.randomUUID?.() ?? `p-${Math.random().toString(36).slice(2)}`);

export function buildObservation({
  participantRef, answers = {}, run = null, now = () => new Date().toISOString(),
}) {
  if (!participantRef) throw new ObservationRefusal('observation-has-no-participant');

  const sections = {};
  for (const section of SECTIONS) {
    const text = (answers[section] ?? '').trim();
    // ★ B4 — the last two are not optional, and refusing an empty one is what
    // makes the boundary real rather than a hope about how people fill forms.
    if (!text) throw new ObservationRefusal('observation-section-is-empty', section);
    sections[section] = { promptKey: PROMPT_KEYS[section], text };
  }

  return Object.freeze({
    id: `obs-${participantRef}`,
    participantRef,
    chapter: 'ch-01',
    visibility: VISIBILITY,
    sections,
    exportLabel: EXPORT_LABEL,
    // ★ B6 — null, and it stays null. Q19 owes who initiates promotion, who
    // sees the record before and after, whether the participant may withdraw
    // first, and what provenance survives. Until that is answered there is no
    // route, and an empty route is the honest state.
    promotion: null,
    createdAt: now(),
    provenance: run
      ? { sceneId: run.order?.at(-1) ?? null, decisionId: run.history?.at(-1)?.decisionId ?? null, bundleVersion: run.bundleVersion }
      : undefined,
  });
}

/**
 * Everything wrong with an observation, NAMED — mirroring the schema's shape
 * so a record built by hand cannot slip past in the browser.
 */
export function observationRefusals(record) {
  const out = [];
  if (record?.visibility !== VISIBILITY) out.push({ refusal: 'observation-is-not-private', detail: String(record?.visibility) });
  if (record?.exportLabel !== EXPORT_LABEL) out.push({ refusal: 'observation-label-was-altered', detail: String(record?.exportLabel) });
  for (const section of SECTIONS) {
    if (!record?.sections?.[section]?.text) out.push({ refusal: 'observation-section-is-empty', detail: section });
  }
  // ★ B2 and B3 — asserted BY NAME, so adding one is a failing check rather
  // than a silent widening. The schema makes them unrepresentable; this catches
  // a record assembled without it.
  for (const forbidden of ['reviewState', 'approvedBy', 'completeness', 'evidenceStatus',
                           'capabilityCredit', 'recognition', 'flag', 'score']) {
    if (record && forbidden in record) {
      out.push({ refusal: 'observation-carries-a-status-it-may-not-have', detail: forbidden });
    }
  }
  if (record?.promotion != null) {
    out.push({ refusal: 'observation-claims-promotion-before-Q19', detail: 'promotion must be null' });
  }
  return out;
}

export function assertObservationIsBounded(record) {
  const failures = observationRefusals(record);
  if (failures.length) {
    throw new ObservationRefusal(failures[0].refusal, failures.map((f) => f.detail).join('; '));
  }
  return true;
}
