/**
 * R0-C05 — PREPAREDNESS WORK, AND WHAT IT COSTS.
 *
 * ★ THE TESTS THAT MATTER HERE ARE THE ONES THAT PROVE A CHOICE HAS A PRICE.
 * XP0 had the same four projects and a `disabled` attribute; every one of these
 * would have passed vacuously against it, which is why each asserts on a
 * consequence rather than on the presence of a control.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { startRun, dispatch, dispatchAll, replay, problems } from '../src/sim/engine.js';
import { command, COMMANDS, REFUSALS } from '../src/sim/commands.js';
import { initialWorld, worldProblems } from '../src/sim/world.js';
import { PROJECTS, PROJECT_CAPACITY, PROJECT_STATES, projectRefusals, worldResources } from '../src/sim/projects.js';
import { project as projectView } from '../src/projections/project.js';
import { PreparednessPanel } from '../src/features/preparedness/PreparednessPanel.jsx';

const SEED = 20260822;
const CONFLICTING = ['power-trace', 'mobile-reserve'];      // share the service passage
const COMPATIBLE = ['restoration-ownership', 'message-route'];

const openWindow = () => dispatchAll(startRun(SEED), [
  command(COMMANDS.SET_CLOCK_MODE, { mode: 'running' }),
  command(COMMANDS.ADVANCE_CYCLE),
  command(COMMANDS.ADVANCE_CYCLE),
]);
const withProjects = (...ids) => dispatchAll(openWindow(), ids.map((id) => command(COMMANDS.SCHEDULE_PROJECT, { project: id })));
const advance = (run, n) => dispatchAll(run, Array.from({ length: n }, () => command(COMMANDS.ADVANCE_CYCLE)));
const stateOf = (run, id) => run.world.projects[id].state;

// --- content ------------------------------------------------------------------

test('the content is loadable and every project can actually be contended', () => {
  assert.deepEqual(projectRefusals(worldResources(initialWorld(SEED))), []);
  assert.equal(PROJECTS.length, 4);
  assert.ok(PROJECTS.length > PROJECT_CAPACITY, 'capacity is only a choice when there are more projects than places');
});

test('★ every project displaces something, and says what and why', () => {
  // A preparedness window in which work is free is not a window.
  for (const p of PROJECTS) {
    assert.ok(p.displaces?.what, `${p.id} displaces nothing`);
    assert.ok(p.displaces?.because, `${p.id} does not say why`);
    assert.ok(p.requires?.length, `${p.id} needs nothing`);
    assert.ok(p.verification, `${p.id} cannot be verified`);
  }
});

// --- capacity -------------------------------------------------------------------

test('★ CAPACITY IS A RULE: a third project is refused by name', () => {
  const run = withProjects('power-trace', 'restoration-ownership');
  const third = dispatch(run, command(COMMANDS.SCHEDULE_PROJECT, { project: 'message-route' }));
  assert.equal(third.lastRefusal.reason, REFUSALS.PROJECT_CAPACITY_REACHED);
  // ⛔ And the refusal changed nothing.
  assert.equal(third.world, run.world);
  assert.equal(stateOf(third, 'message-route'), 'available');
});

test('★ and the rule holds even if a surface never disabled anything', () => {
  // The command is dispatched directly, as a script or a replayed log would.
  let run = openWindow();
  for (const p of ['power-trace', 'mobile-reserve', 'restoration-ownership', 'message-route']) {
    run = dispatch(run, command(COMMANDS.SCHEDULE_PROJECT, { project: p }));
  }
  const committed = Object.values(run.world.projects).filter((e) => e.state !== 'available');
  assert.equal(committed.length, PROJECT_CAPACITY);
  assert.deepEqual(problems(run), []);
});

test('scheduling before the window opens is refused', () => {
  const early = dispatch(startRun(SEED), command(COMMANDS.SCHEDULE_PROJECT, { project: 'power-trace' }));
  assert.equal(early.lastRefusal.reason, REFUSALS.PREPARATION_WINDOW_NOT_OPEN);
});

test('an unknown project, and a project taken twice, are both refused by name', () => {
  assert.equal(dispatch(openWindow(), command(COMMANDS.SCHEDULE_PROJECT, { project: 'build-a-wall' })).lastRefusal.reason,
    REFUSALS.UNKNOWN_PROJECT);
  const run = withProjects('power-trace');
  assert.equal(dispatch(run, command(COMMANDS.SCHEDULE_PROJECT, { project: 'power-trace' })).lastRefusal.reason,
    REFUSALS.PROJECT_ALREADY_COMMITTED);
});

test('⛔ a world holding three committed projects is REFUSED, not merely unreachable', () => {
  // Capacity is an invariant of the world, not only a check at the door: a
  // reducer bug that committed a third must fail validation rather than render.
  const world = structuredClone(initialWorld(SEED));
  for (const [i, id] of ['power-trace', 'mobile-reserve', 'message-route'].entries()) {
    Object.assign(world.projects[id], { state: 'working', scheduledAt: i });
  }
  assert.ok(worldProblems(world).some((p) => p.reason === 'more-projects-committed-than-capacity-allows'));
});

// --- ★ opportunity cost: the choice has a price --------------------------------

test('★ TWO PROJECTS THAT WANT ONE RESOURCE COLLIDE, and the collision is derived', () => {
  // Nothing rolls a die and no pair is special-cased: both need the service
  // passage, and one passage cannot be in two places.
  const run = advance(withProjects(...CONFLICTING), 1);
  assert.equal(stateOf(run, 'power-trace'), 'working');
  assert.equal(stateOf(run, 'mobile-reserve'), 'disrupted');
});

test('★ the disrupted project RESUMES when the contention clears — it does not fail', () => {
  let run = advance(withProjects(...CONFLICTING), 2);
  assert.equal(stateOf(run, 'power-trace'), 'complete');
  assert.equal(stateOf(run, 'mobile-reserve'), 'working', 'the passage came free and the work did not resume');
  run = advance(run, 1);
  assert.equal(stateOf(run, 'mobile-reserve'), 'complete');
});

test('★ AND THAT IS THE COST: a conflicting pair takes longer than a compatible one', () => {
  const done = (run, pair) => pair.every((id) => ['complete', 'verified'].includes(stateOf(run, id)));
  const cyclesFor = (pair) => {
    // ⚠️ The run is frozen, deliberately — nothing may attach state to it, not
    // even a test helper. The pair is carried in the closure instead.
    let run = withProjects(...pair);
    for (let n = 1; n <= 8; n++) {
      run = advance(run, 1);
      if (done(run, pair)) return n;
    }
    return Infinity;
  };
  const conflicting = cyclesFor(CONFLICTING);
  const compatible = cyclesFor(COMPATIBLE);
  assert.ok(conflicting > compatible,
    `choosing the conflicting pair cost nothing: ${conflicting} vs ${compatible} cycles`);
  assert.equal(compatible, 2);
  assert.equal(conflicting, 3);
});

test('★ the collision is KNOWABLE BEFORE COMMITTING, not discovered afterwards', () => {
  // gameplay-and-state.md section 7: known effects are previewed fairly. A cost
  // that only appears after the choice is a trap.
  const run = withProjects('power-trace');
  const view = projectView(run);
  const reserve = view.preparedness.projects.find((p) => p.id === 'mobile-reserve');
  assert.deepEqual(reserve.contended, ['service-passage']);
  assert.equal(reserve.canSchedule, true, 'the participant may still choose it — knowing the cost');
});

// --- ★ complete is not verified --------------------------------------------------

test('★ TIME PERFORMS WORK; ONLY A RESPONSIBLE FUNCTION TESTS IT', () => {
  const run = advance(withProjects(...COMPATIBLE), 6);
  for (const id of COMPATIBLE) {
    assert.equal(stateOf(run, id), 'complete', `${id} reached a state time cannot produce`);
    assert.notEqual(stateOf(run, id), 'verified');
  }
});

test('★ verifying an unfinished project is refused by name', () => {
  const scheduled = withProjects('restoration-ownership');
  assert.equal(dispatch(scheduled, command(COMMANDS.VERIFY_PROJECT, { project: 'restoration-ownership' })).lastRefusal.reason,
    REFUSALS.NOTHING_TO_VERIFY);
});

test('★ verification records evidence with a source, a time and a confidence', () => {
  const done = advance(withProjects('restoration-ownership'), 2);
  assert.equal(stateOf(done, 'restoration-ownership'), 'complete');
  const verified = dispatch(done, command(COMMANDS.VERIFY_PROJECT, { project: 'restoration-ownership' }));

  assert.equal(stateOf(verified, 'restoration-ownership'), 'verified');
  const evidence = verified.world.evidence.find((e) => e.id === 'ev-restoration-owner');
  assert.ok(evidence, 'a verified project produced no evidence');
  assert.ok(evidence.source && evidence.confidence && evidence.accessibility);
  assert.ok(Number.isInteger(evidence.atMinute));
  assert.equal(dispatch(verified, command(COMMANDS.VERIFY_PROJECT, { project: 'restoration-ownership' })).lastRefusal.reason,
    REFUSALS.ALREADY_VERIFIED);
});

// --- displaced work --------------------------------------------------------------

test('★ THE COST APPEARS AT COMMITMENT, not when the work finishes', () => {
  const before = openWindow();
  assert.equal(before.world.residue.length, 0);
  const after = dispatch(before, command(COMMANDS.SCHEDULE_PROJECT, { project: 'power-trace' }));
  assert.equal(after.world.residue.length, 1);
  assert.match(after.world.residue[0].what, /store inspection/i);
  assert.ok(after.world.residue[0].because);
});

test('★ and displaced work PERSISTS — it is residue, not a notification', () => {
  const run = advance(withProjects(...CONFLICTING), 4);
  assert.equal(run.world.residue.length, 2);
  for (const item of run.world.residue) assert.ok(item.what && item.because && Number.isInteger(item.sinceMinute));
});

// --- determinism and chronology --------------------------------------------------

test('★ the whole preparedness sequence replays identically from the seed', () => {
  const commands = [
    command(COMMANDS.SET_CLOCK_MODE, { mode: 'running' }),
    command(COMMANDS.ADVANCE_CYCLE), command(COMMANDS.ADVANCE_CYCLE),
    command(COMMANDS.SCHEDULE_PROJECT, { project: 'power-trace' }),
    command(COMMANDS.SCHEDULE_PROJECT, { project: 'mobile-reserve' }),
    command(COMMANDS.ADVANCE_CYCLE), command(COMMANDS.ADVANCE_CYCLE), command(COMMANDS.ADVANCE_CYCLE),
    command(COMMANDS.VERIFY_PROJECT, { project: 'power-trace' }),
  ];
  const a = replay(SEED, commands), b = replay(SEED, commands);
  assert.deepEqual(a.events, b.events);
  assert.deepEqual(a.world.projects, b.world.projects);
  assert.equal(JSON.stringify(projectView(a)), JSON.stringify(projectView(b)));
});

test('★ scheduling ORDER decides the collision, and order is the participant\'s', () => {
  // Reverse the choice and the other project waits. Not a coin toss.
  const first = advance(withProjects('power-trace', 'mobile-reserve'), 1);
  const other = advance(withProjects('mobile-reserve', 'power-trace'), 1);
  assert.equal(stateOf(first, 'mobile-reserve'), 'disrupted');
  assert.equal(stateOf(other, 'power-trace'), 'disrupted');
});

test('every intermediate world stays valid through the whole window', () => {
  let run = withProjects(...CONFLICTING);
  for (let i = 0; i < 5; i++) {
    run = advance(run, 1);
    assert.deepEqual(problems(run), [], `preparedness cycle ${i + 1} produced an invalid world`);
  }
});

// --- the surface -----------------------------------------------------------------

test('★ all four projects are shown, including the two not taken', () => {
  const view = projectView(withProjects('power-trace'));
  const html = renderToStaticMarkup(createElement(PreparednessPanel, {
    preparedness: view.preparedness, residue: view.residue,
    onSchedule() {}, onVerify() {}, onAdvance() {}, canAdvance: true,
  }));
  for (const p of PROJECTS) assert.ok(html.includes(p.name), `${p.id} is not on the page`);
  assert.match(html, /1\/2 capacity/);
});

test('★ the surface states the collision, the displaced work and the untested result', () => {
  const view = projectView(advance(withProjects(...CONFLICTING), 2));
  const html = renderToStaticMarkup(createElement(PreparednessPanel, {
    preparedness: view.preparedness, residue: view.residue,
    onSchedule() {}, onVerify() {}, onAdvance() {}, canAdvance: true,
  }));
  assert.match(html, /Performed\. Not yet tested\./, 'complete was presented as finished');
  assert.match(html, /What stopped/);
  assert.match(html, /store inspection/i);
  assert.match(html, /Verify the result/);
});

test('⛔ the ladder is positions, never a percentage', () => {
  const view = projectView(advance(withProjects('restoration-ownership'), 1));
  const html = renderToStaticMarkup(createElement(PreparednessPanel, {
    preparedness: view.preparedness, residue: view.residue,
    onSchedule() {}, onVerify() {}, onAdvance() {}, canAdvance: true,
  }));
  assert.ok(!/%/.test(html.replace(/width:[^;"]*%/g, '')), 'a percentage reached the preparedness surface');
  assert.match(html, /data-step="verified"/);
  for (const s of PROJECT_STATES) assert.ok(html.includes(`data-step="${s}"`), `${s} is not on the ladder`);
});

/**
 * ⚠️ THE TWO DEFECTS THIS FILE COULD NOT SEE.
 *
 * R0-C05 shipped with 96 green tests and two rendering faults that only a
 * screenshot found:
 *
 *   1. `.prep-card` already belonged to XP0's icon/copy/mark card — a three
 *      column grid. Reusing the name auto-placed the new head/facts/note into
 *      those columns and the card became unreadable. The DOM was correct
 *      throughout, so no markup assertion could fail.
 *   2. `.visually-hidden` was used and never defined, so six state names were
 *      painted over every progress ladder.
 *
 * Fault 2 is mechanically checkable and is checked below. Fault 1 is not — a
 * collision is two valid rules — so it is carried as a naming rule instead:
 * a feature under src/features owns its own class prefix and never reuses one
 * from the XP0 bundle.
 */
