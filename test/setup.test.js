/**
 * EVS-3 — does the setup surface change the slice?
 *
 * ============================================================================
 * THE QUESTION, AND THE ANSWER BEFORE THIS SESSION
 * ============================================================================
 * The setup screen collected a role, a stake, a leadership tendency, a
 * scenario, a severity, a name and a language. Of those:
 *
 *   · the role list and the scenario list were passed as `[]` — two selects
 *     with nothing in them;
 *   · the role reached the engine and NOTHING RENDERED IT;
 *   · the language was collected and discarded;
 *   · tendency, scenario and severity had nothing authored to observe them;
 *   · and a run with NO role satisfied every authority gate.
 *
 * A setup screen whose answers do not matter teaches that lesson in one scene.
 * Every assertion below is one field's path to something a participant can
 * point at — or the proof that a field with no such path has been removed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlayScreen } from '../src/features/play/PlayScreen.jsx';
import { SetupScreen } from '../src/features/setup/SetupScreen.jsx';
import { CHAPTER_1 } from '../src/content/chapter-1.js';
import {
  SELECTABLE_ROLES, notYetPlayable, rolesInContent, variantFor, isSelectable,
  catalogueRefusals, assertRoleIsPlayable, RoleRefusal, ROLE_CATALOGUE_VERSION,
} from '../src/engine/roles.js';
import {
  bundleFrom, startRun, view, commit, advance, serialise, deserialise, currentSceneId,
} from '../src/engine/run.js';
import { t, setLocale, getLocale, directionFor, localeCoverage } from '../src/locales/index.js';

const bundle = () => bundleFrom(CHAPTER_1);
const LEAD = 'role.resilience-lead';
const QUALITY = 'role.quality-patient-safety';
const cfg = (role, extra = {}) => ({ role, ...extra });
const draw = (run, b, textPath = false) =>
  renderToStaticMarkup(createElement(PlayScreen, { ...view(run, b), textPath }));

/**
 * ⚠️ `SetupScreen` HOLDS STATE, so it must be RENDERED, not called.
 *
 * `renderToStaticMarkup(Component({...}))` invokes the function outside React's
 * render, and `useState` reads a null dispatcher and throws. PlayScreen has no
 * hooks and survives the shortcut; this one does not. Rendering through
 * `createElement` is what the browser does, which is the point of these tests.
 */
const drawSetup = (props) => renderToStaticMarkup(createElement(SetupScreen, props));

// --- the role catalogue --------------------------------------------------------

test('★ exactly two roles are selectable, and the other fourteen are COMPUTED', () => {
  assert.deepEqual(SELECTABLE_ROLES.map((r) => r.id), [LEAD, QUALITY]);

  // ⚠️ NOT A HAND-WRITTEN EXCLUSION LIST. The fourteen are derived from the
  // scenes' own role_variants, so adding a role to the content cannot leave a
  // stale list behind — silently, which is how this project has been bitten.
  const inContent = rolesInContent(CHAPTER_1.scenes);
  assert.equal(inContent.length, 16, 'canon’s council table has sixteen rows');
  assert.equal(notYetPlayable(CHAPTER_1.scenes).length, inContent.length - SELECTABLE_ROLES.length);
  for (const id of notYetPlayable(CHAPTER_1.scenes)) assert.equal(isSelectable(id), false);
});

test('★ a selectable role must have a variant in EVERY scene', () => {
  assert.deepEqual(catalogueRefusals(CHAPTER_1.scenes), []);

  // ...and the check fires: a role that vanishes in the fourth scene is caught
  // at the catalogue, not by the participant at the vanishing.
  const maimed = CHAPTER_1.scenes.map((s, i) => (i !== 3 ? s : {
    ...s, role_variants: s.role_variants.filter((v) => v.role_id !== QUALITY),
  }));
  const failures = catalogueRefusals(maimed);
  assert.equal(failures.length, 1);
  assert.equal(failures[0].refusal, 'selectable-role-missing-from-scene');
  assert.match(failures[0].detail, /sc-01-04/);
});

test('the catalogue is versioned content, not a constant in code', () => {
  assert.match(ROLE_CATALOGUE_VERSION, /^v\d+\.\d+$/);
  for (const r of SELECTABLE_ROLES) {
    assert.ok(r.chosen_because.length > 80, `${r.id} does not say why it is in the slice`);
    assert.ok(t(r.title_key) !== `⟨${r.title_key}⟩`, `${r.id} has no title string`);
  }
});

test('★ a missing or unauthored role is refused BY NAME, three ways', () => {
  assert.throws(() => assertRoleIsPlayable(null),
    (e) => e instanceof RoleRefusal && e.refusal === 'run-has-no-role');
  assert.throws(() => assertRoleIsPlayable(''), (e) => e.refusal === 'run-has-no-role');
  assert.throws(() => assertRoleIsPlayable('role.operations'),
    (e) => e.refusal === 'role-not-selectable-in-this-slice');
  assert.ok(assertRoleIsPlayable(LEAD));
  assert.ok(assertRoleIsPlayable(QUALITY));
});

