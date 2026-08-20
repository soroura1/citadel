/**
 * ★ REFLECTION — the participant reconstructs, and the game does not conclude.
 * (EVS-6)
 *
 * ============================================================================
 * OPEN TEXT. NO OPTIONS. NO KEY. NO SCORE.
 * ============================================================================
 * `reflection.schema.json` has no `score` property and is
 * `additionalProperties: false`, so a scored reflection is unrepresentable —
 * *"a number attached to a person's reflection about their own hospital is the
 * exact behaviour DEC-005 exists to prevent."*
 *
 * ★ AND THE SCHEMA STORES `promptKey` + THEIR TEXT, NOT THE PROMPT. That is not
 * an inconvenience to work around: a reflection carrying our sentences beside
 * theirs invites reading the two as a pair, and *"a reflection assembled from
 * our sentences reflects us."*
 *
 * ⚠️ ONE PROMPT IS DERIVED AND TWO ARE WRITTEN, AND THE DIFFERENCE IS RECORDED.
 * The Chapter 1 definition of done specifies the FUNCTION — *"structured
 * reflection, a player-authored principle"* — and writes no wording. So the
 * causal prompt is composed from the participant's own committed option, which
 * makes it about what they actually did; the other two are mine, cited to the
 * planning line that asks for them, with final wording owed.
 *
 * ⛔ WHAT IS DELIBERATELY NOT ASKED: anything that enumerates what they did not
 * find out. The evidence they never discovered is knowable and it would be easy
 * to list — and a list of your gaps at the end of a chapter is a mark, whatever
 * the surrounding sentence says. DEC-005.
 */

export class ReflectionRefusal extends Error {
  constructor(refusal, detail) {
    super(detail ? `${refusal}: ${detail}` : refusal);
    this.refusal = refusal;
    this.detail = detail;
  }
}

const OWED = 'The definition of done asks for structured reflection and a player-authored principle and writes no wording. This is the wording, and it is owed a review before the human gate.';

/**
 * The prompts, for a run that has ended.
 *
 * The first names the participant's own last commitment, so the question is
 * about their chapter rather than about chapters in general.
 */
export function reflectionPrompts(record) {
  const last = record?.scenes?.at(-1) ?? null;
  return Object.freeze([
    {
      key: 'reflection.causality.prompt',
      // Derived: it carries the option the participant actually committed to.
      derived: true,
      about: last?.option?.labelKey ?? null,
      committedAs: last?.committedAs ?? null,
      derivedFrom: 'The participant’s own final commitment, from the record.',
    },
    {
      key: 'reflection.uncertainty.prompt',
      derived: false,
      derivedFrom: 'chapter-1-definition-of-done.md § 4 — an observation records uncertainty rather than asserting an assessed dependency.',
      wording_unresolved: OWED,
    },
    {
      key: 'reflection.principle.prompt',
      derived: false,
      derivedFrom: 'chapter-1-definition-of-done.md § 3 — “structured reflection, a player-authored principle”.',
      wording_unresolved: OWED,
    },
  ]);
}

export function buildReflection({ participantRef, answers = {} }) {
  if (!participantRef) throw new ReflectionRefusal('reflection-has-no-participant');

  const responses = Object.entries(answers)
    .map(([promptKey, text]) => ({ promptKey, text: String(text ?? '').trim() }))
    .filter((r) => r.text.length > 0);

  // A reflection with nothing in it is not a reflection. Refusing is honest;
  // storing an empty one would let a surface report that reflection happened.
  if (responses.length === 0) throw new ReflectionRefusal('reflection-is-empty');

  return Object.freeze({
    participantRef,
    responses,
    // ⚠️ Q20 owes the mechanism, and recognition would be for the QUALITY OF
    // INQUIRY, never for the safety state described. Null until then.
    quality: null,
  });
}

export function reflectionRefusals(reflection) {
  const out = [];
  if (!reflection?.responses?.length) out.push({ refusal: 'reflection-is-empty', detail: '' });
  for (const r of reflection?.responses ?? []) {
    if (!r.promptKey) out.push({ refusal: 'reflection-response-has-no-prompt', detail: r.text?.slice(0, 20) });
    if (!r.text?.trim()) out.push({ refusal: 'reflection-response-is-empty', detail: r.promptKey });
    // ★ Their words, not ours. The prompt is referenced, never carried.
    if ('prompt' in r) out.push({ refusal: 'reflection-carries-our-words', detail: r.promptKey });
  }
  if (reflection && 'score' in reflection) out.push({ refusal: 'reflection-was-scored', detail: 'score' });
  if (reflection?.quality != null) out.push({ refusal: 'reflection-claims-quality-before-Q20', detail: 'quality must be null' });
  return out;
}
