/**
 * R0-C01 — THE DOMAIN STATE OF THE COMPACT BIMARISTAN SECTOR.
 *
 * ============================================================================
 * WHAT THIS IS, AND WHAT IT DELIBERATELY IS NOT
 * ============================================================================
 * This is the authoritative fictional world for the R0 pilot: one compact
 * ED–ICU–power–stores–maintenance sector, as `gameplay-and-state.md` § 2 and
 * § 13 require. Every projection — map, structured view, status strip,
 * inspector, announcements — reads from here. No component may hold operational
 * state of its own.
 *
 * ⛔ IT MODELS NO PATIENT. `safety-privacy-and-claims.md` § 2 permits aggregate
 * demand, service pressure, staff coverage, supplies, infrastructure and access;
 * it forbids identifiable patients, treatment decisions and clinical
 * allocation. `demand` below is an aggregate cohort with a band and a position
 * on a route. It has no people in it, and adding any would change what this
 * product is allowed to claim.
 *
 * ⛔ AND IT SCORES NOTHING. There is no readiness index, no resilience number
 * and no aggregate that could conceal a failed dimension. Quantities here are
 * fictional operational facts — staffed positions, teams, carts — never a
 * judgement about any hospital.
 *
 * ============================================================================
 * ★ THE INVARIANT THIS FILE EXISTS TO PROTECT
 * ============================================================================
 * **Physical capacity is not staffed capacity.** They are separate fields, they
 * are separately reported, and `validateWorld` refuses a world that conflates
 * them. This is the chapter's whole argument — eight physical ICU positions
 * with six staffed is not "eight beds" — and a model that stores one number
 * cannot express it, however carefully the interface words the label.
 */

/** @typedef {'steady'|'high-stable'|'rising'|'backlogged'} DemandBand */
/** @typedef {'available'|'assigned'|'recovering'} TeamStatus */
/** @typedef {'stored'|'staged'|'in-transit'|'committed'|'replenishing'} ReserveStatus */
/** @typedef {'clear'|'obstructed'|'restricted'|'rerouted'|'restored'} RouteCondition */
/** @typedef {'paused'|'running'|'act-advanced'} ClockMode */

/**
 * The places of the compact sector. Stable identifiers — a projection maps them
 * to map anchors, and the map may be recropped without touching the model.
 */
export const PLACES = Object.freeze({
  GATE: 'gate',
  ED: 'ed',
  ICU: 'icu',
  STORES: 'stores',
  WORKSHOP: 'workshop',
  UNDERWORKS: 'underworks',
  COORDINATION: 'coordination',
  POWER: 'power',
});

export const PLACE_IDS = Object.freeze(Object.values(PLACES));

/**
 * Responsible functions. Authority lives here, not in button visibility —
 * `technical-design.md` invariant 2.
 */
export const FUNCTIONS = Object.freeze({
  CLINICAL: 'clinical-services',
  NURSING: 'nursing-and-patient-flow',
  FACILITIES: 'facilities-and-technical',
  BIOMEDICAL: 'biomedical',
  STORES: 'storage-and-distribution',
  QUALITY: 'quality-and-patient-safety',
  RESILIENCE: 'resilience-lead',
});

/**
 * ★ THE OPENING WORLD.
 *
 * The numbers are the compact sector's, and they come from the accepted visual
 * contract (`visual-and-interaction-bible.md` § 19.1): eight physical ICU
 * positions, six staffed, two technical teams, one mobile reserve, one ordinary
 * supply cart.
 *
 * ⚠️ THEY ARE NOT CANON'S WHOLE-HOSPITAL FIGURES. Chapter 1 gives the Bimaristan
 * thirty-two ICU beds with thirty occupied and a roster safe for about
 * twenty-eight. R0 plays a *slice* of that hospital, which the mechanics
 * authority names explicitly — "a compact ED–ICU–power–stores–maintenance
 * sector". Writing canon's whole-ICU numbers into a sector that shows eight
 * positions would be a contradiction a participant can see.
 */
