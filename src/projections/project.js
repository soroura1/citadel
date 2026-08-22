/**
 * R0-C04 — ONE STATE, EVERY REPRESENTATION.
 *
 * ============================================================================
 * ⛔ NO UI COMPONENT MAY INVENT BUSINESS STATE
 * ============================================================================
 * `technical-design.md` invariant 1 and § 2: "UI components do not decide
 * rules... Projections do not invent authoritative state." Everything a
 * participant can see — the map units, the route geometry, the status strip,
 * the structured list, the inspector and the announcements — is produced here,
 * from the world, in one pass. A component receives a projection and renders
 * it; it never reads the world and decides for itself.
 *
 * That is also what makes map/structured parity a fact rather than a promise:
 * they are two renderings of ONE object, so they cannot drift without the
 * projection changing for both.
 *
 * ============================================================================
 * ★ THE ORDINARY STATE IS READ, NOT STORED
 * ============================================================================
 * `classifyOrdinary` derives `ordinary-steady`, `ordinary-high-stable` or
 * `ordinary-rising` from demand, staffed coverage, custody and technical
 * assignment. Nothing writes the name into the world. If some future cycle
 * produced high demand with everything still at origin, this would honestly
 * report high-stable — the states are a reading of the institution, which is
 * the only thing that makes them worth reading.
 */
import { PLACES, FUNCTIONS } from '../sim/world.js';
import { ORDINARY_CYCLES } from '../sim/clock.js';
import { EVENTS } from '../sim/events.js';
import { GROUND, ROUTE_PATHS, ROUTE_STYLE, occupiedPath, pointAlong, widthFor } from './anchors.js';
import { PROJECTS, PROJECT_CAPACITY, STATE_LABELS, committed, contendedResources } from '../sim/projects.js';

export const ORDINARY_STATES = Object.freeze(['ordinary-steady', 'ordinary-high-stable', 'ordinary-rising']);

/**
 * ★ THE READING. Ordered from most to least pressured, so a world that has
 * moved on several axes is named by the strongest one rather than by whichever
 * test happened to run first.
 */
export function classifyOrdinary(world) {
  const icu = world.services.icu;
  const reserveAway = world.supply.mobileReserve.place !== world.supply.mobileReserve.origin;
  const thinned = icu.staffedPositions < 6 || icu.borrowedSupport;
  const assigned = world.technical.teams.filter((team) => team.status === 'assigned').length;
  const cartMoving = world.supply.ordinaryCart.place !== world.supply.ordinaryCart.origin;

  if (world.demand.band === 'rising' || reserveAway || thinned) return 'ordinary-rising';
  if (world.demand.band === 'high-stable' || assigned > 0 || cartMoving) return 'ordinary-high-stable';
  return 'ordinary-steady';
}

/** Where a supply/reserve unit is drawn: at a place, or along its route. */
function unitPlacement(unit, routeId) {
  const path = routeId ? ROUTE_PATHS[routeId] : null;
  if (unit.status === 'in-transit' && path) {
    // Holding on the route is a real, visible operational fact: § 19.1's rising
    // state has "ordinary delivery waits on the centre route".
    return pointAlong(path, unit.waiting ? 0.55 : 0.8);
  }
  return GROUND[unit.place] ?? GROUND[unit.origin];
}

const routeBetween = (from, to) => {
  const direct = `${from}-${to}`;
  if (ROUTE_PATHS[direct]) return direct;
  return Object.keys(ROUTE_PATHS).find((id) => id.startsWith(`${from}-`)) ?? null;
};

/**
 * ★ THE UNITS. Five aggregate operational objects — never a person, never a
 * patient. § 19.1: "The map does not create a literal unit census."
 */
