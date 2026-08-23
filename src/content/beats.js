/**
 * R0-C05A — GOVERNED BEAT CONTENT, AND THE REASONS IT IS REFUSED.
 *
 * ============================================================================
 * WHY THIS EXISTS AT ALL
 * ============================================================================
 * The owner played the merged I1/I2 result and reported that the first ten
 * minutes read as an engine report. The state was right and the trade-off was
 * real; what was missing was a concrete purpose, a canonical person asking for
 * something, an actor-and-purpose verb, a performed response and a residue.
 *
 * The tempting fix is to write better sentences. That fails in a specific way
 * this project has already paid for: a sentence that sounds true is
 * indistinguishable, in review, from one that is. So every line here is keyed,
 * and a line that is keyed to nothing does not render — it refuses.
 *
 * ============================================================================
 * ★ TWO KINDS OF CLAIM, TWO KINDS OF KEY
 * ============================================================================
 * A **fictional** claim — what a person wants, says, or concedes — can be
 * attractive and canonically wrong. Story canon is the authority on people and
 * events (working rule 1), so every fictional line carries `source`: a citation
 * into `resilience-citadel-story/`.
 *
 * An **operational** claim — what is true of the hospital right now — can be
 * attractive and unfounded. The deterministic world is the only authority on
 * that, so every operational assertion carries either `stateKey` (a path that
 * must resolve in a real world) or `eventType` (a member of `EVENTS`).
 *
 * ⛔ AND THE CHECK RESOLVES THEM, rather than checking that the field is
 * non-empty. `services.icu.staffedPositions` passing because the string is
 * present would be the `slot.required`-on-a-string defect again: a rule with
 * nothing to key on cannot fire.
 *
 * ============================================================================
 * ⚠️ WHAT THIS IS NOT
 * ============================================================================
 * Not a scene schema, not a dialogue engine, not a quest format and not an
 * authoring system. It holds one chapter's ordinary morning. § 0.4B's
 * boundaries and the planning rule deferring a general builder through R5 both
 * forbid generalising it, and the shape is deliberately awkward to extend.
 */
import CONTENT from './chapter01-beats.json' with { type: 'json' };
import { PLACE_IDS } from '../sim/world.js';
import { EVENT_IDS } from '../sim/events.js';
import { COMMAND_IDS } from '../sim/commands.js';
import { PROJECTS } from '../sim/projects.js';

export const CHARACTERS = Object.freeze(CONTENT.characters);
export const MISSION = Object.freeze(CONTENT.mission);
export const BEATS = Object.freeze(CONTENT.beats.map((beat) => Object.freeze(beat)));
export const PROJECT_CARRIERS = Object.freeze(CONTENT.projectCarriers);

export const beatByKey = (key) => BEATS.find((beat) => beat.beat === key) ?? null;
export const carrierFor = (projectId) => PROJECT_CARRIERS[projectId] ?? null;
export const characterFor = (key) => CHARACTERS[key] ?? null;

/**
 * Surface-only pseudo-commands. They open or close a secondary view and change
 * no world state, so they are deliberately NOT registered in `COMMAND_IDS` —
 * a thing that cannot change the world should not appear in the vocabulary of
 * things that can.
 */
export const SURFACE_ACTS = Object.freeze(['open-record', 'none']);

/** The states a project carrier must be able to speak to. */
const CARRIER_STATES = Object.freeze(['working', 'disrupted', 'complete', 'verified']);

/** Resolve a dotted path, and say whether it actually landed on something. */
function resolves(root, path) {
  let node = root;
  for (const key of String(path).split('.')) {
    if (node == null || typeof node !== 'object' || !(key in node)) return false;
    node = node[key];
  }
  return node !== undefined;
}

/**
 * ★ LOAD-TIME REFUSALS, RETURNED AS A LIST.
 *
 * A list rather than a throw-on-first, for the same reason `worldProblems`
 * does it: a content mistake usually breaks several things at once, and a
 * validator that names one problem per run turns a fix into a bisect.
 *
 * @param world     a real world, used to resolve every `stateKey`
 * @param slotIds   the asset slots that exist, so a portrait reference cannot
 *                  name a slot nothing occupies. Passed in rather than
 *                  imported, which keeps content from depending on projections.
 */