test('★ THE LADDER RECORDS WHAT HAPPENED, not a range implied by where the work is now', () => {
  // A conflicting pair: the first keeps the resource, the second is stopped.
  let run = advance(withProjects(...CONFLICTING), 3);
  const [kept, stopped] = CONFLICTING;
  assert.equal(stateOf(run, kept), 'complete');
  assert.equal(stateOf(run, stopped), 'complete');

  const entered = (id) => run.world.projects[id].entered;
  // ⛔ The one that was never stopped must not claim it was.
  assert.ok(!entered(kept).includes('disrupted'),
    `${kept} completed without disruption and must not record one`);
  assert.ok(entered(stopped).includes('disrupted'),
    `${stopped} was stopped and must record it`);
  // And it resumed, so `working` follows `disrupted` in its history.
  assert.ok(entered(stopped).indexOf('working') > entered(stopped).indexOf('disrupted'));

  // The surface fills from that history, so the undisrupted card has no
  // disrupted marker reached. Filling by index would light it.
  const view = projectView(run);
  const html = renderToStaticMarkup(createElement(PreparednessPanel, {
    preparedness: view.preparedness, residue: view.residue,
    onSchedule() {}, onVerify() {}, onAdvance() {}, canAdvance: true,
  }));
  const card = html.split(`data-project="${kept}"`)[1].split('</li></ol>')[0];
  assert.ok(!/data-step="disrupted" data-reached/.test(card),
    'a project that was never disrupted must not show the disrupted rung reached');
});