export function projectUnits(world) {
  const units = [];

  // --- aggregate demand: at the head of the occupied route -----------------
  const demandHead = pointAlong(ROUTE_PATHS['gate-ed'], world.demand.reach);
  units.push({
    id: 'demand',
    slot: 'R0-SL07D',
    kind: 'demand',
    name: 'ED arrival and waiting',
    x: demandHead.x, y: demandHead.y,
    width: widthFor('demand', demandHead.y),
    place: world.demand.reach > 0.5 ? PLACES.ED : PLACES.GATE,
    changed: world.demand.retained,
    fact: world.demand.retained
      ? 'Arrivals are being retained between the Gate and the ED threshold.'
      : 'Arrivals are clearing the ED threshold within the cycle.',
    responsibleFunction: FUNCTIONS.CLINICAL,
  });

  // --- clinical coverage: anchored to staffed work, or on borrowed support --
  const clinical = world.staff.clinical;
  const clinicalAt = clinical.route
    ? pointAlong(ROUTE_PATHS[clinical.route], 0.85)
    : GROUND[clinical.place];
  units.push({
    id: 'clinical',
    slot: 'R0-SL07A',
    kind: 'clinical',
    name: 'Staffed clinical work',
    x: clinicalAt.x, y: clinicalAt.y,
    width: widthFor('clinical', clinicalAt.y),
    place: clinical.place,
    changed: Boolean(clinical.route),
    fact: `${world.services.icu.staffedPositions} staffed of ${world.services.icu.physicalPositions} physical ICU positions.`,
    responsibleFunction: clinical.function,
  });

  // --- technical capacity ---------------------------------------------------
  const working = world.technical.teams.find((team) => team.status === 'assigned');
  const techPlace = working ? GROUND[working.place] : GROUND[PLACES.WORKSHOP];
  units.push({
    id: 'technical',
    slot: 'R0-SL07B',
    kind: 'technical',
    name: 'Technical team',
    x: techPlace.x, y: techPlace.y,
    width: widthFor('technical', techPlace.y),
    place: working ? working.place : PLACES.WORKSHOP,
    changed: Boolean(working),
    fact: working
      ? `Assigned: ${working.assignment}.`
      : `${world.technical.teams.filter((t) => t.status === 'available').length} teams available at the workshop.`,
    responsibleFunction: FUNCTIONS.FACILITIES,
  });

  // --- the traceable mobile reserve ----------------------------------------
  const reserve = world.supply.mobileReserve;
  const reserveAt = unitPlacement(reserve, routeBetween(reserve.origin, reserve.destination ?? reserve.place));
  units.push({
    id: 'reserve',
    slot: 'R0-SL07C',
    kind: 'reserve',
    name: 'Mobile reserve',
    x: reserveAt.x, y: reserveAt.y,
    width: widthFor('reserve', reserveAt.y),
    place: reserve.place,
    changed: reserve.place !== reserve.origin,
    fact: reserve.place === reserve.origin
      ? 'At its origin in Clinical Stores.'
      : `Committed to ${reserve.place}; the ${reserve.donatingService.toUpperCase()} reserve position is empty.`,
    responsibleFunction: reserve.custody,
  });

  // --- ordinary supply ------------------------------------------------------
  const cart = world.supply.ordinaryCart;
  const cartAt = unitPlacement(cart, routeBetween(cart.origin, cart.destination ?? cart.place));
  units.push({
    id: 'supply',
    slot: 'R0-SL07E',
    kind: 'supply',
    name: 'Ordinary supply',
    x: cartAt.x, y: cartAt.y,
    width: widthFor('supply', cartAt.y),
    place: cart.place,
    changed: cart.place !== cart.origin,
    fact: cart.waiting ? 'Holding on the centre route.' : cart.status === 'in-transit' ? 'In transit from Clinical Stores.' : 'At its origin in Clinical Stores.',
    responsibleFunction: cart.custody,
  });

  return units;
}

/**
 * ★ ROUTES, WITH THEIR ORIGIN NODES.
 *
 * § 19.2: "origin nodes remain after a cart or team leaves". The empty origin is
 * the visible cost — remove it and a committed reserve looks like a reserve
 * that was always at the ICU.
 */
export function projectRoutes(world) {
  const routes = [];
  const push = (id, klass, changed, fraction) => {
    const path = ROUTE_PATHS[id];
    if (!path) return;
    routes.push({
      id, class: klass, changed,
      path: fraction == null ? path : occupiedPath(path, fraction),
      style: ROUTE_STYLE[klass],
      from: world.routes[id]?.from ?? null,
      to: world.routes[id]?.to ?? null,
      condition: world.routes[id]?.condition ?? 'clear',
    });
  };

  push('gate-ed', 'service', world.demand.retained, world.demand.reach);

  const clinical = world.staff.clinical;
  if (clinical.route) push(clinical.route, 'staff', true, null);

  const cart = world.supply.ordinaryCart;
  if (cart.place !== cart.origin) push(routeBetween(cart.origin, cart.destination ?? cart.place), 'supply', true, null);

  const reserve = world.supply.mobileReserve;
  if (reserve.place !== reserve.origin) push(routeBetween(reserve.origin, reserve.destination ?? reserve.place), 'supply', true, null);

  const working = world.technical.teams.find((team) => team.status === 'assigned');
  if (working?.route) push(working.route, 'staff', true, null);

  const nodes = [
    { id: 'gate', ...GROUND[PLACES.GATE], shape: 'circle', occupied: true },
    { id: 'stores', ...GROUND[PLACES.STORES], shape: 'square', occupied: reserve.place === reserve.origin && cart.place === cart.origin },
    { id: 'workshop', ...GROUND[PLACES.WORKSHOP], shape: 'circle', occupied: !working },
  ];
  return { routes, nodes };
}

