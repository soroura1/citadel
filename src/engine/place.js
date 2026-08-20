/**
 * ★ THE BIMARISTAN AS A CONNECTED PLACE. (EVS-5)
 *
 * ============================================================================
 * IT WAS A STACK OF PAGES
 * ============================================================================
 * A scene named its locations as prose — "older ICU far bay" — and nothing
 * connected them. A participant could not say where they were, what was next
 * door, or what any of it looked like after their decision.
 *
 * ============================================================================
 * ★ THE FOUR TIERS ARE CANON, AND THE FOURTH IS THE CHAPTER'S ARGUMENT
 * ============================================================================
 *   "Below all rings lies an older network of cisterns, conduits, pressure
 *    chambers, heat vaults, foundations, waste channels, SEALED PASSAGES, and
 *    FORGOTTEN JUNCTIONS. The Underworks make every visible function possible.
 *    They are also a physical representation of HIDDEN DEPENDENCIES and
 *    neglected maintenance."
 *
 * Chapter 1's mystery is two supplies shown as independent on the official map,
 * passing through one chamber in that layer. So grouping the place by tier is
 * not decoration — it puts the map's own blind spot on the page as a heading,
 * and it does so in text, with no art at all.
 *
 * ⚠️ AND NO ART IS WHAT THIS IS. The reviewed design package EVS-5 requires does
 * not exist. Eleven v0.1 concepts sit in the story record "pending project-owner
 * review", there is no plan or cutaway asset, no state frames, no crops, no
 * declared alt text, no weight budgets, and `Q10` — the inclusion reviewer — is
 * open. This module is the semantic model; the visual binding gate is HELD.
 */

import PLACES from '../content/places.json' with { type: 'json' };

export class PlaceRefusal extends Error {
  constructor(refusal, detail) {
    super(detail ? `${refusal}: ${detail}` : refusal);
    this.refusal = refusal;
    this.detail = detail;
  }
}

export const PLACE_VERSION = PLACES.version;
export const TIERS = Object.freeze(PLACES.tiers.map((t) => Object.freeze({ ...t })));
export const LOCATIONS = Object.freeze(PLACES.locations.map((l) => Object.freeze({ ...l })));
export const locationIndex = () => new Map(LOCATIONS.map((l) => [l.id, l]));

/** The four the EVS gate names, by the ids the content uses. */
export const REQUIRED_PLACES = Object.freeze([
  'loc.gate-of-names',
  'loc.emergency-resuscitation',
  'loc.icu-far-bay',
  'loc.service-passage',
]);

/**
 * ★ WHICH STATE A LOCATION IS IN, GIVEN WHAT HAS HAPPENED. (EVS-5)
 *
 * ⚠️ DERIVED FROM THE RUN, NOT STORED BESIDE IT. The chapter enums already
 * record what was committed (`C1_CRITICAL_PATH`, `C1_POWER_RESPONSE`) and the
 * discovered evidence already records what is known. A second copy of "what the
 * ICU is like now" would be a fact written twice, and the two would disagree
 * the first time one was updated and the other was not.
 *
 * The LAST matching state wins, so a location's states read in order from its
 * ordinary condition to what the chapter did to it.
 */
export function stateOf(location, run = {}) {
  const chapter = run.state?.chapter ?? {};
  const held = new Set((run.discovered ?? []).map((d) => d.evidenceId));

  let current = null;
  for (const state of location.states ?? []) {
    if (!state.when) { current = current ?? state; continue; }
    const { variable, value, anyOf, evidence } = state.when;
    if (evidence && held.has(evidence)) current = state;
    if (variable && value !== undefined && chapter[variable] === value) current = state;
    if (variable && anyOf && anyOf.includes(chapter[variable])) current = state;
  }
  return current ?? (location.states ?? [])[0] ?? null;
}

/**
 * ★ WHAT THE WORLD REMEMBERS. (EVS-5)
 *
 * A location whose state is no longer its first one has been changed by
 * something the participant did, and stays changed. That is the acceptance
 * item, and it needs no new run field: the chapter enums are already the memory.
 */
export function worldMemory(run) {
  return LOCATIONS
    .map((l) => ({ location: l, state: stateOf(l, run) }))
    .filter(({ location, state }) => state && state !== (location.states ?? [])[0])
    .map(({ location, state }) => ({
      locationId: location.id, name: location.name, tier: location.tier,
      state: state.id, what: state.what,
    }));
}

/** Locations grouped by canon's tiers, in canon's order. Crown at the top. */
export function byTier(run) {
  return TIERS.map((tier) => ({
    tier,
    locations: LOCATIONS.filter((l) => l.tier === tier.id)
      .map((l) => ({ ...l, state: stateOf(l, run) })),
  })).filter((t) => t.locations.length > 0);
}

