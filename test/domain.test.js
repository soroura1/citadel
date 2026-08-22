/**
 * R0-C01/C02/C03 — THE DOMAIN, PROVEN BY REFUSAL AND BY REPLAY.
 *
 * ★ EVERY INVARIANT IS TESTED BY BREAKING IT. A validator that has never been
 * watched refusing anything is a validator nobody knows is wired up — this
 * repository has shipped several, each correct and each keying on something
 * that was never present.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { initialWorld, worldProblems, validateWorld, WorldRefusal, PLACES } from '../src/sim/world.js';
import { startRun, dispatch, dispatchAll, replay, problems } from '../src/sim/engine.js';
import { command, COMMANDS, REFUSALS, SPEEDS } from '../src/sim/commands.js';
import { EVENTS, assertChronological, ChronologyRefusal } from '../src/sim/events.js';
import { ORDINARY_CYCLES } from '../src/sim/clock.js';

const SEED = 20260822;
const run0 = () => startRun(SEED);
const running = () => dispatch(run0(), command(COMMANDS.SET_CLOCK_MODE, { mode: 'running' }));
const wholeMorning = (mode = 'running') => dispatchAll(run0(), [
  command(COMMANDS.SET_CLOCK_MODE, { mode }),
  command(COMMANDS.ADVANCE_CYCLE),
  command(COMMANDS.ADVANCE_CYCLE),
]);

// --- 1. invalid domain state is refused ---------------------------------------

test('★ 1 — the opening world is valid, so every refusal below means something', () => {
  assert.deepEqual(worldProblems(initialWorld(SEED)), []);
});

test('★ 1 — staffed capacity above physical capacity is REFUSED', () => {
  // Staffing a position that does not physically exist.
  const world = structuredClone(initialWorld(SEED));
  world.services.icu.staffedPositions = 12;
  const reasons = worldProblems(world).map((p) => p.reason);
  assert.ok(reasons.includes('staffed-capacity-exceeds-physical-capacity'));
  assert.throws(() => validateWorld(world), (e) => e instanceof WorldRefusal);
});

test('★ 1 — a world carrying a patient-level record is REFUSED on its SHAPE', () => {
  // The safety boundary is checked structurally, not by intent. A `patients`
  // array would arrive as a convenience and would change what this product is
  // permitted to claim.
  for (const forbidden of ['patients', 'cases', 'treatments', 'diagnoses']) {
    const world = { ...structuredClone(initialWorld(SEED)), [forbidden]: [] };
    assert.ok(worldProblems(world).some((p) => p.reason === 'patient-level-record-in-the-world'),
      `${forbidden} was accepted`);
  }
});

test('★ 1 — a world carrying a score is REFUSED', () => {
  for (const forbidden of ['score', 'readiness', 'resilienceScore', 'rank']) {
    const world = { ...structuredClone(initialWorld(SEED)), [forbidden]: 1 };
    assert.ok(worldProblems(world).some((p) => p.reason === 'score-in-the-world'), `${forbidden} was accepted`);
  }
});

test('1 — a seed that is not a non-negative integer is refused', () => {
  for (const bad of [-1, 1.5, 'seed', null, undefined]) {
    assert.throws(() => initialWorld(bad), (e) => e.reason === 'seed-must-be-a-non-negative-integer');
  }
});

// --- 2. invalid commands are refused with named reasons -----------------------

test('★ 2 — an unknown command is refused BY NAME', () => {
  const refused = dispatch(run0(), command('fly-the-hospital'));
  assert.equal(refused.lastRefusal.reason, REFUSALS.UNKNOWN_COMMAND);
});

test('★ 2 — every refusal reason is registered, never invented at the call site', () => {
  const registered = new Set(Object.values(REFUSALS));
  const cases = [
    command('nonsense'),
    command(COMMANDS.SET_CLOCK_MODE, { mode: 'sideways' }),
    command(COMMANDS.SET_SPEED, { speed: 99 }),
    command(COMMANDS.ADVANCE_CYCLE),
    command(COMMANDS.INSPECT_PLACE, { place: 'atlantis' }),
    command(COMMANDS.OPEN_PREPARATION_WINDOW),
  ];
  for (const cmd of cases) {
    const refused = dispatch(run0(), cmd);
    assert.ok(refused.lastRefusal, `${cmd.type} was permitted`);
    assert.ok(registered.has(refused.lastRefusal.reason), `unregistered reason: ${refused.lastRefusal.reason}`);
  }
});

test('2 — speed outside the bounded set is refused; every bounded speed is accepted', () => {
  const base = running();
  assert.equal(dispatch(base, command(COMMANDS.SET_SPEED, { speed: 64 })).lastRefusal.reason, REFUSALS.SPEED_OUT_OF_BOUNDS);
  for (const speed of SPEEDS) {
    assert.equal(dispatch(base, command(COMMANDS.SET_SPEED, { speed })).lastRefusal, null);
  }
});

// --- 3. refused commands do not mutate state ----------------------------------

test('★ 3 — a refused command returns the SAME world object, not an equal one', () => {
  // Identity, not deep equality: a stray mutation that produced a structurally
  // identical object would pass a deepEqual and fail this.
  const before = running();
  const after = dispatch(before, command(COMMANDS.SET_SPEED, { speed: 99 }));
  assert.equal(after.world, before.world, 'the world was replaced on a refusal');
  assert.equal(after.world.time.speed, before.world.time.speed);
});

test('★ 3 — but the refusal itself is RECORDED; a refusal is something that happened', () => {
  const after = dispatch(run0(), command(COMMANDS.ADVANCE_CYCLE));
  const last = after.events.at(-1);
  assert.equal(last.type, EVENTS.COMMAND_REFUSED);
  assert.equal(last.reason, REFUSALS.CANNOT_ADVANCE_WHILE_PAUSED);
});

// --- 4. determinism -----------------------------------------------------------

test('★ 4 — the same seed and command history produce identical events and state', () => {
  const commands = [
    command(COMMANDS.SET_CLOCK_MODE, { mode: 'running' }),
    command(COMMANDS.SET_SPEED, { speed: 2 }),
    command(COMMANDS.ADVANCE_CYCLE),
    command(COMMANDS.INSPECT_PLACE, { place: PLACES.UNDERWORKS }),
    command(COMMANDS.ADVANCE_CYCLE),
  ];
  const a = replay(SEED, commands);
  const b = replay(SEED, commands);
  assert.deepEqual(a.events, b.events);
  assert.deepEqual(a.world, b.world);
});

test('4 — a different seed produces a materially different morning, still valid', () => {
  const commands = [command(COMMANDS.SET_CLOCK_MODE, { mode: 'running' }), command(COMMANDS.ADVANCE_CYCLE)];
  const a = replay(SEED, commands);
  const b = replay(SEED + 1, commands);
  assert.notDeepEqual(a.world.demand.reach, b.world.demand.reach, 'the seed changed nothing');
  assert.deepEqual(problems(b), []);
});

test('★ 4 — bounded variation never crosses a band boundary', () => {
  // "Randomness never removes required evidence or makes rules unknowable."
  // Whatever the seed, cycle one is high-stable and cycle two is rising.
  for (let seed = 0; seed < 40; seed++) {
    const run = dispatchAll(startRun(seed), [
      command(COMMANDS.SET_CLOCK_MODE, { mode: 'running' }),
      command(COMMANDS.ADVANCE_CYCLE),
    ]);
    assert.equal(run.world.demand.band, 'high-stable', `seed ${seed} drifted out of its band`);
    assert.ok(run.world.demand.reach > 0.4 && run.world.demand.reach < 0.5, `seed ${seed}: ${run.world.demand.reach}`);
  }
});

// --- 5. pause prevents time progression ---------------------------------------

test('★ 5 — PAUSE STOPS THE WORLD. Fictional time and every process hold', () => {
  const paused = wholeMorning();               // two cycles, then pause
  const held = dispatch(paused, command(COMMANDS.SET_CLOCK_MODE, { mode: 'paused' }));
  const before = held.world;
  const after = dispatch(held, command(COMMANDS.ADVANCE_CYCLE));

  assert.equal(after.lastRefusal.reason, REFUSALS.CANNOT_ADVANCE_WHILE_PAUSED);
  assert.equal(after.world, before, 'a paused world advanced');
  assert.equal(after.world.time.minute, before.time.minute);
  assert.equal(after.world.time.cycle, before.time.cycle);
});

test('5 — nothing at all progresses while paused, from the very start', () => {
  const run = run0();
  const after = dispatch(run, command(COMMANDS.ADVANCE_CYCLE));
  assert.equal(after.world.time.minute, 0);
  assert.equal(after.world.demand.band, 'steady');
  assert.equal(after.world.supply.mobileReserve.place, after.world.supply.mobileReserve.origin);
});

// --- 6. the non-timed path is causally identical ------------------------------

test('★ 6 — act-advanced produces the SAME causal state as the running clock', () => {
  const timed = wholeMorning('running');
  const untimed = wholeMorning('act-advanced');

  // The only permitted difference is which mode the clock is in.
  assert.notEqual(timed.world.time.mode, untimed.world.time.mode);
  assert.deepEqual({ ...timed.world.time, mode: null }, { ...untimed.world.time, mode: null });
  assert.deepEqual(timed.world.demand, untimed.world.demand);
  assert.deepEqual(timed.world.services, untimed.world.services);
  assert.deepEqual(timed.world.supply, untimed.world.supply);
  assert.deepEqual(timed.world.technical, untimed.world.technical);
  assert.deepEqual(timed.world.evidence, untimed.world.evidence);
  assert.equal(timed.world.status, untimed.world.status);
});

test('★ 6 — and the operational EVENTS are identical, not merely the end state', () => {
  const strip = (run) => run.events
    .filter((e) => e.type !== EVENTS.CLOCK_MODE_CHANGED)
    .map(({ type, cycle, changed, because }) => ({ type, cycle, changed, because }));
  assert.deepEqual(strip(wholeMorning('running')), strip(wholeMorning('act-advanced')));
});

// --- 7. chronology -------------------------------------------------------------

test('★ 7 — events remain chronological across the whole morning', () => {
  const run = wholeMorning();
  assert.ok(assertChronological(run.events));
  for (let i = 1; i < run.events.length; i++) {
    assert.ok(run.events[i].sequence > run.events[i - 1].sequence);
    assert.ok(run.events[i].minute >= run.events[i - 1].minute);
  }
});

test('★ 7 — and an out-of-order log is REFUSED rather than rendered', () => {
  const run = wholeMorning();
  const scrambled = [run.events[3], run.events[1]];
  assert.throws(() => assertChronological(scrambled), (e) => e instanceof ChronologyRefusal);
});

// --- 8. physical and staffed capacity stay separate ---------------------------

test('★ 8 — physical ICU capacity never changes when staffed coverage thins', () => {
  const run = wholeMorning();
  assert.equal(run.world.services.icu.physicalPositions, 8, 'a shift change moved a physical position');
  assert.equal(run.world.services.icu.staffedPositions, 5);
  assert.ok(run.world.services.icu.borrowedSupport);
});

test('★ 8 — the two counts are separately reported everywhere they appear', () => {
  const run = wholeMorning();
  const icu = run.world.services.icu;
  assert.notEqual(icu.physicalPositions, icu.staffedPositions,
    'the fixture stopped exercising the contradiction the chapter is about');
});

// --- 9. reserve movement preserves origin and custody -------------------------

test('★ 9 — a committed reserve keeps its ORIGIN, its CUSTODY and its donating service', () => {
  const run = wholeMorning();
  const reserve = run.world.supply.mobileReserve;
  assert.equal(reserve.place, PLACES.ICU, 'the reserve did not move');
  assert.equal(reserve.origin, PLACES.STORES, 'moving the reserve erased where it came from');
  assert.equal(reserve.custody, 'biomedical');
  assert.equal(reserve.donatingService, 'ed');
  assert.equal(reserve.status, 'committed');
});

test('★ 9 — and a world whose reserve lost its origin is REFUSED', () => {
  const world = structuredClone(initialWorld(SEED));
  delete world.supply.mobileReserve.origin;
  assert.ok(worldProblems(world).some((p) => p.reason === 'supply-unit-lost-its-origin'));
  world.supply.mobileReserve.origin = PLACES.STORES;
  world.supply.mobileReserve.custody = null;
  assert.ok(worldProblems(world).some((p) => p.reason === 'supply-unit-lost-its-custody'));
});

// --- 10. a technical team is available or assigned, never both ----------------

test('★ 10 — available AND assigned is REFUSED', () => {
  const world = structuredClone(initialWorld(SEED));
  world.technical.teams[0].assignment = 'underworks round';   // still `available`
  assert.ok(worldProblems(world).some((p) => p.reason === 'team-cannot-be-available-and-assigned'));
});

test('★ 10 — an assigned team standing at its own origin is REFUSED', () => {
  // §18.3: the group "cannot appear simultaneously as available at the workshop".
  const world = structuredClone(initialWorld(SEED));
  Object.assign(world.technical.teams[0], { status: 'assigned', assignment: 'round', place: PLACES.WORKSHOP, route: null });
  assert.ok(worldProblems(world).some((p) => p.reason === 'assigned-team-is-still-at-its-origin'));
});

test('10 — through the real morning the two teams stay one available, one assigned', () => {
  const run = wholeMorning();
  const available = run.world.technical.teams.filter((t) => t.status === 'available');
  const assigned = run.world.technical.teams.filter((t) => t.status === 'assigned');
  assert.equal(available.length, 1);
  assert.equal(assigned.length, 1);
  assert.ok(assigned[0].assignment);
  assert.notEqual(assigned[0].place, PLACES.WORKSHOP);
});

// --- 11. ordinary operations continue autonomously, and stay bounded ----------

test('★ 11 — one cycle moves demand, supply and technical work with NO narration button', () => {
  const before = running();
  const after = dispatch(before, command(COMMANDS.ADVANCE_CYCLE));
  const kinds = new Set(after.events.slice(before.events.length).map((e) => e.type));
  for (const required of [EVENTS.TIME_ADVANCED, EVENTS.DEMAND_CHANGED, EVENTS.SUPPLY_MOVED, EVENTS.TECHNICAL_ASSIGNED, EVENTS.CYCLE_COMPLETED]) {
    assert.ok(kinds.has(required), `a cycle did not ${required}`);
  }
  assert.notEqual(after.world.demand.reach, before.world.demand.reach);
  assert.notEqual(after.world.supply.ordinaryCart.place, before.world.supply.ordinaryCart.place);
});

test('★ 11 — and the morning is BOUNDED: a third cycle is refused', () => {
  const run = wholeMorning();
  const third = dispatch(run, command(COMMANDS.ADVANCE_CYCLE));
  assert.equal(third.lastRefusal.reason, REFUSALS.ORDINARY_CYCLES_COMPLETE);
  assert.equal(third.world, run.world);
});

test('11 — every intermediate world is valid, not only the last one', () => {
  let run = running();
  for (let i = 0; i < ORDINARY_CYCLES; i++) {
    run = dispatch(run, command(COMMANDS.ADVANCE_CYCLE));
    assert.deepEqual(problems(run), [], `cycle ${i + 1} produced an invalid world`);
  }
});

// --- 12. exactly two cycles open the preparation window -----------------------

test('★ 12 — the window opens after EXACTLY two ordinary cycles, not one and not three', () => {
  let run = running();
  assert.equal(run.world.status, 'ordinary');

  run = dispatch(run, command(COMMANDS.ADVANCE_CYCLE));
  assert.equal(run.world.status, 'ordinary', 'one cycle opened the window');

  run = dispatch(run, command(COMMANDS.ADVANCE_CYCLE));
  assert.equal(run.world.status, 'preparation-window');
  assert.equal(run.world.time.cycle, ORDINARY_CYCLES);
});

test('★ 12 — and it cannot be opened early by asking', () => {
  const early = dispatch(running(), command(COMMANDS.OPEN_PREPARATION_WINDOW));
  assert.equal(early.lastRefusal.reason, REFUSALS.PREPARATION_WINDOW_NOT_EARNED);
  assert.equal(early.world.status, 'ordinary');
});

// --- 17. the boundary the whole product rests on -------------------------------

test('⛔ 17 — no patient, no clinical decision, no score, no live command anywhere', () => {
  const run = wholeMorning();
  const serialised = JSON.stringify({ world: run.world, events: run.events });

  // Patient-level simulation and clinical instruction.
  for (const forbidden of ['"patients"', '"patient"', '"diagnosis"', '"treatment"', '"prescri', '"triage"']) {
    assert.ok(!serialised.includes(forbidden), `the run contains ${forbidden}`);
  }
  // Scoring and ranking.
  for (const forbidden of ['"score"', '"rating"', '"rank"', '"grade"', '"readiness"']) {
    assert.ok(!serialised.includes(forbidden), `the run contains ${forbidden}`);
  }
  // Every command is a fictional operational act, never a live instruction.
  assert.deepEqual([...Object.values(COMMANDS)].filter((id) => /dispatch|order|call|alert|notify/.test(id)), []);
});
