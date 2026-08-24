/**
 * R0-C05B-A — THE ARRIVAL, AS A READING OF THE WORLD.
 *
 * ============================================================================
 * THE FINDING THIS ANSWERS
 * ============================================================================
 * The owner walked the deployed `4b0909f` build without a briefing and found
 * three things at once: the first act could fall below the viewport, the same
 * command could be reached from more than one region, and the human response
 * could return above the participant's scroll position. § 0.4C's correction is
 * not "explain more". It is: one person greets you, one contradiction is
 * stated, one route is highlighted, one control owns the act — and then the
 * greeting gets out of the way.
 *
 * ============================================================================
 * ★ THERE IS NO TUTORIAL STAGE, AND THAT IS THE WHOLE DESIGN
 * ============================================================================
 * The obvious implementation is a `tutorialStep` counter that the surface
 * increments. It would work, it would be easy, and it would be a second
 * simulation: two authorities on where the morning has got to, drifting the
 * first time one of them forgot to advance. § 0.4C forbids it by name —
 * "the guidance state is derived from the existing world and events, never
 * stored as a second story or simulation state".
 *
 * So this file writes nothing. `phase` is a reading of the beat the narrative
 * already derived; every loop and step state is a reading of the event log. Two
 * participants whose worlds hold identical events see identical guidance,
 * because there is nothing else for it to depend on.
 *
 * ============================================================================
 * ★ BISHR ORIENTS. HE DOES NOT KNOW MORE THAN HE CAN KNOW.
 * ============================================================================
 * Canon is exact about the boundary (`cast-directions-v0.1.md` § 9): he
 * "introduces places, explains customs, and supports player orientation
 * without becoming an all-knowing narrator", and his strength is remembering
 * "routes, names, losses, and unofficial acts of care that formal records
 * overlook". So he may say the lived route disagrees with the board. He may not
 * name the electrical fault of Scene 2, decide a preparation, or speak for
 * another portfolio — and the League of Care is absent from Chapters 1–3 by
 * matrix rule 8, so nothing here may reach for a mentor.
 *
 * None of that is enforceable by a type. It is enforced by the fact that every
 * line comes from governed content that carries a canonical source, and by the
 * tests in `test/guided-arrival.test.js` that read the content for the words a
 * boundary violation would need.
 */
import { EVENTS } from '../sim/events.js';
import { COMMANDS } from '../sim/commands.js';
import { PROJECT_CAPACITY, committed } from '../sim/projects.js';
import { ARRIVAL, characterFor, fillState } from '../content/beats.js';
import { GROUND, ROUTE_PATHS } from './anchors.js';

export class GuidanceRefusal extends Error {
  constructor(reason, detail) {
    super(detail ? `${reason}: ${detail}` : reason);
    this.reason = reason;
    this.detail = detail;
  }
}

/** The beat guidance introduces. Everything after it belongs to a later slice. */
export const ARRIVAL_BEAT = 'entry';

/**
 * ★ ONE COMMAND, ONE OWNER — NAMED HERE SO A SURFACE CANNOT DISAGREE.
 *
 * The audit found the same command enabled in three regions, so the projection
 * now says which region owns it. A surface that renders a control for a command
 * it does not own is a defect a test can state, rather than a judgement call in
 * review.
 */
export const OWNERS = Object.freeze({
  /** The arrival's dominant act, while the arrival is on screen. */
  ARRIVAL: 'arrival-guide',
  /** The commitment tray, once the arrival has retracted or guidance is off. */
  TRAY: 'commitment-tray',
});

/** The three states the arrival passes through, all of them read. */
export const PHASES = Object.freeze(['arrival', 'returning', 'in-play']);

/** Has this kind of act ever happened? Read from the log, never from a flag. */
const OCCURRED = Object.freeze({
  [COMMANDS.INSPECT_PLACE]: (events) => events.some((e) => e.type === EVENTS.PLACE_INSPECTED),
  [COMMANDS.SCHEDULE_PROJECT]: (events) => events.some((e) => e.type === EVENTS.PROJECT_SCHEDULED),
  [COMMANDS.ADVANCE_CYCLE]: (events) => events.some((e) => e.type === EVENTS.CYCLE_COMPLETED),
  [COMMANDS.VERIFY_PROJECT]: (events) => events.some((e) => e.type === EVENTS.PROJECT_VERIFIED),
});

/**
 * ★ THE FOUR-PART GRAMMAR IS A RHYTHM, NOT A PROGRESS BAR.
 *
 * Observe → Decide → Watch → Respond repeats for every meaningful move, so a
 * step can honestly be `done` (it has happened at least once) while a step
 * before it in the reading order is still `ahead`. `current` wins over `done`,
 * because the step you are on is the more useful thing to say about it.
 *
 * ⛔ AND THERE IS NO PERCENTAGE. R0-C05 established why: a ring at 100% cannot
 * say which of two different things happened. The same objection applies to a
 * tutorial that says "3 of 4 complete".
 */
function loopStates(events, currentCommand) {
  return ARRIVAL.loop.map((part) => {
    const occurred = OCCURRED[part.command];
    if (!occurred) throw new GuidanceRefusal('play-loop-part-names-no-command', part.command);
    const state = part.command === currentCommand ? 'current' : occurred(events) ? 'done' : 'ahead';
    return { key: part.key, label: part.label, gloss: part.gloss, command: part.command, state };
  });
}

