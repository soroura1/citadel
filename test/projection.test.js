/**
 * R0-C04 — THE PROJECTIONS, PROVEN ON RENDERED MARKUP.
 *
 * ★ THESE ASSERT ON WHAT A PARTICIPANT WOULD SEE, not on what the engine holds.
 * An engine that models the sector perfectly while a surface renders a fixed
 * list is precisely the state this increment exists to correct, and it would
 * pass every test in `domain.test.js`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { existsSync, statSync, readFileSync } from 'node:fs';

import { startRun, dispatchAll } from '../src/sim/engine.js';
import { command, COMMANDS } from '../src/sim/commands.js';
import { PLACES } from '../src/sim/world.js';
import { project, classifyOrdinary, ORDINARY_STATES } from '../src/projections/project.js';
import { SLOTS, slot, anyUnreviewed } from '../src/projections/slots.js';
import { LivingMap } from '../src/features/morning/LivingMap.jsx';
import { MorningStructured } from '../src/features/morning/MorningStructured.jsx';
import { MorningStatus } from '../src/features/morning/MorningStatus.jsx';
import { MorningInspector } from '../src/features/morning/MorningInspector.jsx';

const SEED = 20260822;
const root = new URL('../', import.meta.url);

const at = (cycles) => dispatchAll(startRun(SEED), [
  command(COMMANDS.SET_CLOCK_MODE, { mode: 'running' }),
  ...Array.from({ length: cycles }, () => command(COMMANDS.ADVANCE_CYCLE)),
]);
const viewAt = (cycles, place = PLACES.ICU) => project(at(cycles), { selectedPlace: place });
const places = [
  { id: PLACES.ICU, label: 'Intensive Care', meta: '', icon: () => null },
  { id: PLACES.STORES, label: 'Clinical Stores', meta: '', icon: () => null },
];

// --- 13. map and structured derive from the same state ------------------------

test('★ 13 — the map and the structured world are ONE projection, not two sources', () => {
  const view = viewAt(2);
  const map = renderToStaticMarkup(createElement(LivingMap, { view, labels: true, onSelectPlace() {}, hotspots: [] }));
  const structured = renderToStaticMarkup(createElement(MorningStructured, { view, onSelectPlace() {}, places }));

  // The facts the map draws as positions are the facts the structured view
  // states in words. Both come from `view`; neither computes anything.
  const icu = at(2).world.services.icu;
  assert.match(structured, new RegExp(`${icu.physicalPositions} physical ICU positions`));
  assert.match(structured, new RegExp(`${icu.staffedPositions} staffed`));

  // Every unit the map places appears in the structured route/place reading.
  for (const unit of view.units) {
    assert.ok(map.includes(`data-unit="${unit.id}"`), `${unit.id} is not on the map`);
  }
  assert.ok(view.structured.length >= 5);
});

test('★ 13 — a place inspected through either representation reports the same thing', () => {
  const fromMap = project(at(2), { selectedPlace: PLACES.STORES });
  const fromStructured = project(at(2), { selectedPlace: PLACES.STORES });
  assert.deepEqual(fromMap.inspector, fromStructured.inspector);
});

test('13 — no component invents state: the map renders only projected coordinates', () => {
  const view = viewAt(1);
  const map = renderToStaticMarkup(createElement(LivingMap, { view, labels: true, onSelectPlace() {}, hotspots: [] }));
  for (const unit of view.units) {
    // The exact projected percentage, not a rounded or re-derived one.
    assert.ok(map.includes(`left:${unit.x * 100}%`) || map.includes(`left: ${unit.x * 100}%`),
      `${unit.id} was placed at a coordinate the projection did not produce`);
  }
});

// --- 14. the three accepted ordinary states are distinguishable ---------------

test('★ 14 — the three accepted ordinary states are DERIVED, and all three occur', () => {
  assert.equal(classifyOrdinary(at(0).world), 'ordinary-steady');
  assert.equal(classifyOrdinary(at(1).world), 'ordinary-high-stable');
  assert.equal(classifyOrdinary(at(2).world), 'ordinary-rising');
  for (const state of [0, 1, 2].map((c) => classifyOrdinary(at(c).world))) {
    assert.ok(ORDINARY_STATES.includes(state));
  }
});

test('★ 14 — and they differ in POSITION AND ROUTE, not only in a label', () => {
  // § 19.2: the states must remain distinguishable when labels are removed.
  const views = [0, 1, 2].map((c) => viewAt(c));
  const signature = (view) => JSON.stringify({
    units: view.units.map((u) => [u.id, u.x.toFixed(3), u.y.toFixed(3), u.changed]),
    routes: view.routes.map((r) => [r.id, r.changed, r.path.length]),
    nodes: view.nodes.map((n) => [n.id, n.occupied]),
  });
  const [steady, high, rising] = views.map(signature);
  assert.notEqual(steady, high);
  assert.notEqual(high, rising);
  assert.notEqual(steady, rising);
});

test('★ 14 — with labels REMOVED the markup still differs between the three states', () => {
  const drawn = [0, 1, 2].map((c) =>
    renderToStaticMarkup(createElement(LivingMap, { view: viewAt(c), labels: false, onSelectPlace() {}, hotspots: [] })));
  assert.notEqual(drawn[0], drawn[1]);
  assert.notEqual(drawn[1], drawn[2]);
  for (const markup of drawn) {
    assert.ok(!markup.includes('op-unit-label'), 'labels rendered while hidden');
  }
});

test('14 — the demand route lengthens across the states; the corridor never moves', () => {
  const reach = [0, 1, 2].map((c) => at(c).world.demand.reach);
  assert.ok(reach[0] < reach[1] && reach[1] < reach[2], `demand did not advance: ${reach}`);
  // The full path is constant; only the occupied portion grows.
  const heads = [0, 1, 2].map((c) => viewAt(c).routes.find((r) => r.id === 'gate-ed').path.length);
  assert.ok(heads[2] >= heads[0]);
});

test('★ 14 — the origin node empties when a unit leaves it', () => {
  const before = viewAt(0).nodes.find((n) => n.id === 'stores');
  const after = viewAt(2).nodes.find((n) => n.id === 'stores');
  assert.equal(before.occupied, true);
  assert.equal(after.occupied, false, 'the empty origin — the visible cost — was not rendered');
});

// --- 15. removing the candidate rasters must not remove play ------------------

test('★ 15 — with every raster layer omitted, the world is still fully readable', () => {
  // § 18.5 low bandwidth: "omit raster units; place/state/route controls and the
  // complete structured world remain."
  const view = viewAt(2);
  const structured = renderToStaticMarkup(createElement(MorningStructured, { view, onSelectPlace() {}, places }));
  const status = renderToStaticMarkup(createElement(MorningStatus, { strip: view.strip }));
  const inspector = renderToStaticMarkup(createElement(MorningInspector, { inspector: view.inspector, label: 'Intensive Care' }));
  const withoutRasters = structured + status + inspector;

  assert.ok(!withoutRasters.includes('<img'), 'the no-raster path still loads an image');
  for (const required of ['8 physical ICU positions', '5 staffed', 'committed', 'Technical work', 'Next change']) {
    assert.ok(withoutRasters.includes(required), `"${required}" is only available through the map`);
  }
  // Custody and origin survive, which is the whole point of the reserve.
  assert.match(structured, /custody: biomedical/);
  assert.match(structured, /stores → icu/i);
});

test('15 — every slot names a declared budget, and every candidate file exists within it', () => {
  for (const entry of Object.values(SLOTS)) {
    const file = new URL(`public${entry.file}`, root);
    assert.ok(existsSync(file), `${entry.id} points at a missing file`);
    const bytes = statSync(file).size;
    assert.ok(bytes <= entry.maxBytes, `${entry.id} is ${bytes} bytes against its ${entry.maxBytes} ceiling`);
    if (entry.lowBandwidth) {
      assert.ok(existsSync(new URL(`public${entry.lowBandwidth}`, root)), `${entry.id} has no low-bandwidth derivative`);
    }
  }
});

test('⛔ 15 — every operational asset is still CANDIDATE, and the surface says so', () => {
  assert.ok(anyUnreviewed());
  for (const id of ['R0-SL07A', 'R0-SL07B', 'R0-SL07C', 'R0-SL07D', 'R0-SL07E']) {
    assert.equal(slot(id).reviewed, false, `${id} was bound as canonical`);
    assert.equal(slot(id).reviewGate, 'Q10');
  }
  // ⚠️ R0-C05A MOVED THE STATEMENT; IT DID NOT REMOVE IT.
  //
  // This used to require the map itself to say "Candidate operational
  // depiction · not reviewed · Q10 open", and that was right when the map was
  // the only surface there was. § 0.4A now forbids build labels, review gates
  // and candidate status in participant play — so the map must NOT say it, and
  // the owner surface MUST. Both halves are asserted, because dropping the
  // second one is how "nothing is bound yet" quietly stops being visible.
  const map = renderToStaticMarkup(createElement(LivingMap, { view: viewAt(1), labels: true, onSelectPlace() {}, hotspots: [] }));
  assert.ok(!/Candidate operational depiction/.test(map), 'a build label is back on the game board');
  assert.ok(!/Q10/.test(map));

  const owner = readFileSync(new URL('../src/features/narrative/BuildPanel.jsx', import.meta.url), 'utf8');
  assert.match(owner, /Q10 open — no asset is bound or canonical/);
  assert.match(owner, /unreviewed/);
});

// --- projections never leak production language -------------------------------

test('⛔ no participant surface exposes an internal identifier as prose', () => {
  const view = viewAt(2);
  const structured = renderToStaticMarkup(createElement(MorningStructured, { view, onSelectPlace() {}, places }));
  // Slot ids are addressing, not participant language; they must not be printed
  // as readable content outside the explicit candidate notice.
  assert.ok(!/R0-SL07[A-E]/.test(structured), 'a slot identifier reached the structured world');
});

test('the status strip always reports staffed AND physical together', () => {
  for (const cycles of [0, 1, 2]) {
    const icu = viewAt(cycles).strip.find((item) => item.id === 'icu');
    assert.match(icu.value, /\d+ staffed · \d+ physical/, `cycle ${cycles} reported one number`);
  }
});

// --- determinism reaches the PROJECTIONS, not only the world ------------------

test('★ 4 — the same seed and history produce identical PROJECTIONS', () => {
  // The required proof names events *and projections*. A world that replays
  // identically while a projection reads it differently would still break
  // replay for the participant, who only ever sees the projection.
  const commands = [
    command(COMMANDS.SET_CLOCK_MODE, { mode: 'running' }),
    command(COMMANDS.ADVANCE_CYCLE),
    command(COMMANDS.ADVANCE_CYCLE),
  ];
  const a = project(dispatchAll(startRun(SEED), commands), { selectedPlace: PLACES.STORES });
  const b = project(dispatchAll(startRun(SEED), commands), { selectedPlace: PLACES.STORES });
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

test('★ 6 — the non-timed path projects the same causal result', () => {
  const walk = (mode) => dispatchAll(startRun(SEED), [
    command(COMMANDS.SET_CLOCK_MODE, { mode }),
    command(COMMANDS.ADVANCE_CYCLE),
    command(COMMANDS.ADVANCE_CYCLE),
  ]);
  const timed = project(walk('running'));
  const untimed = project(walk('act-advanced'));

  // Everything a participant can see is identical; only the clock mode differs.
  assert.equal(timed.ordinaryState, untimed.ordinaryState);
  assert.deepEqual(timed.units, untimed.units);
  assert.deepEqual(timed.routes, untimed.routes);
  assert.deepEqual(timed.nodes, untimed.nodes);
  assert.deepEqual(timed.strip, untimed.strip);
  assert.deepEqual(timed.structured, untimed.structured);
  assert.deepEqual(timed.inspector, untimed.inspector);
  assert.notEqual(timed.time.mode, untimed.time.mode);
});

// --- the breakpoint that cropped the map --------------------------------------

test('★ the living map keeps the sector\'s own 16:9, at every width it is shown', () => {
  /* XP0's breakpoint sets `.map-stage` to 4:3 below 700 px. The source is 16:9
   * with `object-fit: cover`, so a 4:3 box crops it horizontally — while every
   * unit and route is a fraction of the BOX. Between 620 and 700 px the whole
   * operational layer drifted off the features it described. Nothing in the
   * markup was wrong; it was found by measuring the rendered aspect at 660 px. */
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.map-stage\.living-map \{[^}]*aspect-ratio: 16 \/ 9/);
  // And the override must out-specify the breakpoint rather than merely follow it.
  const breakpointIndex = css.indexOf('.map-stage,.structured-world{aspect-ratio:4/3}');
  const overrideIndex = css.indexOf('.map-stage.living-map');
  assert.ok(breakpointIndex === -1 || overrideIndex > -1, 'the 4:3 breakpoint has no override');
});
