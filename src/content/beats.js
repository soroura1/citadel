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
/** R0-C05B-A — the governed arrival: who greets you, and what the first move is. */
export const ARRIVAL = Object.freeze(CONTENT.arrival);

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
  return read(root, path) !== undefined;
}

/** Resolve a dotted path to its value, or `undefined` if it does not land. */
function read(root, path) {
  let node = root;
  for (const key of String(path).split('.')) {
    if (node == null || typeof node !== 'object' || !(key in node)) return undefined;
    node = node[key];
  }
  return node;
}

/**
 * ★ R0-C05B-A — A NUMBER IN PARTICIPANT COPY IS A STATE PATH, OR IT IS NOTHING.
 *
 * The selected arrival target bakes "eight" and "six" into Bishr's welcome.
 * Baked, they are a claim with no way to be wrong: the world could staff four
 * tomorrow and the opening screen would go on saying six, confidently, forever
 * — which is the physical-versus-staffed desync this whole chapter exists to
 * expose. So arrival copy writes `{services.icu.staffedPositions}` instead, and
 * the ONLY way to get a number onto that screen is a path that resolves.
 *
 * ⛔ AND AN UNRESOLVED TOKEN THROWS rather than rendering as itself. A literal
 * "{services.icu.staffedPositions}" on the page would be obvious; a token that
 * silently emptied to "The board shows  intensive-care places" would not.
 */
export const STATE_TOKEN = /\{([A-Za-z0-9_.]+)\}/g;

/** Every state path a piece of governed copy interpolates. */
export const stateTokens = (text) =>
  [...String(text ?? '').matchAll(STATE_TOKEN)].map((match) => match[1]);