export function beatRefusals(world, slotIds = [], content = CONTENT) {
  const out = [];
  const say = (refusal, detail) => out.push({ refusal, detail });

  // ⚠️ READ FROM THE ARGUMENT, NOT THE MODULE. A validator that can only ever
  // see the one correct file is a validator nothing has tested: every refusal
  // below would be unexercised, and an unexercised refusal is indistinguishable
  // from one that cannot fire. `slot.required` read off a string proved that
  // here in August, on fixtures the content never produced.
  const CHARACTERS = content.characters ?? {};
  const MISSION = content.mission;
  const BEATS = content.beats ?? [];
  const PROJECT_CARRIERS = content.projectCarriers ?? {};

  const known = new Set(Object.keys(CHARACTERS));
  const acts = new Set([...COMMAND_IDS, ...SURFACE_ACTS]);

  // --- the mission ---------------------------------------------------------
  if (!MISSION?.text) say('mission-has-no-text', 'mission');
  if (!MISSION?.source) say('mission-states-no-canonical-source', 'mission');
  if (!resolves(world, MISSION?.stateKey)) {
    say('mission-names-no-resolvable-state', String(MISSION?.stateKey));
  }

  // --- the people ----------------------------------------------------------
  for (const [key, person] of Object.entries(CHARACTERS)) {
    if (!person.name) say('character-has-no-name', key);
    if (!person.office) say('character-has-no-office', key);
    // ⛔ A character invented for a convenient line is the failure this check
    // exists for. Canon owns the cast.
    if (!person.source) say('character-states-no-canonical-source', key);
    if (!person.portraitSlot) say('character-names-no-portrait-slot', key);
    else if (slotIds.length && !slotIds.includes(person.portraitSlot)) {
      // ⚠️ A filename is never an identity, and neither is a slot id nothing
      // occupies. Naming a slot that does not exist would render an identity
      // that silently has no image and no declared budget.
      say('character-names-a-slot-that-does-not-exist', `${key} -> ${person.portraitSlot}`);
    }
  }

  // --- the beats -----------------------------------------------------------
  const seen = new Set();
  for (const beat of BEATS) {
    const at = beat.beat ?? '(unnamed)';
    if (!beat.beat) say('beat-has-no-stable-key', JSON.stringify(beat).slice(0, 40));
    if (seen.has(beat.beat)) say('duplicate-beat-key', beat.beat);
    seen.add(beat.beat);

    if (!known.has(beat.carrier)) say('beat-carrier-is-not-a-known-character', `${at} -> ${beat.carrier}`);
    if (!PLACE_IDS.includes(beat.place)) say('beat-is-anchored-to-no-real-place', `${at} -> ${beat.place}`);
    if (!beat.title) say('beat-has-no-title', at);
    if (!beat.return) say('beat-leaves-nothing-unresolved', at);

    operational(beat.now, `${at}.now`);
    operational(beat.purpose, `${at}.purpose`);
    operational(beat.worldChange, `${at}.worldChange`);
    fictional(beat.request, `${at}.request`, false);
    fictional(beat.response, `${at}.response`, true);

    for (const field of ['protects', 'costs', 'unknown']) {
      if (!beat.preview?.[field]) say('beat-preview-is-incomplete', `${at}.${field}`);
    }
    for (const [name, action] of [['act', beat.act], ['continue', beat.continue]]) {
      if (!action?.label) say('beat-action-has-no-label', `${at}.${name}`);
      // ⛔ An act must reach a real command or be an explicitly declared surface
      // act. Anything else is a button that promises something nothing performs.
      if (!acts.has(action?.command)) say('beat-action-reaches-no-command', `${at}.${name} -> ${action?.command}`);
    }
  }

  // --- ★ project carriers, checked in BOTH directions ----------------------
  // A missing carrier leaves a commissioned project with nobody to answer for
  // it; a surplus carrier is content for a project that no longer exists, and
  // it would sit there looking correct.
  const projectIds = PROJECTS.map((project) => project.id);
  for (const id of projectIds) {
    if (!PROJECT_CARRIERS[id]) say('project-has-no-situated-carrier', id);
  }
  for (const id of Object.keys(PROJECT_CARRIERS)) {
    if (!projectIds.includes(id)) say('carrier-names-a-project-that-does-not-exist', id);
  }

  for (const [id, carrier] of Object.entries(PROJECT_CARRIERS)) {
    if (!known.has(carrier.carrier)) say('carrier-is-not-a-known-character', `${id} -> ${carrier.carrier}`);
    if (!PLACE_IDS.includes(carrier.workPlace)) say('carrier-works-in-no-real-place', `${id} -> ${carrier.workPlace}`);
    if (!carrier.commissionAct) say('carrier-has-no-commission-act', id);
    if (!carrier.verifyAct) say('carrier-has-no-verification-act', id);
    if (!carrier.protects) say('carrier-states-nothing-protected', id);
    if (!carrier.unknown) say('carrier-states-nothing-unknown', id);
    if (!carrier.residue) say('carrier-leaves-no-residue', id);
    fictional(carrier.request, `${id}.request`, false);
    // ⛔ Every ladder state a participant can reach must have a person who can
    // answer for it. A `disrupted` project with no line is where plausible
    // filler prose would arrive.
    for (const state of CARRIER_STATES) fictional(carrier[state], `${id}.${state}`, true);
  }

  return out;

  function operational(claim, at) {
    if (!claim?.text) { say('operational-claim-has-no-text', at); return; }
    const hasState = 'stateKey' in (claim ?? {});
    const hasEvent = 'eventType' in (claim ?? {});
    if (!hasState && !hasEvent) {
      // ⛔ THE CENTRAL RULE. An assertion about the hospital that names neither
      // a state field nor an event is a claim with no way to be wrong.
      say('operational-claim-names-no-state-or-event', at);
      return;
    }
    if (hasState && !resolves(world, claim.stateKey)) {
      say('operational-claim-names-an-unresolvable-state', `${at} -> ${claim.stateKey}`);
    }
    if (hasEvent && !EVENT_IDS.includes(claim.eventType)) {
      say('operational-claim-names-an-event-that-cannot-happen', `${at} -> ${claim.eventType}`);
    }
  }

  function fictional(line, at, needsSpeaker) {
    if (!line?.line) { say('fictional-line-is-missing', at); return; }
    if (!line.source) say('fictional-line-states-no-canonical-source', at);
    if (needsSpeaker) {
      if (!known.has(line.by)) say('fictional-line-has-no-known-speaker', `${at} -> ${line.by}`);
      if (!PLACE_IDS.includes(line.place)) say('fictional-line-is-spoken-nowhere', `${at} -> ${line.place}`);
    }
  }
}