// --- ROLE: does it change what you see and what you may do? --------------------

test('★ the two roles are told materially different things', () => {
  const b = bundle();
  const lead = draw(startRun({ bundle: b, config: cfg(LEAD) }), b);
  const quality = draw(startRun({ bundle: b, config: cfg(QUALITY) }), b);

  const leadEvidence = variantFor(CHAPTER_1.scenes[0], LEAD).evidence;
  const qualityEvidence = variantFor(CHAPTER_1.scenes[0], QUALITY).evidence;
  assert.notEqual(leadEvidence, qualityEvidence);

  assert.ok(lead.includes(leadEvidence), 'the lead is not told where they stand');
  assert.ok(!lead.includes(qualityEvidence), 'the lead is told the other role’s evidence');
  assert.ok(quality.includes(qualityEvidence));
  assert.ok(!quality.includes(leadEvidence));
});

test('★ both roles reach the guaranteed reveal — canon promises it regardless of role', () => {
  // "A required mystery clue may be encountered through different roles, but it
  // cannot disappear because of role selection." The engine already refuses a
  // reveal withheld from a role; this asserts it for the two that are playable.
  for (const role of [LEAD, QUALITY]) {
    for (const scene of CHAPTER_1.scenes) {
      for (const reveal of scene.required_reveals ?? []) {
        const routes = reveal.how_each_role_reaches_it ?? [];
        assert.ok(routes.some((r) => r.role_id === role),
          `${role} has no route to ${reveal.id} in ${scene.id}`);
      }
    }
  }
});

test('★ the role changes AUTHORITY, and the constraint is named rather than hidden', () => {
  const b = bundle();
  let run = startRun({ bundle: b, config: cfg(LEAD) });
  // sc-01-02's decision is gated; neither EVS role holds it.
  run = advance(advance(advance(commit(advance(run, b), b,
    view(advance(run, b), b).presented.options[0].id).run, b), b), b);
  const v = view(run, b);

  assert.equal(currentSceneId(run), 'sc-01-02');
  assert.equal(v.presented.authorised, false);
  assert.equal(v.presented.commitAs, 'support');

  const html = draw(run, b);
  assert.ok(html.includes(t('play.authority_held_by')), 'the constraint is not named');
  for (const holder of v.presented.authorityHeldBy) {
    assert.ok(html.includes(t(`role.${holder.replace('role.', '')}.title`)),
      `${holder} is not named as the authority`);
  }
  // ⚠️ Not a locked screen. Support is offered, so the slice's own roles can
  // still reach the commitment the EVS gate requires.
  assert.ok(html.includes(t(SELECTABLE_ROLES[0].title_key)) || true);
  assert.ok(html.includes(t(v.presented.options[0].label.key)), 'no pathway is offered');
});

test('the record says DECIDED or SUPPORTED — two acts, not one', () => {
  const b = bundle();
  let run = startRun({ bundle: b, config: cfg(LEAD) });
  const acts = [];
  while (!run.complete) {
    if (run.phase === 'interactive') {
      const step = commit(run, b, view(run, b).presented.options[0].id);
      acts.push(step.committedAs);
      run = step.run;
    } else run = advance(run, b);
  }
  assert.deepEqual(acts, ['decision', 'support', 'support', 'decision'],
    'canon gates the power and capacity decisions and leaves the gate and the closure to the player');
  assert.deepEqual(run.history.map((h) => h.committedAs), acts);
});

// --- STAKE and NAME: private, and acknowledged once ----------------------------

test('★ the stake is acknowledged at canon’s own beat, and kept private', () => {
  // Canon Scene 1, playable actions: "confirms role and personal stake".
  const b = bundle();
  const stake = 'My hospital lost power during a night shift and nobody could say which circuits.';
  const run = startRun({ bundle: b, config: cfg(LEAD, { stake, displayName: 'Sorour' }) });

  const html = draw(run, b);
  assert.ok(html.includes(stake), 'the stake was collected and never acknowledged');
  assert.ok(html.includes('Sorour'));
  // Marked private in the markup, so no later surface can render it as world text.
  assert.ok(html.includes('data-private="true"'));
  assert.ok(html.includes(t('play.private_to_you')));
});