export function fillState(text, world) {
  return String(text).replace(STATE_TOKEN, (_, path) => {
    const value = read(world, path);
    if (value === undefined || value === null || typeof value === 'object') {
      throw new Error(`content-interpolates-an-unresolvable-state: ${path}`);
    }
    return String(value);
  });
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
  const ARRIVAL = content.arrival;

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

  // --- ★ R0-C05B-A, the arrival -------------------------------------------
  // The first screen is the one a participant cannot skip and cannot come back
  // to, so every part of it is checked here rather than trusted to be tidy.
  if (!ARRIVAL) {
    say('no-governed-arrival', 'arrival');
  } else {
    if (!known.has(ARRIVAL.carrier)) say('arrival-carrier-is-not-a-known-character', String(ARRIVAL.carrier));
    if (!PLACE_IDS.includes(ARRIVAL.place)) say('arrival-is-anchored-to-no-real-place', String(ARRIVAL.place));
    // ⛔ The office a participant reads on the first screen is canon's, or it
    // is invention wearing canon's clothes.
    if (!ARRIVAL.title?.text) say('arrival-carrier-has-no-office-title', 'arrival.title');
    if (!ARRIVAL.title?.source) say('arrival-title-states-no-canonical-source', 'arrival.title');

    // § 23.2 limits arrival copy to two short paragraphs. A third is a lore
    // dump, and a lore dump before play is the thing that section forbids.
    const intro = ARRIVAL.intro ?? [];
    if (intro.length !== 2) say('arrival-is-not-two-short-paragraphs', `${intro.length} paragraph(s)`);
    intro.forEach((para, index) => {
      if (!para?.text) say('arrival-paragraph-has-no-text', `arrival.intro[${index}]`);
      if (!para?.source) say('arrival-paragraph-states-no-canonical-source', `arrival.intro[${index}]`);
      interpolations(para?.text, `arrival.intro[${index}]`);
    });

    // ⛔ The contradiction is the reason the arrival exists. It must be READ
    // from the world, not asserted — so at least one paragraph must interpolate
    // both the physical and the staffed count.
    const introText = intro.map((para) => para?.text ?? '').join(' ');
    for (const path of ['services.icu.physicalPositions', 'services.icu.staffedPositions']) {
      if (!stateTokens(introText).includes(path)) {
        say('arrival-does-not-read-the-capacity-contradiction-from-state', path);
      }
    }

    operational(ARRIVAL.objective, 'arrival.objective');

    const route = ARRIVAL.route;
    if (!route?.id || !(route.id in (world.routes ?? {}))) {
      say('arrival-names-a-route-the-world-does-not-have', String(route?.id));
    } else {
      // The endpoints are the world's, not the copy's. A route labelled
      // Gate→Emergency that the world runs the other way would highlight a
      // path the objective does not describe.
      if (world.routes[route.id].from !== route.from) say('arrival-route-starts-somewhere-else', route.id);
      if (world.routes[route.id].to !== route.to) say('arrival-route-ends-somewhere-else', route.id);
    }
    for (const end of ['fromLabel', 'toLabel']) {
      if (!route?.[end]) say('arrival-route-endpoint-has-no-label', `arrival.route.${end}`);
    }

    // ★ EVERY LOOP STEP NAMES THE COMMAND IT DESCRIBES. Four words on a strip
    // that correspond to nothing the participant can do is a diagram of a game,
    // not a grammar for this one.
    const loop = ARRIVAL.loop ?? [];
    if (loop.length !== 4) say('the-play-loop-is-not-four-parts', `${loop.length} part(s)`);
    for (const part of loop) {
      if (!part?.key || !part?.label) say('play-loop-part-has-no-label', JSON.stringify(part).slice(0, 40));
      if (!part?.gloss) say('play-loop-part-explains-nothing', String(part?.key));
      if (!COMMAND_IDS.includes(part?.command)) {
        say('play-loop-part-names-no-command', `${part?.key} -> ${part?.command}`);
      }
    }

    const steps = ARRIVAL.steps ?? [];
    if (steps.length !== 4) say('the-first-use-steps-are-not-four', `${steps.length} step(s)`);
    for (const step of steps) {
      if (!step?.key || !step?.label) say('first-use-step-has-no-label', JSON.stringify(step).slice(0, 40));
    }

    const how = ARRIVAL.howPlayWorks;
    if (!how?.title) say('how-play-works-has-no-title', 'arrival.howPlayWorks');
    if (!how?.lede) say('how-play-works-explains-nothing', 'arrival.howPlayWorks');
    if (!how?.guidanceNote) say('how-play-works-does-not-say-what-turning-guidance-off-keeps', 'arrival.howPlayWorks');
    for (const [index, step] of (how?.steps ?? []).entries()) {
      if (!step?.text) say('how-play-works-step-has-no-text', `arrival.howPlayWorks.steps[${index}]`);
      // ⛔ An instruction describing a control that does not exist is worse
      // than no instruction: it teaches a participant to look for it.
      if (!COMMAND_IDS.includes(step?.command)) {
        say('how-play-works-describes-a-command-that-does-not-exist', `${index} -> ${step?.command}`);
      }
    }
    if ((how?.steps ?? []).length < 4) say('how-play-works-is-shorter-than-the-loop-it-explains', 'arrival.howPlayWorks.steps');

    for (const label of ['onLabel', 'offLabel']) {
      if (!ARRIVAL.guidance?.[label]) say('guidance-toggle-has-no-label', `arrival.guidance.${label}`);
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

  /**
   * ⛔ Every `{path}` in participant copy must land on a real, printable value.
   * A path that resolves to an object would render "[object Object]"; one that
   * resolves to nothing would silently leave a hole in a sentence about
   * capacity, which is the one sentence that must not be quietly wrong.
   */
  function interpolations(text, at) {
    for (const path of stateTokens(text)) {
      const value = read(world, path);
      if (value === undefined || value === null || typeof value === 'object') {
        say('copy-interpolates-an-unresolvable-state', `${at} -> ${path}`);
      }
    }
  }

  function operational(claim, at) {
    if (!claim?.text) { say('operational-claim-has-no-text', at); return; }
    interpolations(claim.text, at);
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