/** The four status readings, with a tone that never carries meaning alone. */
export function projectStatus(world) {
  const icu = world.services.icu;
  const available = world.technical.teams.filter((team) => team.status === 'available').length;
  const assigned = world.technical.teams.filter((team) => team.status === 'assigned').length;
  const reserve = world.supply.mobileReserve;
  const cart = world.supply.ordinaryCart;

  const supplyReading = reserve.place !== reserve.origin
    ? 'Reserve committed'
    : cart.place !== cart.origin ? '1 delivery moving' : 'Both at origin';

  return [
    { id: 'demand', label: 'ED demand', value: demandWord(world), warn: world.demand.retained },
    // ★ Both numbers, always, in one reading. A status line that said "8 beds"
    // would be true and would erase the chapter's argument.
    { id: 'icu', label: 'ICU coverage', value: `${icu.staffedPositions} staffed · ${icu.physicalPositions} physical`, warn: icu.staffedPositions < icu.physicalPositions - 1 },
    { id: 'supply', label: 'Supply and reserve', value: supplyReading, warn: reserve.place !== reserve.origin || cart.waiting },
    { id: 'technical', label: 'Technical capacity', value: assigned ? `${available} available · ${assigned} assigned` : `${available} teams available`, warn: available < 2 },
  ];
}

const demandWord = (world) => {
  if (world.demand.band === 'rising') return 'Rising · retained';
  if (world.demand.band === 'high-stable') return world.demand.retained ? 'High · sustained' : 'High · stable';
  return 'High · stable';
};

/**
 * The structured world: the same objects, grouped for reading rather than for
 * looking. § 18.7 — not alt text, and not a shortened transcript.
 */
export function projectStructured(world) {
  const icu = world.services.icu;
  const reserve = world.supply.mobileReserve;
  const cart = world.supply.ordinaryCart;
  const available = world.technical.teams.filter((team) => team.status === 'available');
  const working = world.technical.teams.find((team) => team.status === 'assigned');

  return [
    { id: 'demand', term: 'Demand', detail: world.demand.retained
      ? `Retained arrivals occupy the Gate–ED route to ${Math.round(world.demand.reach * 100)}% of its length; movement continues slowly.`
      : `Arrivals move Gate → ED; threshold positions clear within the cycle (${Math.round(world.demand.reach * 100)}% occupied).` },
    { id: 'coverage', term: 'Coverage', detail:
      `${icu.physicalPositions} physical ICU positions; ${icu.staffedPositions} staffed`
      + `${icu.borrowedSupport ? ' with borrowed support in transit' : ' working in place'}.`
      + ` Responsible function: ${icu.responsibleFunction}.` },
    { id: 'supply', term: 'Supply', detail:
      `Mobile reserve ${reserve.place === reserve.origin ? `at ${reserve.origin}` : `committed ${reserve.origin} → ${reserve.place}`}`
      + ` (custody: ${reserve.custody}; donating service: ${reserve.donatingService.toUpperCase()}).`
      + ` Ordinary cart ${cart.waiting ? 'waiting on the centre route' : cart.place === cart.origin ? 'at Clinical Stores' : `in transit to ${cart.place}`}.` },
    { id: 'technical', term: 'Technical work', detail: working
      ? `One team ${working.assignment} at ${working.place}; ${available.length} team${available.length === 1 ? '' : 's'} uncommitted.`
      : `${available.length} teams available at the Technical Workshop.` },
    { id: 'next', term: 'Next change', detail: nextChange(world) },
  ];
}

function nextChange(world) {
  if (world.status === 'preparation-window') return 'The preparation window is open.';
  if (world.time.mode === 'paused') return 'Fictional time is paused; nothing is progressing.';
  const remaining = ORDINARY_CYCLES - world.time.cycle;
  return `${remaining} ordinary cycle${remaining === 1 ? '' : 's'} remain${remaining === 1 ? 's' : ''} before the preparation window.`;
}