/**
 * The first-use steps ARE linear — they describe this morning once, in order —
 * so they are derived as "the first one not yet done".
 */
function stepStates(world, events) {
  const done = [
    events.some((event) => event.type === EVENTS.PLACE_INSPECTED),
    world.time.cycle >= 1,
    committed(world).length >= PROJECT_CAPACITY,
    committed(world).some((id) => ['complete', 'verified'].includes(world.projects[id].state)),
  ];
  const current = done.indexOf(false);
  return ARRIVAL.steps.map((step, index) => ({
    key: step.key,
    label: step.label,
    state: done[index] ? 'done' : index === current ? 'current' : 'ahead',
  }));
}

/** The person greeting you, with the office canon gives them. */
function guide() {
  const found = characterFor(ARRIVAL.carrier);
  if (!found) throw new GuidanceRefusal('arrival-names-an-unknown-person', ARRIVAL.carrier);
  return {
    key: ARRIVAL.carrier,
    name: found.name,
    office: found.office,
    // ★ "Guide of the Ways" is the OFFICE canon names, and offices are used
    // without a surname (`sensory-canon-v0.1.md`). "Patient navigator" is the
    // public role, which is a different fact and stays a different field.
    title: ARRIVAL.title.text,
    portraitSlot: found.portraitSlot,
  };
}

/**
 * ★ THE ARRIVAL, AND THEN THE MORNING.
 *
 * @param world      the deterministic world
 * @param events     its event log
 * @param narrative  the beat `projectNarrative` already derived — passed in
 *                   rather than recomputed, so guidance cannot name a different
 *                   beat, act or speaker from the card beside it.
 */
export function projectGuidance(world, events, narrative) {
  const arriving = narrative.beat === ARRIVAL_BEAT && !narrative.acted;
  const returning = narrative.beat === ARRIVAL_BEAT && narrative.acted;

  // The act the arrival owns is the beat's own act — there is no second one.
  const act = arriving ? narrative.act : null;
  if (arriving && !act) throw new GuidanceRefusal('the-arrival-has-no-act-to-own', narrative.beat);
  if (arriving && act.command !== COMMANDS.INSPECT_PLACE) {
    // The arrival's promise is that the route will be READ. An act that changed
    // the world instead would make the preview a lie before it was written.
    throw new GuidanceRefusal('the-arrival-act-does-not-inspect', act.command);
  }

  const currentCommand = narrative.act?.command ?? narrative.next?.command ?? null;

  return {
    phase: arriving ? 'arrival' : returning ? 'returning' : 'in-play',
    /** Which surface may render the beat's act. Exactly one, always. */
    owner: arriving ? OWNERS.ARRIVAL : OWNERS.TRAY,
    /**
     * ★ AND WHO OWNS THE NEXT PROGRESSION ACT.
     *
     * The audit's second finding was one command reachable from several
     * regions. Through the arrival beat the narrative surface owns progression
     * outright, so the time controls stop borrowing its label and go back to
     * being a clock. Bounded to this beat on purpose: the same correction for
     * the ordinary cycles is Slice B's, and doing it here would be building
     * past the gate.
     */
    ownsProgression: arriving || returning,
    guide: guide(),
    place: ARRIVAL.place,
    anchor: GROUND[ARRIVAL.place],
    // ⛔ Filled here, from this world. See `fillState`: the only way a number
    // reaches the opening screen is a state path that resolves.
    intro: ARRIVAL.intro.map((para) => fillState(para.text, world)),
    objective: {
      text: ARRIVAL.objective.text,
      /**
       * ★ THE HIGHLIGHT IS THE WHOLE ROUTE, and the occupied head is a
       * different fact drawn on top of it. `anchors.js` is explicit: "A ROUTE IS
       * THE WHOLE PATH, ALWAYS. What changes with state is how much of it is
       * occupied." Lighting only the occupied portion would tell a participant
       * the corridor itself ended where the queue does.
       */
      route: {
        ...ARRIVAL.route,
        path: ROUTE_PATHS[ARRIVAL.route.id],
        fromAnchor: GROUND[ARRIVAL.route.from],
        toAnchor: GROUND[ARRIVAL.route.to],
      },
    },
    act: act ? { ...act } : null,
    preview: arriving && narrative.preview ? { ...narrative.preview } : null,
    loop: loopStates(events, currentCommand),
    steps: stepStates(world, events),
    howPlayWorks: {
      title: ARRIVAL.howPlayWorks.title,
      lede: ARRIVAL.howPlayWorks.lede,
      steps: ARRIVAL.howPlayWorks.steps.map((step) => step.text),
      guidanceNote: ARRIVAL.howPlayWorks.guidanceNote,
    },
    labels: { on: ARRIVAL.guidance.onLabel, off: ARRIVAL.guidance.offLabel },
    /**
     * ★ THE RETURN, IN THE ORDER § 23.3 ASKS FOR: the route performed, then the
     * person's observation, then one useful fact and one open question. All
     * four are read off the narrative, so the guidance cannot report a return
     * the card denies.
     */
    return: returning
      ? {
          speaker: narrative.speaker,
          observation: narrative.line,
          fact: narrative.worldChange,
          question: narrative.return,
        }
      : null,
  };
}
