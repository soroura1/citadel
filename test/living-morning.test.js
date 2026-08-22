/**
 * R0-I1 — THE PARTICIPANT JOURNEY, AND THE XP0 WALK THAT MUST SURVIVE IT.
 *
 * ★ § 0.4 OF THE LEDGER: an increment "must not merge as a checkpoint until it
 * produces a visible, playable improvement", and "the current pilot remains
 * usable throughout". Both halves are asserted here: the morning is new, and
 * nothing that already worked stopped working.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';

import { startRun, dispatch, dispatchAll } from '../src/sim/engine.js';
import { command, COMMANDS } from '../src/sim/commands.js';
import { project } from '../src/projections/project.js';
import { MorningControls } from '../src/features/morning/MorningControls.jsx';
import { MorningChanges } from '../src/features/morning/MorningChanges.jsx';
import { App } from '../src/App.jsx';

const SEED = 20260822;
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const at = (cycles) => dispatchAll(startRun(SEED), [
  command(COMMANDS.SET_CLOCK_MODE, { mode: 'running' }),
  ...Array.from({ length: cycles }, () => command(COMMANDS.ADVANCE_CYCLE)),
]);

// --- 16. the existing XP0 walk remains functional -----------------------------

test('★ 16 — every XP0 phase still exists, and `prepare` was inserted, not substituted', () => {
  const source = read('src/App.jsx');
  for (const phase of ['operate', 'prepare', 'incident', 'recovery', 'debrief']) {
    assert.match(source, new RegExp(`${phase}:`), `missing ${phase}`);
  }
  // The XP0 acceptance strings that the prototype's own test protects.
  assert.match(source, /selected\.length !== 2/);
  assert.match(source, /Commit within authority/);
  assert.match(source, /Which essential service in your own hospital/);
});

test('★ 16 — the application still renders from setup, with the safety boundary', () => {
  const markup = renderToStaticMarkup(createElement(App));
  assert.match(markup, /Enter the morning shift/);
  assert.match(markup, /Preparedness exercise only/i);
  assert.match(markup, /not live incident command/i);
});

test('16 — the preparedness panel is unchanged: four projects, capacity for two', () => {
  const source = read('src/App.jsx');
  for (const project of ['Trace the critical-power path', 'Stage the mobile reserve', 'Clarify restoration ownership', 'Test the message route']) {
    assert.ok(source.includes(project), `${project} was lost`);
  }
  assert.match(source, /\{selected\.length\}\/2 capacity/);
});

// --- the participant journey ---------------------------------------------------

test('★ the morning is PLAYABLE: two cycles, then the window, through commands only', () => {
  let run = startRun(SEED);
  assert.equal(project(run).status, 'ordinary');

  // Nothing moves until the participant starts time.
  run = dispatch(run, command(COMMANDS.ADVANCE_CYCLE));
  assert.ok(run.lastRefusal);

  run = dispatch(run, command(COMMANDS.SET_CLOCK_MODE, { mode: 'running' }));
  run = dispatch(run, command(COMMANDS.ADVANCE_CYCLE));
  assert.equal(project(run).ordinaryState, 'ordinary-high-stable');
  assert.equal(project(run).status, 'ordinary');

  run = dispatch(run, command(COMMANDS.ADVANCE_CYCLE));
  assert.equal(project(run).ordinaryState, 'ordinary-rising');
  assert.equal(project(run).status, 'preparation-window');
});

test('★ each cycle explains ITSELF: every change carries what and why', () => {
  const view = project(at(1));
  assert.ok(view.changes.length >= 4, 'a cycle passed with almost nothing to report');
  for (const change of view.changes) {
    assert.ok(change.changed, 'a change with no subject');
    assert.ok(change.because, `"${change.changed}" changed for no stated reason`);
  }
  const markup = renderToStaticMarkup(createElement(MorningChanges, { changes: view.changes, cycle: 1 }));
  assert.match(markup, /aria-live="polite"/);
  assert.match(markup, /ED demand/);
});

test('★ the non-timed control sits beside pause and speed, available to everyone', () => {
  const view = project(at(0));
  const markup = renderToStaticMarkup(createElement(MorningControls, {
    view, onMode() {}, onSpeed() {}, onAdvance() {}, labels: true, onLabels() {},
  }));
  assert.match(markup, /Advance one cycle/);
  assert.match(markup, /Pause|Resume/);
  assert.match(markup, /×1/);
  // Not tucked into a settings panel or an accessibility menu.
  assert.match(markup, /role="group" aria-label="Fictional time controls"/);
});

test('★ a paused morning SAYS it is paused, and its advance control is disabled', () => {
  const view = project(startRun(SEED));            // starts paused
  const markup = renderToStaticMarkup(createElement(MorningControls, {
    view, onMode() {}, onSpeed() {}, onAdvance() {}, labels: true, onLabels() {},
  }));
  assert.match(markup, /paused/);
  assert.match(markup, /disabled=""/);
});

test('⛔ a refusal is shown to the participant, never swallowed', () => {
  const refused = dispatch(startRun(SEED), command(COMMANDS.ADVANCE_CYCLE));
  const view = project(refused);
  const markup = renderToStaticMarkup(createElement(MorningControls, {
    view, onMode() {}, onSpeed() {}, onAdvance() {}, labels: true, onLabels() {},
  }));
  assert.match(markup, /Not permitted/);
  assert.match(markup, /fictional time is paused/);
});

// --- accessibility floor --------------------------------------------------------

test('★ no positive tabindex, and every control is a real button', () => {
  const view = project(at(2));
  const markup = renderToStaticMarkup(createElement(MorningControls, {
    view, onMode() {}, onSpeed() {}, onAdvance() {}, labels: true, onLabels() {},
  }));
  assert.ok(!/tabindex="[1-9]/.test(markup), 'a positive tabindex reorders the page for everyone');
  assert.ok(!/<div[^>]*onClick/.test(markup), 'an interactive div is not reachable by keyboard');
  assert.match(markup, /<button/);
});

test('★ the map layer is hidden from assistive technology because the words carry it', () => {
  const source = read('src/features/morning/RouteLayer.jsx');
  assert.match(source, /aria-hidden="true"/);
  // The structured world is what a screen reader reads, and it is always
  // rendered — not produced only when the map is switched off.
  const app = read('src/App.jsx');
  assert.match(app, /!structured && <MorningStructured/);
});

test('★ reduced motion keeps the state change and removes only the travel', () => {
  const css = read('src/styles.css');
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  const block = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(block, /\.op-unit[^}]*transition: opacity/);
});

test('★ at a narrow viewport the map yields and the structured world remains', () => {
  const css = read('src/styles.css');
  const narrow = css.slice(css.indexOf('@media (max-width: 620px)'));
  assert.match(narrow, /\.living-map \{ display: none/);
  assert.ok(!/\.structured-world[^}]*display: none/.test(narrow), 'the structured world was hidden too');
});

test('⛔ the stylesheet decides no position — that would be a second simulation', () => {
  const css = read('src/styles.css');
  const block = css.slice(css.indexOf('R0-I1 — THE LIVING MORNING'));
  assert.ok(!/\.op-unit\[data-unit=/.test(block), 'a per-unit position rule exists in CSS');
});

// --- 17. the boundary, at the surface -------------------------------------------

test('⛔ 17 — no participant surface offers a clinical or live-command act', () => {
  const sources = [
    'src/App.jsx', 'src/features/morning/MorningControls.jsx',
    'src/features/morning/LivingMap.jsx', 'src/features/morning/MorningStructured.jsx',
    'src/features/morning/MorningInspector.jsx',
  ].map(read).join('\n');
  for (const forbidden of ['triage', 'prescribe', 'diagnos', 'dispatch ambulance', 'call the', 'admit patient']) {
    assert.ok(!new RegExp(forbidden, 'i').test(sources), `a surface offers "${forbidden}"`);
  }
});