/** What changed in the most recent cycle, and why. Never a diff guess. */
export function projectChanges(events) {
  const lastCycle = events.filter((e) => e.type === EVENTS.CYCLE_COMPLETED).slice(-1)[0];
  const since = lastCycle ? lastCycle.cycle : 0;
  return events
    .filter((e) => e.changed && e.because && e.cycle === since && e.type !== EVENTS.COMMAND_REFUSED && e.type !== EVENTS.PLACE_INSPECTED)
    .map((e) => ({ id: `${e.sequence}`, changed: e.changed, because: e.because, warn: e.type !== EVENTS.TIME_ADVANCED }));
}

/** One place, inspected. Source and confidence travel with every claim. */
export function projectInspector(world, placeId) {
  const units = projectUnits(world).filter((unit) => unit.place === placeId);
  const work = world.work.filter((item) => item.place === placeId);
  const routes = Object.entries(world.routes)
    .filter(([, route]) => route.from === placeId || route.to === placeId)
    .map(([id, route]) => ({ id, from: route.from, to: route.to, class: route.class, condition: route.condition, owner: route.owner }));

  return {
    place: placeId,
    units: units.map((unit) => ({ id: unit.id, name: unit.name, fact: unit.fact, responsibleFunction: unit.responsibleFunction })),
    work: work.map((item) => ({ id: item.id, needs: item.needs, responsibleFunction: item.responsibleFunction, status: item.status })),
    routes,
    // ⚠️ `not investigated` is not `unknown`, and neither is `unavailable`.
    // § 6 of the mechanics authority keeps them distinct, so the inspector
    // reports the confidence the evidence actually carries.
    evidence: world.evidence.map((item) => ({ id: item.id, claim: item.claim, source: item.source, confidence: item.confidence, accessibility: item.accessibility })),
  };
}

/**
 * ★ R0-C05 — THE PREPAREDNESS WINDOW, INCLUDING WHAT IS BEING GIVEN UP.
 *
 * Every project is projected, always — including the two the participant did
 * not take. A window that lists only your choices cannot show you the cost of
 * making them, and the cost is the mechanic.
 *
 * ★ `contended` IS PROJECTED BEFORE COMMITMENT, deliberately. Two projects that
 * want the service passage will collide, and `gameplay-and-state.md` § 7
 * requires known effects to be previewed fairly. A collision discovered only
 * after scheduling would be a trap, not a trade-off.
 */
export function projectPreparedness(world) {
  const taken = committed(world);
  const remaining = PROJECT_CAPACITY - taken.length;

  return {
    capacity: PROJECT_CAPACITY,
    taken: taken.length,
    remaining,
    windowOpen: world.status === 'preparation-window',
    projects: PROJECTS.map((project) => {
      const entry = world.projects[project.id];
      const contended = contendedResources(world, project.id);
      return {
        id: project.id,
        nameKey: project.name_key,
        name: project.name,
        state: entry.state,
        stateLabel: STATE_LABELS[entry.state] ?? entry.state,
        // The states this project actually entered — not a range derived from
        // where it is now. `disrupted` is a branch and must not be implied.
        entered: entry.entered ?? ['available'],
        responsibleFunctions: project.responsibleFunctions,
        requires: project.requires,
        accessNeed: project.accessNeed,
        materials: project.materials,
        displaces: project.displaces,
        verification: project.verification,
        // What this would collide with, in the world's terms — knowable in
        // advance, and named rather than implied by a disabled control.
        contended,
        // Refusals a surface must be able to explain without guessing.
        canSchedule: world.status === 'preparation-window' && entry.state === 'available' && remaining > 0,
        canVerify: entry.state === 'complete',
        // ⛔ Performed is not tested, and the projection keeps them apart.
        performed: entry.state === 'complete' || entry.state === 'verified',
        verified: entry.state === 'verified',
        cyclesWorked: entry.cyclesWorked,
      };
    }),
  };
}

/** Everything a surface needs, from one world, in one pass. */
export function project(run, { selectedPlace = PLACES.ICU } = {}) {
  const { world, events } = run;
  return {
    ordinaryState: classifyOrdinary(world),
    time: { ...world.time, ordinaryCycles: ORDINARY_CYCLES },
    status: world.status,
    units: projectUnits(world),
    ...projectRoutes(world),
    strip: projectStatus(world),
    structured: projectStructured(world),
    changes: projectChanges(events),
    inspector: projectInspector(world, selectedPlace),
    preparedness: projectPreparedness(world),
    // Residue is what the world is still carrying — including work that
    // stopped being done because something else was chosen.
    residue: world.residue.map((item) => ({ ...item })),
    lastRefusal: run.lastRefusal,
  };
}
