/**
 * R4 Phase C — deferred consequence and traceback. THE HARDEST MECHANIC.
 *
 * ============================================================================
 * C2: A SYNTHETIC CHAPTER 2, SO THERE IS A BOUNDARY TO FIRE ACROSS.
 * ============================================================================
 * The delayed consequence is CROSS-CHAPTER by definition and v1 contains one
 * chapter — so the machinery is proven against a fixture in CI, and the real
 * payoff ships with Chapter 2. Building it now is deliberate: the prior trial
 * built consequence last and shipped a story that had no payoff.
 *
 * C11: MUTATIONS OF THE FIXTURE ARE PROVEN TO FAIL. A fixture that cannot fail
 * proves nothing — which is the lesson of seven inert rules found in this
 * project on 16-17 August.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { defer, shouldFire, traceback, fireDue, RELATIONSHIP_TYPES, ConsequenceRefusal }
  from '../src/engine/consequence.js';

// --- C2: the synthetic Chapter 2 fixture ------------------------------------
const RUN_HISTORY = [
  { sequence: 1, optionId: 'dec-01-power-pressure.defer-escalation', sceneId: 'sc-01-02', sceneTitle: 'the bay that went dark' },
  { sequence: 2, optionId: 'dec-01-closure-characterization.integrated', sceneId: 'sc-01-04', sceneTitle: 'the unsent correction' },
];

const consequence = (over = {}) => defer({
  caused_by: ['dec-01-power-pressure.defer-escalation'],
  surfaces_at: { chapter: 'ch-02-synthetic' },
  relationship: 'precursor',
  emotional: 'The Foreman does not look at you when he gives the handover.',
  operational: 'The second bay loses power with no tested fallback, because the first was never escalated.',
  player_could_have_known: false,
  ...over,
});

test('★ C4 — the consequence FIRES at the synthetic chapter boundary', () => {
  const c = consequence();
  assert.equal(shouldFire(c, { chapter: 'ch-01' }), false, 'it must not fire in its own chapter');
  assert.equal(shouldFire(c, { chapter: 'ch-02-synthetic' }), true, 'it must fire at the boundary');
});

test('★ C11 — a MUTATED fixture fails: wrong chapter, and it never arrives', () => {
  const c = consequence({ surfaces_at: { chapter: 'ch-99-does-not-exist' } });
  assert.equal(shouldFire(c, { chapter: 'ch-02-synthetic' }), false);
});

test('★ C1 — a consequence with no cause is refused; caused_by is the traceback root', () => {
  assert.throws(() => consequence({ caused_by: [] }),
    (e) => e instanceof ConsequenceRefusal && e.refusal === 'consequence-has-no-cause');
  // ...and one with a cause is accepted, so the rule is about the absence.
  assert.ok(consequence().caused_by.length === 1);
});

test('★ C9 — an unforeshadowed "you could have known" is REFUSED', () => {
  // Telling a professional they should have seen something never shown is not
  // a lesson, it is a trick.
  assert.throws(() => consequence({ player_could_have_known: true }),
    (e) => e.refusal === 'unforeshadowed-could-have-known');

  // With a foreshadowing point named, it is permitted.
  const ok = consequence({ player_could_have_known: true, foreshadowed_at: 'sc-01-02:the battery bench' });
  assert.equal(ok.foreshadowed_at, 'sc-01-02:the battery bench');
});

test('★ C10 — BOTH consequence fields are required. Neither alone', () => {
  assert.throws(() => consequence({ emotional: '   ' }), (e) => e.refusal === 'consequence-has-no-emotional-account');
  assert.throws(() => consequence({ operational: '' }), (e) => e.refusal === 'consequence-has-no-operational-account');
});

test('C6 — the seven relationship types, and only those', () => {
  assert.equal(RELATIONSHIP_TYPES.length, 7);
  assert.throws(() => consequence({ relationship: 'because-reasons' }),
    (e) => e.refusal === 'unknown-relationship-type');
});

test('C3 — a variable threshold gates firing, in both directions', () => {
  const c = consequence({
    surfaces_at: { chapter: 'ch-02-synthetic', variable_threshold: { variable: 'V5', band: 'strained' } },
  });
  assert.equal(shouldFire(c, { chapter: 'ch-02-synthetic', season: { V5: 'strong' } }), false);
  assert.equal(shouldFire(c, { chapter: 'ch-02-synthetic', season: { V5: 'critical' } }), true);
});

test('C3 — a prior-decision trigger requires that decision to have been taken', () => {
  const c = consequence({ surfaces_at: { chapter: 'ch-02-synthetic', after_decision: 'dec-01-gate-access.hold' } });
  assert.equal(shouldFire(c, { chapter: 'ch-02-synthetic', decisionsTaken: [] }), false);
  assert.equal(shouldFire(c, { chapter: 'ch-02-synthetic', decisionsTaken: ['dec-01-gate-access.hold'] }), true);
});

test('★ C7 — the traceback is COMPLETE and ORDERED, and names the originating decision', () => {
  const t = traceback(consequence({
    caused_by: ['dec-01-closure-characterization.integrated', 'dec-01-power-pressure.defer-escalation'],
    relationship: 'compound',
  }), RUN_HISTORY);

  assert.equal(t.chain.length, 2);
  // Ordered by when it happened, not by how it was stored.
  assert.deepEqual(t.chain.map((c) => c.sequence), [1, 2]);
  assert.equal(t.chain[0].optionId, 'dec-01-power-pressure.defer-escalation');
});

test('★ C11 — a BROKEN chain is refused: a cause that appears nowhere in the run', () => {
  // A chain missing its middle reads as a coincidence, and the participant is
  // right to distrust it.
  assert.throws(() => traceback(consequence({ caused_by: ['dec-never-taken'] }), RUN_HISTORY),
    (e) => e.refusal === 'traceback-chain-broken');
});

test('★ C8 — the narrative is plain language a participant can read', () => {
  const t = traceback(consequence(), RUN_HISTORY);
  assert.match(t.narrative, /the bay that went dark/, 'it names the scene, not an id');
  assert.match(t.narrative, /made this one possible/, 'it states the relationship in words');
  assert.match(t.narrative, /no way to know at the time/, 'it is honest about foreseeability');
  assert.ok(!/dec-01-|sc-01-/.test(t.narrative), 'no identifiers leak into what the player reads');
});

test('the narrative tells the truth when the player COULD have known', () => {
  const t = traceback(consequence({
    player_could_have_known: true, foreshadowed_at: 'the battery bench',
  }), RUN_HISTORY);
  assert.match(t.narrative, /visible at the time/);
  assert.match(t.narrative, /the battery bench/);
});

test('★ a consequence fires ONCE — it cannot arrive twice', () => {
  const pending = [consequence()];
  const first = fireDue(pending, { chapter: 'ch-02-synthetic' });
  assert.equal(first.fired.length, 1);
  assert.equal(first.pending.length, 0, 'a fired consequence leaves the pending list');

  const second = fireDue(first.pending, { chapter: 'ch-02-synthetic' });
  assert.equal(second.fired.length, 0);
});

test('an independent consequence says so, rather than implying a cause', () => {
  const t = traceback(consequence({ relationship: 'independent' }), RUN_HISTORY);
  assert.match(t.narrative, /not caused by that choice/,
    'claiming a link that does not exist is the same failure as hiding one that does');
});