export function initialWorld(seed) {
  if (!Number.isInteger(seed) || seed < 0) {
    throw new WorldRefusal('seed-must-be-a-non-negative-integer', String(seed));
  }
  return deepFreeze({
    seed,
    // --- fictional time -----------------------------------------------------
    time: {
      // Canon's clock is bells, not minutes past midnight. Chapter 1 runs from
      // First Bell; the ordinary morning sits between First and Second.
      bell: 'first',
      minute: 0,          // fictional minutes since First Bell
      cycle: 0,           // completed ordinary heartbeat cycles
      mode: /** @type {ClockMode} */ ('paused'),
      speed: 1,
    },
    status: 'ordinary',   // ordinary | preparation-window
    // --- aggregate service demand ------------------------------------------
    // One cohort. Not a queue of people, and never an identifiable patient.
    demand: {
      band: /** @type {DemandBand} */ ('steady'),
      // How far the occupied route has advanced from the Gate, 0..1. Position
      // is the visible fact; the band is its name.
      reach: 0.28,
      retained: false,      // whether arrivals are held rather than clearing
      route: ['gate', 'ed'],
    },
    // --- capacity: PHYSICAL AND STAFFED, SEPARATELY -------------------------
    services: {
      icu: {
        place: PLACES.ICU,
        physicalPositions: 8,   // spaces that exist
        staffedPositions: 6,    // spaces a competent team can be responsible for
        borrowedSupport: false,
        responsibleFunction: FUNCTIONS.NURSING,
      },
      ed: {
        place: PLACES.ED,
        physicalPositions: 6,
        staffedPositions: 6,
        borrowedSupport: false,
        responsibleFunction: FUNCTIONS.CLINICAL,
      },
    },
    // --- staff groups: availability, workload, assignment -------------------
    staff: {
      clinical: {
        function: FUNCTIONS.CLINICAL,
        place: PLACES.ICU,
        status: /** @type {TeamStatus} */ ('assigned'),
        assignment: 'icu-service-work',
        workload: 'ordinary',        // ordinary | stretched | extended
        route: null,
      },
    },
    // --- technical/facilities capacity --------------------------------------
    // ★ Two teams, each either available OR assigned. Never both: see
    // `validateWorld`. A team that is available at the workshop and working in
    // the Underworks is the shape §18.3 forbids by name.
    technical: {
      teams: [
        { id: 'tech-a', function: FUNCTIONS.FACILITIES, status: 'available', place: PLACES.WORKSHOP, assignment: null, route: null },
        { id: 'tech-b', function: FUNCTIONS.FACILITIES, status: 'available', place: PLACES.WORKSHOP, assignment: null, route: null },
      ],
      deferredWork: [],
    },
    // --- supplies and the traceable reserve ---------------------------------
    supply: {
      // The ordinary stores-to-service cart.
      ordinaryCart: {
        id: 'supply-cart',
        place: PLACES.STORES,
        origin: PLACES.STORES,
        custody: FUNCTIONS.STORES,
        status: /** @type {ReserveStatus} */ ('stored'),
        destination: null,
        waiting: false,
      },
      // ★ ONE traceable mobile critical-care reserve, with an origin that
      // survives its movement. §13.1: "its empty origin remains visible when
      // committed".
      mobileReserve: {
        id: 'mobile-reserve',
        place: PLACES.STORES,
        origin: PLACES.STORES,
        custody: FUNCTIONS.BIOMEDICAL,
        donatingService: 'ed',
        status: /** @type {ReserveStatus} */ ('stored'),
        destination: null,
      },
    },
    // --- equipment ----------------------------------------------------------
    equipment: {
      icuBridging: { class: 'critical-care-bridge', place: PLACES.ICU, status: 'ready', responsibleFunction: FUNCTIONS.BIOMEDICAL, verificationDue: false },
    },
    // --- routes and their conditions ----------------------------------------
    routes: {
      'gate-ed': { from: PLACES.GATE, to: PLACES.ED, class: 'service', condition: /** @type {RouteCondition} */ ('clear'), owner: FUNCTIONS.CLINICAL },
      'stores-ed': { from: PLACES.STORES, to: PLACES.ED, class: 'supply', condition: 'clear', owner: FUNCTIONS.STORES },
      'stores-icu': { from: PLACES.STORES, to: PLACES.ICU, class: 'supply', condition: 'clear', owner: FUNCTIONS.STORES },
      'workshop-service': { from: PLACES.WORKSHOP, to: PLACES.ED, class: 'staff', condition: 'clear', owner: FUNCTIONS.FACILITIES },
      'workshop-underworks': { from: PLACES.WORKSHOP, to: PLACES.UNDERWORKS, class: 'staff', condition: 'clear', owner: FUNCTIONS.FACILITIES },
      'icu-support': { from: PLACES.ICU, to: PLACES.ED, class: 'staff', condition: 'clear', owner: FUNCTIONS.NURSING },
      'power-icu': { from: PLACES.POWER, to: PLACES.ICU, class: 'power', condition: 'clear', owner: FUNCTIONS.FACILITIES },
    },
    // --- active work and inspections ----------------------------------------
    work: [],
    // --- evidence and observations ------------------------------------------
    // §6 of the mechanics authority: source, time, confidence and accessibility
    // travel with a claim, and `unknown` is not `not investigated`.
    evidence: [],
    // --- operational residue -------------------------------------------------
    residue: [],
  });
}

export class WorldRefusal extends Error {
  constructor(reason, detail) {
    super(detail ? `${reason}: ${detail}` : reason);
    this.reason = reason;
    this.detail = detail;
  }
}

/**
 * ★ REFUSE AN IMPOSSIBLE WORLD, BY NAME.
 *
 * Returns a list of reasons rather than throwing on the first, because a
 * content or reducer error usually breaks more than one thing and a validator
 * that names one problem at a time turns a fix into a bisect.
 */