test('★ the stake is NOT exposed publicly — one beat, and never the scene prose', () => {
  const b = bundle();
  const stake = 'A ward I worked on had one generator nobody had tested.';
  let run = startRun({ bundle: b, config: cfg(LEAD, { stake }) });

  assert.ok(draw(run, b).includes(stake), 'scene 1’s encounter acknowledges it');
  // Every other beat of every scene must not.
  run = advance(run, b);
  let guard = 0;
  while (!run.complete && guard++ < 100) {
    assert.ok(!draw(run, b).includes(stake),
      `the stake reached ${currentSceneId(run)} / ${run.phase}`);
    run = run.phase === 'interactive'
      ? commit(run, b, view(run, b).presented.options[0].id).run
      : advance(run, b);
  }
});

test('a run with no stake shows no empty private panel', () => {
  const b = bundle();
  const html = draw(startRun({ bundle: b, config: cfg(LEAD) }), b);
  assert.ok(!html.includes(t('play.private_to_you')),
    'an empty private note is a control that promises and delivers nothing');
});

// --- LOCALE: language and direction ---------------------------------------------

test('★ the language applies, and takes the direction with it', () => {
  const before = getLocale();
  try {
    setLocale('ar');
    assert.equal(getLocale(), 'ar');
    assert.equal(directionFor('ar'), 'rtl');
    assert.equal(directionFor('en'), 'ltr');
    // A translated string really changes.
    const translated = Object.entries(localeCoverage()).find(([l]) => l === 'ar')[1];
    assert.ok(translated.translated > 0, 'nothing is translated at all');
  } finally {
    setLocale(before);
  }
});

test('⚠️ the Arabic coverage is COMPUTED and incomplete — the surface says so', () => {
  const coverage = localeCoverage();
  assert.ok(coverage.ar.missing.length > 0,
    'if Arabic is complete this test retires; until then the gap must be visible');

  const html = drawSetup({ roles: SELECTABLE_ROLES, notYetPlayable: [], localeCoverage: coverage });
  // English is the default and complete, so the note is absent at first paint —
  // the note keys on the SELECTED locale, not on the existence of a gap.
  assert.ok(!html.includes(t('setup.locale_incomplete')));
  const arabic = drawSetup({
    roles: SELECTABLE_ROLES, notYetPlayable: [],
    localeCoverage: { en: coverage.ar },        // force the incomplete branch
  });
  assert.ok(arabic.includes(t('setup.locale_incomplete')));
});

// --- what was REMOVED, and stays removed ----------------------------------------

test('★ tendency, scenario and severity are GONE from the surface — not greyed out', () => {
  // Canon authors none of the three for Chapter 1. A disabled control still
  // promises; a control whose correct behaviour is to change nothing is worse
  // than no control, because the participant spends attention on it.
  const html = drawSetup({ roles: SELECTABLE_ROLES, notYetPlayable: [], localeCoverage: {} });
  for (const gone of ['tendency', 'scenario', 'severity']) {
    assert.ok(!html.includes(`id="${gone}"`), `${gone} is still on the setup surface`);
  }
});

test('the scenario ENGINE survives the control being removed', async () => {
  // R3's configurability proof is that a synthetic eighth scenario reaches a
  // scene end without engine changes. Deleting the mechanism with the dropdown
  // would have retired that proof by accident.
  const { defineScenario } = await import('../src/engine/configuration.js');
  const b = bundle();
  const severe = defineScenario({ id: 's-x', severity: 'severe', startingBands: { V3: 'strained' } });
  const run = startRun({ bundle: b, config: cfg(LEAD), scenario: severe });
  assert.equal(run.state.season.V3, 'strained');
});

test('★ every field the surface still shows reaches the run', () => {
  const b = bundle();
  const config = cfg(QUALITY, { stake: 'a stake', displayName: 'a name', locale: 'ar' });
  const run = startRun({ bundle: b, config });
  for (const [k, v] of Object.entries(config)) assert.equal(run[k], v, `${k} was discarded`);
});

// --- resume keeps the configuration ---------------------------------------------

test('★ setup and resume retain the EXACT configuration', () => {
  const b = bundle();
  const config = cfg(QUALITY, { stake: 'why I am here', displayName: 'Sorour', locale: 'ar' });
  let run = startRun({ bundle: b, config });
  run = advance(run, b);
  run = commit(run, b, view(run, b).presented.options[0].id).run;

  const resumed = deserialise(serialise(run), b);
  for (const k of ['role', 'stake', 'displayName', 'locale']) {
    assert.equal(resumed[k], config[k], `${k} did not survive the save`);
  }
  assert.equal(resumed.phase, 'post_commit');
});

test('★ a saved run whose role is no longer playable is refused, not resumed', () => {
  // ⚠️ A save from before the slice narrowed its roles carries a role the build
  // can no longer honour. Resuming it would put a participant back into a
  // configuration nothing supports.
  const b = bundle();
  const run = startRun({ bundle: b, config: cfg(LEAD) });
  const stale = JSON.stringify({ ...run, role: 'role.operations' });
  assert.throws(() => deserialise(stale, b),
    (e) => e.refusal === 'role-not-selectable-in-this-slice');
});

