/**
 * ★ THE CONTENT IS VALIDATED AGAINST THE CONTRACT IT PINS. (EVS-1)
 *
 * ============================================================================
 * BEFORE THIS FILE, `citadel` PINNED A SCHEMA IT NEVER RAN.
 * ============================================================================
 * `check-repo.sh` proved the pin was an exact tag. `npm run conformance` ran
 * the contracts suite against ITSELF. Neither looked at a single scene. So
 * `scene.schema.json` could have refused every one of Chapter 1's documents and
 * every check in this repository would still have been green.
 *
 * That is the failure shape this project keeps meeting: a rule that is correct
 * and cannot fire. It is worth stating plainly what the five-repository design
 * rests on — a consumer that pins a contract and does not check itself against
 * it has bought the tag-and-pin cost and none of the safety.
 *
 * ⚠️ AJV REFUSES A SECOND `compile()` OF THE SAME `$id`. Both schemas are
 * compiled ONCE, here. Compiling inside a test made every negative case throw
 * before it asserted, which is indistinguishable from the schema being wrong —
 * that cost a debugging round on the outcome schemas already.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { CHAPTER_1 } from '../src/content/chapter-1.js';

const require = createRequire(import.meta.url);
const schema = (p) => JSON.parse(readFileSync(require.resolve(`@citadel/contracts/schemas/${p}`), 'utf8'));

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateScene = ajv.compile(schema('story/scene.schema.json'));
const validateDecision = ajv.compile(schema('story/decision.schema.json'));
// ★ EVS-6 — the runtime records the participant produces, validated against the
// same pinned contract. Compiled ONCE here, and deliberately not in the browser
// bundle: Ajv would multiply its size for a check these tests already make, and
// this audience is on slow connections.
const validateObservation = ajv.compile(schema('outcome/observation-record.schema.json'));
const validateReflection = ajv.compile(schema('outcome/reflection.schema.json'));

const copy = (o) => JSON.parse(JSON.stringify(o));

test('★ every Chapter 1 scene validates against the PINNED scene schema', () => {
  for (const scene of CHAPTER_1.scenes) {
    assert.ok(validateScene(scene), `${scene.id}: ${JSON.stringify(validateScene.errors)}`);
  }
  assert.equal(CHAPTER_1.scenes.length, 4);
});

test('★ every Chapter 1 decision validates against the PINNED decision schema', () => {
  for (const decision of CHAPTER_1.decisions) {
    assert.ok(validateDecision(decision), `${decision.id}: ${JSON.stringify(validateDecision.errors)}`);
  }
  assert.equal(CHAPTER_1.decisions.length, 4);
});

test('the pinned contract is the one this content was written for', () => {
  // A pin bumped without the content following it is the version skew the
  // whole five-repository structure exists to prevent -- and it is silent.
  //
  // ⚠️ Read from disk, not `require('@citadel/contracts/package.json')`:
  // contracts' `exports` map does not expose its own manifest, so the require
  // throws ERR_PACKAGE_PATH_NOT_EXPORTED. An installed package is not an open
  // package.
  const installed = JSON.parse(readFileSync(
    new URL('../node_modules/@citadel/contracts/package.json', import.meta.url), 'utf8'));
  assert.equal(installed.version, '0.8.0');
});

test('★ and the validation actually REFUSES — a mutated scene must fail', () => {
  // Without this, "every scene validates" is a sentence that would also be true
  // if the schema accepted anything at all.
  const s = copy(CHAPTER_1.scenes[0]);
  s.staging.pre_commit = ['orientation', 'residue'];
  assert.equal(validateScene(s), false, 'residue before commitment must not validate');

  const d = copy(CHAPTER_1.decisions[0]);
  d.options[0].effects = [{ operation: 'up', magnitude: 'moderate', delay: 'immediate', visible: true }];
  assert.equal(validateDecision(d), false, 'an untyped effect must not validate');
});

// --- EVS-6: what the participant takes away --------------------------------------

test('★ an observation this build produces validates against the PINNED schema', async () => {
  const { buildObservation } = await import('../src/engine/observation.js');
  const record = buildObservation({
    participantRef: 'p-opaque',
    answers: {
      service: 'The intensive care unit.',
      undocumentedDependency: 'One porter knows which lift takes a bed with a ventilator on it.',
      notSureAbout: 'Whether anyone else on the night shift knows that route.',
      questionToAsk: 'The portering supervisor, about Sunday nights.',
    },
  });
  assert.ok(validateObservation(record), JSON.stringify(validateObservation.errors));
});

test('★ and the schema REFUSES the boundaries — six ways', async () => {
  // Without this, "it validates" would also be true of a schema that accepted
  // anything. Each mutation is one boundary from the definition of done.
  const { buildObservation } = await import('../src/engine/observation.js');
  const base = buildObservation({
    participantRef: 'p', answers: { service: 'a', undocumentedDependency: 'b', notSureAbout: 'c', questionToAsk: 'd' },
  });

  const refused = [
    ['B1 visibility', { ...base, visibility: 'facility' }],
    ['B2 review state', { ...base, reviewState: 'approved' }],
    ['B3 recognition', { ...base, recognition: 'first-artifact' }],
    ['B4 no uncertainty', { ...base, sections: { ...base.sections, notSureAbout: undefined } }],
    ['B5 softened label', { ...base, exportLabel: 'personal preparedness observation' }],
    ['B6 unconfirmed promotion', { ...base, promotion: { confirmedByParticipant: false, correctedAt: 'x', promotedTo: 'y' } }],
  ];
  for (const [what, record] of refused) {
    assert.equal(validateObservation(record), false, `${what} was accepted by the schema`);
  }
});

test('★ a reflection validates, and a SCORED one is unrepresentable', async () => {
  const { buildReflection } = await import('../src/engine/reflection.js');
  const r = buildReflection({ participantRef: 'p', answers: { 'reflection.principle.prompt': 'Mine.' } });
  assert.ok(validateReflection(r), JSON.stringify(validateReflection.errors));

  assert.equal(validateReflection({ ...r, score: 4 }), false,
    'a number attached to a person\'s reflection about their own hospital');
  assert.equal(validateReflection({ ...r, responses: [{ promptKey: 'k', text: '' }] }), false,
    'an empty answer is not a reflection');
});
