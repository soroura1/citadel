/**
 * ★ DEFERRED CONSEQUENCE AND TRACEBACK — R4 Phase C.
 *
 * ============================================================================
 * THE HARDEST STEP, BUILT BEFORE THE CONTENT THAT PAYS IT OFF EXISTS.
 * ============================================================================
 * "Building the loop's hardest step last is how the prior trial ended with a
 * story that had no payoff." R3 already records held effects with the option
 * that incurred them; this is what makes one arrive, and what lets a
 * participant ask WHY three chapters later and get a true answer.
 *
 * A consequence nobody can trace is indistinguishable from an arbitrary one —
 * and a player who cannot see the link concludes the game is unfair, which is
 * the exact opposite of the lesson.
 */

export class ConsequenceRefusal extends Error {
  constructor(refusal, detail) {
    super(detail ? `${refusal}: ${detail}` : refusal);
    this.refusal = refusal;
    this.detail = detail;
  }
}

/** C6 — how the consequence relates to what caused it. */
export const RELATIONSHIP_TYPES = Object.freeze([
  'demonstrated',
  'shared-vulnerability',
  'precursor',
  'response-created',
  'compound',
  'independent',
  'uncertain',
]);

/**
 * C1, C9, C10 — record a deferred consequence.
 *
 * ★ `caused_by` IS THE TRACEBACK ROOT AND MAY NEVER BE EMPTY.
 *
 * Without it there is no chain to assemble later, and the consequence becomes
 * exactly the arbitrary event the mechanic exists to avoid.
 */
export function defer({ caused_by, surfaces_at, relationship, emotional, operational,
                        player_could_have_known, foreshadowed_at }) {
  if (!Array.isArray(caused_by) || caused_by.length === 0) {
    throw new ConsequenceRefusal('consequence-has-no-cause', 'caused_by must name at least one decision option');
  }
  if (!surfaces_at) throw new ConsequenceRefusal('consequence-never-surfaces');
  if (!RELATIONSHIP_TYPES.includes(relationship)) {
    throw new ConsequenceRefusal('unknown-relationship-type', String(relationship));
  }

  // ★ C10 — BOTH fields. Neither alone.
  //
  // Operational alone is a status change nobody feels. Emotional alone is a
  // mood with no cost. The product's proposition needs both, because a
  // consequence that only moves a number teaches nothing and one that only
  // moves a feeling teaches the wrong thing.
  if (!emotional?.trim()) throw new ConsequenceRefusal('consequence-has-no-emotional-account');
  if (!operational?.trim()) throw new ConsequenceRefusal('consequence-has-no-operational-account');

  // ★ C9 — AN UNFORESHADOWED "YOU COULD HAVE KNOWN" IS A LIE THE PRODUCT TELLS.
  //
  // Telling a professional they should have seen something that was never shown
  // is not a lesson, it is a trick — and it is the fastest way to lose the
  // audience this product needs.
  if (player_could_have_known === true && !foreshadowed_at) {
    throw new ConsequenceRefusal(
      'unforeshadowed-could-have-known',
      'player_could_have_known is true but foreshadowed_at names nothing',
    );
  }

  return Object.freeze({
    caused_by: [...caused_by],
    surfaces_at,
    relationship,
    emotional,
    operational,
    player_could_have_known: player_could_have_known === true,
    foreshadowed_at: foreshadowed_at ?? null,
    fired: false,
  });
}

/**
 * C3 — trigger evaluation, in all three forms.
 *
 * A consequence fires when its boundary is reached AND its condition holds.
 * The three forms are deliberately separate: a chapter boundary is dramatic
 * structure, a variable threshold is accumulated state, and a prior decision is
 * a specific act. Collapsing them into one predicate would lose which kind of
 * thing caused the arrival, and that is what the traceback has to say.
 */
export function shouldFire(consequence, { chapter, season = {}, decisionsTaken = [] }) {
  const at = consequence.surfaces_at;

  // ⚠️ A HELD EFFECT IS NOT A DEFERRED CONSEQUENCE, THOUGH BOTH WERE CALLED
  // "pending" until the chapter runner made them meet.
  //
  //   a held effect      {operation, variable, magnitude, delay}  — R3
  //   a consequence      {caused_by, surfaces_at, relationship,   — R4
  //                       emotional, operational}
  //
  // An effect is a state change waiting for its moment. A consequence is a
  // narrative event with a cause, a relationship and two accounts of what it
  // did. One can produce the other; they are not the same record, and passing
  // the first here used to be a TypeError three frames deep.
  if (!at) {
    throw new ConsequenceRefusal(
      'not-a-deferred-consequence',
      'this record has no surfaces_at — a held EFFECT was passed where a CONSEQUENCE belongs',
    );
  }

  if (at.chapter && at.chapter !== chapter) return false;

  if (at.variable_threshold) {
    const { variable, band, comparison = 'at-or-below' } = at.variable_threshold;
    const order = ['critical', 'strained', 'adequate', 'strong'];
    const now = order.indexOf(season[variable]);
    const limit = order.indexOf(band);
    if (now === -1 || limit === -1) return false;
    if (comparison === 'at-or-below' ? now > limit : now < limit) return false;
  }

  if (at.after_decision && !decisionsTaken.includes(at.after_decision)) return false;

  return true;
}

/**
 * ★ C7 — TRACEBACK ASSEMBLY: a COMPLETE, ORDERED chain naming the originating
 * decision.
 *
 * Complete matters. A chain missing its middle reads as a coincidence, and the
 * participant is right to distrust it.
 */
export function traceback(consequence, history) {
  const chain = [];

  for (const causeId of consequence.caused_by) {
    const origin = history.find((h) => h.optionId === causeId);
    if (!origin) {
      throw new ConsequenceRefusal(
        'traceback-chain-broken',
        `${causeId} is named as a cause but appears nowhere in the run`,
      );
    }
    chain.push(origin);
  }

  // Ordered by when it happened, not by how it was stored.
  chain.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

  return Object.freeze({
    consequence,
    chain,
    // C8 — readable by a participant, not only by a developer.
    narrative: narrate(consequence, chain),
  });
}

/** C8 — plain language. No identifiers, no jargon, no blame. */
function narrate(consequence, chain) {
  const when = chain.map((c) => c.sceneTitle ?? c.sceneId).filter(Boolean);
  const opening = when.length === 1
    ? `This began in ${when[0]}.`
    : `This began in ${when.slice(0, -1).join(', ')} and ${when.at(-1)}.`;

  const link = {
    demonstrated: 'What happened now showed what that choice had already made true.',
    'shared-vulnerability': 'The same weakness was behind both.',
    precursor: 'That choice made this one possible.',
    'response-created': 'The response to that created this.',
    compound: 'Several earlier choices added up to this.',
    independent: 'This was not caused by that choice — it arrived on its own.',
    uncertain: 'The connection is plausible and not proven.',
  }[consequence.relationship];

  const known = consequence.player_could_have_known
    ? ` It was visible at the time — see ${consequence.foreshadowed_at}.`
    : ' There was no way to know at the time.';

  return `${opening} ${link}${known}`;
}

/**
 * Fire what is due, returning the consequences and the state they leave.
 * A fired consequence is marked, so it cannot arrive twice.
 */
export function fireDue(pending, context) {
  const due = pending.filter((c) => !c.fired && shouldFire(c, context));
  const rest = pending.filter((c) => !due.includes(c));
  return { fired: due.map((c) => ({ ...c, fired: true })), pending: rest };
}
