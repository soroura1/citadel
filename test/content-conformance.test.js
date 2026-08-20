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
  assert.equal(installed.version, '0.6.0');
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