export function worldProblems(world) {
  const problems = [];
  const say = (reason, detail) => problems.push({ reason, detail });

  if (!world || typeof world !== 'object') return [{ reason: 'world-is-not-an-object', detail: String(world) }];
  if (!Number.isInteger(world.seed)) say('seed-must-be-a-non-negative-integer', String(world.seed));

  // --- time ---------------------------------------------------------------
  if (!['paused', 'running', 'act-advanced'].includes(world.time?.mode)) {
    say('unknown-clock-mode', world.time?.mode);
  }
  if (!(world.time?.minute >= 0)) say('fictional-time-cannot-run-backwards', String(world.time?.minute));
  if (!(world.time?.cycle >= 0)) say('cycle-count-cannot-be-negative', String(world.time?.cycle));

  // --- ★ physical capacity must not imply staffed capacity ----------------
  for (const [id, service] of Object.entries(world.services ?? {})) {
    if (!Number.isInteger(service.physicalPositions) || !Number.isInteger(service.staffedPositions)) {
      say('capacity-must-be-two-separate-counts', id);
      continue;
    }
    if (service.staffedPositions > service.physicalPositions) {
      // Staffing a position that does not physically exist.
      say('staffed-capacity-exceeds-physical-capacity', `${id}: ${service.staffedPositions}/${service.physicalPositions}`);
    }
    if (service.physicalPositions < 0 || service.staffedPositions < 0) {
      say('capacity-cannot-be-negative', id);
    }
  }

  // --- ★ a technical team cannot be available AND assigned ----------------
  for (const team of world.technical?.teams ?? []) {
    if (!['available', 'assigned', 'recovering'].includes(team.status)) {
      say('unknown-team-status', `${team.id}: ${team.status}`);
    }
    if (team.status === 'available' && team.assignment) {
      say('team-cannot-be-available-and-assigned', `${team.id} -> ${team.assignment}`);
    }
    if (team.status === 'assigned' && !team.assignment) {
      say('assigned-team-has-no-assignment', team.id);
    }
    if (team.status === 'assigned' && team.place === PLACES.WORKSHOP && !team.route) {
      // §18.3: the group "cannot appear simultaneously as available at the
      // workshop" — an assigned team is on a route or at its work site.
      say('assigned-team-is-still-at-its-origin', team.id);
    }
  }

  // --- ★ a moved reserve keeps its origin and custody ---------------------
  for (const key of ['ordinaryCart', 'mobileReserve']) {
    const unit = world.supply?.[key];
    if (!unit) { say('supply-unit-missing', key); continue; }
    if (!PLACE_IDS.includes(unit.origin)) say('supply-unit-lost-its-origin', key);
    if (!unit.custody) say('supply-unit-lost-its-custody', key);
    if (!PLACE_IDS.includes(unit.place)) say('supply-unit-is-nowhere', `${key}: ${unit.place}`);
    if (!['stored', 'staged', 'in-transit', 'committed', 'replenishing'].includes(unit.status)) {
      say('unknown-supply-status', `${key}: ${unit.status}`);
    }
    if (unit.status === 'stored' && unit.place !== unit.origin) {
      say('a-unit-away-from-its-origin-is-not-stored', `${key} at ${unit.place}`);
    }
  }

  // --- routes -------------------------------------------------------------
  for (const [id, route] of Object.entries(world.routes ?? {})) {
    if (!PLACE_IDS.includes(route.from) || !PLACE_IDS.includes(route.to)) {
      say('route-joins-a-place-that-does-not-exist', id);
    }
    if (!['clear', 'obstructed', 'restricted', 'rerouted', 'restored'].includes(route.condition)) {
      say('unknown-route-condition', `${id}: ${route.condition}`);
    }
  }

  // --- staff --------------------------------------------------------------
  for (const [id, group] of Object.entries(world.staff ?? {})) {
    if (!PLACE_IDS.includes(group.place)) say('staff-group-is-nowhere', id);
    if (!['ordinary', 'stretched', 'extended'].includes(group.workload)) {
      say('unknown-workload', `${id}: ${group.workload}`);
    }
  }

  // --- ⛔ no patient-level record may enter the world ---------------------
  // The boundary is checked on the SHAPE, not on intent. A field called
  // `patients` holding rows is exactly the thing § 2 of the safety authority
  // forbids, and it would arrive as a convenience.
  for (const forbidden of ['patients', 'patient', 'cases', 'admissions', 'treatments', 'diagnoses']) {
    if (forbidden in world) say('patient-level-record-in-the-world', forbidden);
  }
  // Nor may a score. No aggregate may conceal a failed dimension.
  for (const forbidden of ['score', 'rating', 'readiness', 'resilienceScore', 'grade', 'rank']) {
    if (forbidden in world) say('score-in-the-world', forbidden);
  }

  return problems;
}

export function validateWorld(world) {
  const problems = worldProblems(world);
  if (problems.length) {
    throw new WorldRefusal(problems[0].reason, problems.map((p) => `${p.reason}${p.detail ? ` (${p.detail})` : ''}`).join('; '));
  }
  return world;
}

/**
 * Freeze deeply, so a projection or a component that tries to write to the
 * world fails loudly instead of creating a second, divergent truth.
 */
export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) deepFreeze(value[key]);
  }
  return value;
}