test('★ the advance control has a case for FINISHED WORK, not only for none and some', () => {
  const html = (run) => {
    const view = projectView(run);
    return renderToStaticMarkup(createElement(PreparednessPanel, {
      preparedness: view.preparedness, residue: view.residue,
      onSchedule() {}, onVerify() {}, onAdvance() {}, canAdvance: view.preparedness.taken > 0,
    }));
  };
  assert.match(html(openWindow()), /Take on two pieces of work first/);
  assert.match(html(withProjects(...CONFLICTING)), /Let the work continue/);

  // Both projects complete: the window's work is finished and the clock still runs.
  const done = advance(withProjects(...CONFLICTING), 3);
  for (const id of CONFLICTING) assert.equal(stateOf(done, id), 'complete');
  const finished = html(done);
  assert.doesNotMatch(finished, /Take on two pieces of work first/,
    'a participant who completed both projects was told to choose work');
  assert.match(finished, /Let the morning continue/);
});

// Structural hooks: named by tests and aria queries, carrying no styling of
// their own. Listed so the exception is reviewed rather than silent.
const HOOKS = new Set(['preparedness']);

test('every class the R0 feature components use has a rule in the stylesheet', () => {
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  const files = ['features/preparedness/PreparednessPanel.jsx', 'features/morning/MorningControls.jsx'];
  const missing = [];
  for (const rel of files) {
    const src = readFileSync(new URL('../src/' + rel, import.meta.url), 'utf8');
    for (const m of src.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
      // A `${...}` produces a token at runtime, so the static half of
      // `state-${project.state}` is not a class and must not be checked.
      const literal = (m[1] ?? m[2]).replace(/\S*\$\{[^}]*\}\S*/g, ' ');
      for (const token of literal.split(/\s+/).filter(Boolean)) {
        if (HOOKS.has(token)) continue;
        if (!new RegExp('\\.' + token.replace(/[-]/g, '\\-') + '(?![\\w-])').test(css)) {
          missing.push(`${rel}: .${token}`);
        }
      }
    }
  }
  assert.deepEqual(missing, [], 'classes used with no rule: ' + missing.join(', '));
});
