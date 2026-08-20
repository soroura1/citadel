/**
 * ★ owner-attested-provisional — the control that does not relax. DEC-029, P8.
 *
 * Everything else on the POC path is deferred because a proof of concept has no
 * users, no data and no claims. This one exists precisely BECAUSE someone will
 * eventually see it: the moment a claim is made about reviewed content that
 * nobody reviewed, the product's honesty is gone.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { attest, canClaimApproved, isExpired, PROVISIONAL, AttestationRefusal }
  from '../src/engine/attestation.js';
import { CHAPTER_1 } from '../src/content/chapter-1.js';
import { t } from '../src/locales/index.js';

const record = JSON.parse(readFileSync(new URL('../src/content/attestation.json', import.meta.url), 'utf8'));

test('★ the shipped Chapter 1 bundle is PROVISIONAL, not approved', () => {
  assert.equal(record.state, PROVISIONAL);
  assert.equal(record.separationSatisfied, false);
  assert.equal(record.grantsApprovedAuthority, false);
});

test('★ provisional content can NEVER claim approved authority', () => {
  const verdict = canClaimApproved(record);
  assert.equal(verdict.ok, false);
  assert.equal(verdict.refusal, 'provisional-content-may-not-claim-approved');

  // ...and content with no attestation is unaffected, so the rule is about the
  // provisional state and not a blanket refusal.
  assert.equal(canClaimApproved(null).ok, true);
});

test('★ an attestation with no remediation trigger is refused', () => {
  // Without one it is a permanent exception wearing a temporary label.
  assert.throws(
    () => attest({ attestedBy: 'owner', reason: 'no reviewer', expires: '2026-12-01' }),
    (e) => e instanceof AttestationRefusal && e.refusal === 'attestation-has-no-remediation-trigger',
  );
  // The complete form is accepted.
  assert.equal(attest({
    attestedBy: 'owner', reason: 'no reviewer was available',
    remediationTrigger: 'a reviewer is named', expires: '2026-12-01',
  }).state, PROVISIONAL);
});

test('an attestation must name somebody, give a reason, and expire', () => {
  const base = { attestedBy: 'owner', reason: 'r', remediationTrigger: 't', expires: '2026-12-01' };
  for (const [field, refusal] of [
    ['attestedBy', 'attestation-names-nobody'],
    ['reason', 'attestation-gives-no-reason'],
    ['expires', 'attestation-never-expires'],
  ]) {
    assert.throws(() => attest({ ...base, [field]: undefined }), (e) => e.refusal === refusal);
  }
});

test('★ the record names WHO attested and WHY separation was unavailable', () => {
  assert.ok(record.attestedBy, 'the self-attesting owner must be named');
  assert.match(record.reason, /cannot review|self-approval/i,
    'the reason must say that separation was unavailable, not merely that review is pending');
  assert.match(record.remediationTrigger, /reviewer is named/i);
});

test('the attestation has not silently expired', () => {
  assert.equal(isExpired(record), false,
    'an expired attestation means provisional content is still being served past its stated life');
});

test('★ the label is USER-VISIBLE — it reaches the page, not only the record', async () => {
  // ⚠️ THIS WAS A GREP OF `main.jsx` FOR THE STRING "ProvisionalNotice", and it
  // failed the moment the play composition moved into `PlayRoute.jsx` — while
  // the notice still rendered. The second test in this repository pinned to an
  // implementation location rather than to behaviour; the first was
  // locale-coverage's decision-pointer check, corrected at EVS-2.
  //
  // It renders the real route now. A grep cannot tell whether a component is
  // MOUNTED, which is the whole question here.
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { PlayRoute } = await import('../src/features/play/PlayRoute.jsx');
  const { bundleFrom, startRun } = await import('../src/engine/run.js');

  const bundle = bundleFrom(CHAPTER_1);
  const run = startRun({ bundle, config: { role: 'role.resilience-lead' } });
  const html = renderToStaticMarkup(
    createElement(PlayRoute, { run, bundle, attestation: record }));

  assert.ok(html.includes(t('provisional.label')),
    'a provisional record nobody sees is a record, not a label');
  assert.ok(html.includes(t('provisional.heading')));

  const en = JSON.parse(readFileSync(new URL('../src/locales/en.json', import.meta.url), 'utf8'));
  for (const k of ['provisional.heading', 'provisional.body', 'provisional.remediation']) {
    assert.ok(en[k], `${k} is missing — the notice would render ⟨key⟩`);
  }
  assert.match(en['provisional.body'], /not been through review|does not carry approved/i,
    'the label must say plainly what the content is, not merely that it is provisional');
});

test('★ the attestation names the bundle that actually ships', () => {
  // ⚠️ NOTHING COUPLED THESE UNTIL EVS-1. `attestation.json` said `v0.1` and
  // `CHAPTER_1.version` could have said anything; an attestation naming a
  // bundle nobody plays is a control that attests to nothing, and it would
  // look completely correct in review.
  assert.equal(record.bundle, CHAPTER_1.version);
});