/** Everything reachable from a starting location by following declared routes. */
export function connectedFrom(startId) {
  const index = locationIndex();
  const seen = new Set([startId]);
  const queue = [startId];
  while (queue.length) {
    const here = index.get(queue.shift());
    for (const next of here?.routes ?? []) {
      if (!seen.has(next) && index.has(next)) { seen.add(next); queue.push(next); }
    }
  }
  return seen;
}

/**
 * Everything wrong with the place model, NAMED.
 *
 * ⚠️ CONNECTEDNESS IS THE ONE THAT MATTERS. "A stack of pages" is exactly what
 * a set of locations with no routes between them is, and it would look complete
 * in review because every location is present and correct on its own.
 */
export function placeRefusals(scenes = []) {
  const out = [];
  const index = locationIndex();
  const tiers = new Set(TIERS.map((t) => t.id));

  for (const l of LOCATIONS) {
    if (!tiers.has(l.tier)) out.push({ refusal: 'location-in-unknown-tier', detail: `${l.id} -> ${l.tier}` });
    if (!(l.states ?? []).length) out.push({ refusal: 'location-has-no-state', detail: l.id });
    if (!l.derivedFrom) out.push({ refusal: 'location-cites-no-canon', detail: l.id });
    for (const r of l.routes ?? []) {
      if (!index.has(r)) out.push({ refusal: 'route-to-unknown-location', detail: `${l.id} -> ${r}` });
      // A route is a corridor, not a one-way sign: canon describes movement
      // between these places in both directions.
      else if (!(index.get(r).routes ?? []).includes(l.id)) {
        out.push({ refusal: 'route-is-one-way', detail: `${l.id} -> ${r}` });
      }
    }
  }

  // ★ The four the gate names must be connected to each other.
  const reachable = connectedFrom(REQUIRED_PLACES[0]);
  for (const id of REQUIRED_PLACES) {
    if (!index.has(id)) out.push({ refusal: 'required-place-missing', detail: id });
    else if (!reachable.has(id)) out.push({ refusal: 'required-place-unreachable', detail: id });
  }

  // ...and no location may be stranded, or it is a page nobody can walk to.
  for (const l of LOCATIONS) {
    if (!reachable.has(l.id)) out.push({ refusal: 'location-unreachable', detail: l.id });
  }

  // Every scene names locations by id, and every id resolves.
  for (const scene of scenes) {
    for (const id of scene.location_ids ?? []) {
      if (!index.has(id)) out.push({ refusal: 'scene-names-unknown-location', detail: `${scene.id} -> ${id}` });
    }
    if (!(scene.location_ids ?? []).length) {
      out.push({ refusal: 'scene-is-nowhere', detail: scene.id });
    }
  }

  // A slot named by a location must be a slot some scene declares.
  const declared = new Set(scenes.flatMap((s) => (s.asset_slots ?? []).map((a) => a.id)));
  for (const l of LOCATIONS) {
    if (l.asset_slot && !declared.has(l.asset_slot)) {
      out.push({ refusal: 'location-names-undeclared-slot', detail: `${l.id} -> ${l.asset_slot}` });
    }
  }

  return out;
}

export function assertPlaceHoldsTogether(scenes) {
  const failures = placeRefusals(scenes);
  if (failures.length) {
    throw new PlaceRefusal(failures[0].refusal, failures.map((f) => `${f.refusal}: ${f.detail}`).join('; '));
  }
  return true;
}

/**
 * ⚠️ THE VISUAL BINDING GATE, REPORTED RATHER THAN ASSUMED. (EVS-5)
 *
 * Computed from the slots themselves, so it cannot say "reviewed" while the
 * content says otherwise. `blocked` stays true until an inclusion reviewer has
 * seen every slot that names a candidate — which is `Q10`, still open.
 */
export function visualBindingStatus(scenes) {
  const slots = scenes.flatMap((s) => (s.asset_slots ?? []).map((a) => ({ ...a, scene: s.id })));
  const withCandidate = slots.filter((s) => s.candidate_ref);
  const reviewed = slots.filter((s) => s.inclusion_reviewed);
  return {
    slots: slots.length,
    candidates: withCandidate.length,
    reviewed: reviewed.length,
    boundLocations: LOCATIONS.filter((l) => l.asset_slot).length,
    blocked: reviewed.length < slots.length,
    blockedBy: reviewed.length < slots.length ? 'Q10' : null,
    designPackage: 'absent',
  };
}