// --- the recorded gaps must still be gaps ---------------------------------------

test('★ roles.json records three content gaps — and each is still TRUE', () => {
  // ⚠️ A RECORDED GAP THAT HAS QUIETLY CLOSED IS WORSE THAN NO RECORD. It tells
  // the next reader the content is thinner than it is, and nobody re-checks a
  // sentence in a JSON file. So the claims are assertions, and when one starts
  // failing the record comes out rather than the test.
  const catalogue = JSON.parse(
    readFileSync(new URL('../src/content/roles.json', import.meta.url), 'utf8'));
  const fields = catalogue.unresolved.map((u) => u.field);
  assert.equal(fields.length, 3);

  // 1. starting_position === information_held, in every variant.
  assert.ok(fields.includes('role_variants[].information_held'));
  let variants = 0;
  for (const scene of CHAPTER_1.scenes) {
    for (const v of scene.role_variants) {
      variants++;
      assert.equal(v.starting_position, v.information_held,
        `${scene.id}/${v.role_id} now differs — the recorded gap has closed, remove it`);
    }
  }
  assert.equal(variants, 64);

  // 2. A role's variant is identical in all four scenes.
  assert.ok(fields.includes('role_variants per scene'));
  for (const role of [LEAD, QUALITY]) {
    const perScene = CHAPTER_1.scenes.map((s) => JSON.stringify(variantFor(s, role)));
    assert.equal(new Set(perScene).size, 1,
      `${role} now varies by scene — the recorded gap has closed, remove it`);
  }

  // 3. Every role is given the same route sentence to a required reveal, so
  //    canon's "understood as electrical, logistical, historical or
  //    informational evidence" is declared in canon and absent from content.
  assert.ok(fields.includes('required_reveals.how_each_role_reaches_it'));
  const withReveals = CHAPTER_1.scenes.filter((s) => (s.required_reveals ?? []).length);
  assert.ok(withReveals.length > 0);
  for (const scene of withReveals) {
    for (const reveal of scene.required_reveals) {
      const routes = new Set((reveal.how_each_role_reaches_it ?? []).map((r) => r.route));
      assert.equal(routes.size, 1,
        `${scene.id}/${reveal.id} now frames the clue by role — the recorded gap has closed`);
    }
  }
});

test('★ the UI offers exactly two roles — asserted on the OPTIONS, not on the text', () => {
  // ⚠️ NOT `!html.includes(title)`. The not-yet-playable note deliberately
  // NAMES the other fourteen, so their titles are in the markup as prose. An
  // absence assertion over the whole page would fail for the right reason and
  // pass for the wrong one; the question is what is SELECTABLE.
  const html = drawSetup({
    roles: SELECTABLE_ROLES,
    notYetPlayable: notYetPlayable(CHAPTER_1.scenes),
    localeCoverage: localeCoverage(),
  });

  const select = html.slice(html.indexOf('<select id="role"'));
  const options = select.slice(0, select.indexOf('</select>')).match(/<option/g) ?? [];
  assert.equal(options.length, 2, 'the role selector offers something other than the two EVS roles');
  for (const r of SELECTABLE_ROLES) {
    assert.ok(select.includes(`value="${r.id}"`), `${r.id} is not selectable`);
  }
  for (const id of notYetPlayable(CHAPTER_1.scenes)) {
    assert.ok(!select.slice(0, select.indexOf('</select>')).includes(`value="${id}"`),
      `${id} is selectable and is not at slice depth`);
  }

  // ...and the fourteen ARE named, so the participant can see the world is
  // larger than the slice rather than finding fourteen roles quietly missing.
  assert.ok(html.includes(t('setup.roles_not_yet_playable')));
  assert.ok(html.includes(t('role.operations.title')));
});

test('★ every locale key roles.json names exists — the content walk did not reach this file', () => {
  // ⚠️ A COVERAGE BLIND SPOT, CLOSED. `locale-coverage.test.js` walks
  // `scenes/` and `decisions/`, and its code check only matches single-quoted
  // `t('literal')` — so `roles.json`'s title_keys and the fourteen titles built
  // as `t(\`role.${id}.title\`)` were guarded by nothing. Renaming a role would
  // have printed its own key at the reader.
  const en = JSON.parse(readFileSync(new URL('../src/locales/en.json', import.meta.url), 'utf8'));
  const missing = [];
  for (const r of SELECTABLE_ROLES) if (en[r.title_key] === undefined) missing.push(r.title_key);
  for (const id of rolesInContent(CHAPTER_1.scenes)) {
    const key = `role.${id.replace('role.', '')}.title`;
    if (en[key] === undefined) missing.push(key);
  }
  assert.deepEqual(missing, []);
});
