#!/usr/bin/env node
/**
 * ★ THE AUTOMATED HALF OF THE EVS EVIDENCE PACK — GENERATED, NEVER TYPED.
 *
 * ============================================================================
 * WHY THIS IS A SCRIPT AND NOT A SECTION OF A DOCUMENT
 * ============================================================================
 * An evidence pack with hand-written counts is stale the first time somebody
 * adds a test, and the person reading it a month later has no way to tell.
 * `citadel-planning/check-plan.sh` refuses a written test count in a normative
 * document for exactly that reason — *"current truth about a test count comes
 * from running the tests."*
 *
 * So the planning document carries what only a person can supply — the
 * participant protocol, the observation sheet, the eight human dimensions and
 * the limitations — and this produces what only a machine should:
 *
 *   ./scripts/evidence-pack.mjs            # human-readable
 *   ./scripts/evidence-pack.mjs --json     # for a report or a CI artefact
 *
 * ⛔ IT CERTIFIES NOTHING ABOUT THE GATE. Software cannot establish
 * comprehension, emotion, agency, operational credibility or transfer intent.
 * Every line below is a fact about the build.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const json = (p) => JSON.parse(read(p));

const git = (...args) => {
  try { return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim(); }
  catch { return null; }
};

// --- what was built ----------------------------------------------------------
const pkg = json('package.json');
const chapter = /version:\s*'([^']+)'/.exec(read('src/content/chapter-1.js'))?.[1] ?? null;
const attestation = json('src/content/attestation.json');
const places = json('src/content/places.json');

const build = {
  commit: git('rev-parse', 'HEAD'),
  branch: git('rev-parse', '--abbrev-ref', 'HEAD'),
  // ⚠️ A dirty tree means the evidence describes something not in the history.
  clean: git('status', '--porcelain') === '',
  node: process.version,
  contractsPin: pkg.dependencies['@citadel/contracts'],
  bundleVersion: chapter,
  attestation: {
    state: attestation.state,
    bundle: attestation.bundle,
    grantsApprovedAuthority: attestation.grantsApprovedAuthority,
    expires: attestation.expires,
  },
};

// --- the tests, run ----------------------------------------------------------
function runTests() {
  try {
    const out = execFileSync('npm', ['test'],
      { cwd: root, encoding: 'utf8', env: { ...process.env }, stdio: ['ignore', 'pipe', 'pipe'] });
    return parse(out);
  } catch (e) {
    // node --test exits non-zero on failure; the summary is still on stdout.
    return { ...parse(`${e.stdout ?? ''}${e.stderr ?? ''}`), failed: true };
  }
}
const parse = (out) => {
  const clean = out.replace(/\[[0-9;]*m/g, '');
  const n = (label) => Number(/^ℹ\s+(?:tests|pass|fail|suites)\s+(\d+)$/m
    .exec(clean.split('\n').filter((l) => l.startsWith(`ℹ ${label}`)).join('\n'))?.[1] ?? NaN);
  const grab = (label) => {
    const line = clean.split('\n').find((l) => l.trim().startsWith(`ℹ ${label} `));
    return line ? Number(line.trim().split(/\s+/)[2]) : null;
  };
  void n;
  return { tests: grab('tests'), pass: grab('pass'), fail: grab('fail'), suites: grab('suites') };
};

// --- the weight a participant downloads --------------------------------------
function bundleBytes() {
  const dist = join(root, 'dist/assets');
  if (!existsSync(dist)) return null;
  const out = {};
  for (const f of readdirSync(dist)) {
    const ext = f.endsWith('.js') ? 'js' : f.endsWith('.css') ? 'css' : null;
    if (ext) out[ext] = (out[ext] ?? 0) + statSync(join(dist, f)).size;
  }
  const images = join(root, 'public/scenes');
  out.images = existsSync(images)
    ? readdirSync(images).reduce((n, f) => n + statSync(join(images, f)).size, 0)
    : 0;
  return out;
}

// --- what is translated, and what is not -------------------------------------
const en = json('src/locales/en.json');
const ar = json('src/locales/ar.json');
const locales = {
  keys: Object.keys(en).length,
  ar: Object.keys(en).filter((k) => ar[k] !== undefined).length,
};

// --- what is bound, and what is not ------------------------------------------
const scenes = readdirSync(join(root, 'src/content/scenes'))
  .map((f) => json(`src/content/scenes/${f}`));
const slots = [...scenes.flatMap((s) => s.asset_slots ?? []), places.plan_slot];
const assets = {
  slots: slots.length,
  withCandidate: slots.filter((s) => s.candidate_ref).length,
  withFile: slots.filter((s) => s.candidate_file).length,
  inclusionReviewed: slots.filter((s) => s.inclusion_reviewed).length,
  overBudget: slots.filter((s) => {
    if (!s.candidate_file) return false;
    const p = join(root, 'public', s.candidate_file);
    return existsSync(p) && statSync(p).size > s.max_bytes;
  }).map((s) => s.id),
};

// --- what the slice contains -------------------------------------------------
const content = {
  scenes: scenes.length,
  actions: scenes.reduce((n, s) => n + (s.actions?.length ?? 0), 0),
  evidence: scenes.reduce((n, s) => n + (s.evidence?.length ?? 0), 0),
  locations: places.locations.length,
  selectableRoles: json('src/content/roles.json').evs_selectable.length,
  rolesInContent: new Set(scenes.flatMap((s) => s.role_variants.map((v) => v.role_id))).size,
};

const pack = { generatedFrom: 'repos/citadel', build, tests: runTests(), bundleBytes: bundleBytes(), locales, assets, content };

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(pack, null, 2));
  process.exit(pack.tests.fail ? 1 : 0);
}

const kb = (n) => (n == null ? '—' : `${(n / 1024).toFixed(1)} KB`);
console.log(`
EVS EVIDENCE — AUTOMATED SECTION
================================
⛔ This certifies NOTHING about the gate. Software cannot establish
   comprehension, emotion, agency, operational credibility or transfer intent.
   Those eight dimensions are human evidence, and they are still owed.

BUILD
  commit            ${build.commit}${build.clean ? '' : '   ⚠️ WORKING TREE DIRTY'}
  branch            ${build.branch}
  node              ${build.node}
  contracts         ${build.contractsPin}
  content bundle    ${build.bundleVersion}
  attestation       ${build.attestation.state} (bundle ${build.attestation.bundle}, expires ${build.attestation.expires})
                    grants approved authority: ${build.attestation.grantsApprovedAuthority}

TESTS               ${pack.tests.pass}/${pack.tests.tests} passing, ${pack.tests.fail} failing, ${pack.tests.suites} suites

WEIGHT A PARTICIPANT DOWNLOADS
  javascript        ${kb(pack.bundleBytes?.js)}
  css               ${kb(pack.bundleBytes?.css)}
  images            ${kb(pack.bundleBytes?.images)}
  ⚠️ There is no declared JavaScript budget. Q24 covers images only.

LANGUAGE
  keys              ${locales.keys}
  arabic            ${locales.ar} translated — the rest fall back to English
  ⚠️ The slice COMPLETES in Arabic. It is not TRANSLATED into Arabic.

VISUAL BINDING
  asset slots       ${assets.slots}
  with a candidate  ${assets.withCandidate}
  with a file       ${assets.withFile}
  inclusion reviewed ${assets.inclusionReviewed}   ⛔ blocked by Q10
  over budget       ${assets.overBudget.length === 0 ? 'none' : assets.overBudget.join(', ')}

THE SLICE
  scenes            ${content.scenes}
  actions           ${content.actions}
  evidence          ${content.evidence}
  locations         ${content.locations}
  roles playable    ${content.selectableRoles} of ${content.rolesInContent} in the content
`);
process.exit(pack.tests.fail ? 1 : 0);
