/**
 * R3 Phase E — the transfer weave. THE RELEASE'S REAL RISK.
 *
 * The engine is ordinary software. The weave — binding a scene decision to a
 * real capability block and carrying it into a player's own output — is the
 * product's proposition, and nobody has built one before.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveBinding, bridgePrompt, outputSection, bindingManifest, refIdentity, TransferRefusal }
  from '../src/engine/transfer.js';

// The catalogue as checklist-api actually shipped it: batch B1's real blocks.
const catalogue = {
  version: '1.0.0',
  blocks: new Map([
    ['cb-hazard-identification-001@1.0.0', { id: 'cb-hazard-identification-001', version: '1.0.0', title: { key: 'block.hazard_identification.title' } }],
    ['cb-plan-integration-001@1.0.0', { id: 'cb-plan-integration-001', version: '1.0.0', title: { key: 'block.plan_integration.title' } }],
  ]),
  block(id, v) { return this.blocks.get(`${id}@${v}`); },
};

const binding = () => ({
  from: { scene_id: 'sc-01-02', decision_id: 'dec-01-power-pressure' },
  capability_block_ref: {
    block_id: 'cb-hazard-identification-001',
    block_version: '1.0.0',
    catalogue_version: '1.0.0',
    tool_id: 'HZ-HVCA-001',      // context, never identity
  },
  to: { output_template_id: 'observation-record', section_id: 'hazards-here' },
  bridge_prompt: { key: 'bridge.hazards_in_your_hospital' },
});

test('★ E5 — ONE BINDING RESOLVES END TO END: decision → block → output section', () => {
  const resolved = resolveBinding(binding(), catalogue);
  assert.equal(resolved.resolved.block_id, 'cb-hazard-identification-001');

  const section = outputSection(resolved, {
    observation: 'Our generator transfer switch has never been tested under load.',
    decisionId: 'dec-01-power-pressure',
  });

  // The whole chain, in one object the participant takes away.
  assert.equal(section.from.scene_id, 'sc-01-02');
  assert.equal(section.capability_reference.block_id, 'cb-hazard-identification-001');
  assert.equal(section.section_id, 'hazards-here');
  assert.match(section.observation, /transfer switch/);
});

test('★ E7 — citadel awards NO capability credit. checklist-api is the sole calculator', () => {
  const section = outputSection(resolveBinding(binding(), catalogue), { observation: 'x' });

  assert.equal(section.credit, null);
  assert.equal(section.creditIsCalculatedBy, 'checklist-api');

  // Nothing anywhere in the section may look like a score. Two surfaces
  // crediting one piece of work is the parallel-credit failure: a facility
  // credited once, twice, or not at all depending which surface it opened.
  const flat = JSON.stringify(section).toLowerCase();
  for (const word of ['score', 'percent', 'complete', 'points', 'award', 'passed', 'level']) {
    assert.ok(!flat.includes(word), `the output section contains "${word}" — citadel must not credit`);
  }
});

test('★ E3 — the catalogue version is PINNED at resolution', () => {
  const resolved = resolveBinding(binding(), catalogue);
  assert.equal(resolved.resolved.catalogue_version, '1.0.0');
  // An output must mean in a year what it meant when written.
  assert.equal(refIdentity(resolved.resolved), 'cb-hazard-identification-001@1.0.0#1.0.0');
});

test('★ identity ignores tool_id — a block reached through two tools is ONE block', () => {
  const viaA = resolveBinding(binding(), catalogue);
  const b = binding();
  b.capability_block_ref.tool_id = 'SOME-OTHER-TOOL-002';
  const viaB = resolveBinding(b, catalogue);
  assert.equal(refIdentity(viaA.resolved), refIdentity(viaB.resolved),
    'a tool-scoped identity would credit one piece of work twice');
});

test('★ E2 — an unresolvable reference fails the BUILD, not the player', () => {
  const b = binding();
  b.capability_block_ref.block_id = 'cb-does-not-exist-999';
  assert.throws(() => resolveBinding(b, catalogue),
    (e) => e instanceof TransferRefusal && e.refusal === 'capability-block-not-found');

  // ...and a real one resolves, so the refusal is about the reference.
  assert.ok(resolveBinding(binding(), catalogue).resolved);
});

test('E6 — provenance travels as a REFERENCE, never a copy of the tool text', () => {
  const section = outputSection(resolveBinding(binding(), catalogue), { observation: 'x' });
  // A locale KEY, not resolved prose. A copy is a second source of truth that
  // ages alone, and the copy is the one the player keeps.
  assert.match(section.capability_reference.title_key, /^block\./);
  assert.ok(!('title' in section.capability_reference));
});

test('E4 — the bridge prompt is about THEIR hospital', () => {
  const p = bridgePrompt(binding(), (k) => `[${k}]`);
  assert.equal(p.aboutTheirHospital, true);
  assert.match(p.key, /^bridge\./);
});

test('a binding with no bridge prompt is refused — a binding that asks nothing transfers nothing', () => {
  const b = binding(); delete b.bridge_prompt;
  assert.throws(() => bridgePrompt(b), (e) => e.refusal === 'binding-has-no-bridge-prompt');
});

test('★ E8 — an unbound transfer is an HONEST state, distinguished from a broken one', () => {
  const scenes = [
    { id: 'sc-a', transfer_bindings: [binding()] },
    { id: 'sc-b', transfer_bindings: [{ from: { decision_id: 'd2' }, capability_block_ref: {} }] },
    { id: 'sc-c', transfer_bindings: [{ ...binding(), capability_block_ref: { block_id: 'cb-nope-001', block_version: '1.0.0' } }] },
  ];
  const m = bindingManifest(scenes, catalogue);

  assert.equal(m.bound.length, 1);
  assert.equal(m.unbound.length, 1, 'the catalogue is thin — not the author absent');
  assert.equal(m.unbound[0].reason, 'unbound_transfer');
  assert.equal(m.broken.length, 1, 'a NAMED block that does not resolve is a different thing entirely');
  assert.equal(m.broken[0].refusal, 'capability-block-not-found');
});

test('the manifest is computed from the scenes, never hand-maintained', () => {
  const m = bindingManifest([], catalogue);
  assert.deepEqual(m.bound, []);
  assert.deepEqual(m.unbound, []);
});
