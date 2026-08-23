/**
 * R0-C05A — THE NARRATIVE PROJECTION. ONE STATE, ONE STORY.
 *
 * ============================================================================
 * THE FINDING THIS ANSWERS
 * ============================================================================
 * The owner played the merged I1/I2 build and accepted the environment and the
 * opportunity-cost mechanic in principle — then said the first ten minutes read
 * as an engine report. *An ordinary difficult day.* *Advance one cycle.*
 * *Choose two pieces of work.* Every word true, and none of them telling the
 * participant what they are protecting, who is asking, what their act will
 * cost, or what answered when they did it.
 *
 * § 0.4A binds an eight-part contract for every meaningful move:
 *
 *   situation → purpose → human carrier → player verb → fair preview
 *            → world performance → human response → residue
 *
 * This file produces all eight, from the world and its event log, and nothing
 * else. It is the same shape as `project()`: a pure reading.
 *
 * ============================================================================
 * ★ THE BEAT IS READ, NEVER STORED
 * ============================================================================
 * `classifyOrdinary` established the rule for the three ordinary states, and it
 * matters more here. If a beat name were written into the world, the narrative
 * would become a scene pointer with state attached — a cutscene system wearing
 * a simulation's clothes — and § 19.4 forbids exactly that. Nothing below
 * writes. Every beat is derived from what the world holds and what happened.
 *
 * ============================================================================
 * ★ AND IT FOLLOWS THE PARTICIPANT'S OWN CHOICE
 * ============================================================================
 * The accepted V05A/V05B proof illustrates its commitment beat with the power
 * trace and the message route, because a proof needs one concrete example. If
 * that pair were written in here, a participant who commissioned the reserve
 * and restoration ownership would watch Rami walk a route they never sent him
 * on. So the featured project comes from the most recent project event — the
 * work that actually moved — and its situated carrier is looked up from the
 * project id. The two cannot disagree, because there is only one of them.
 *
 * ⛔ AND A MISSING TRIGGER REFUSES. If the world reaches a state no governed
 * content covers, this throws by name. Falling back to a plausible sentence is
 * how an engine report becomes a *convincing* engine report.
 */
import { EVENTS } from '../sim/events.js';
import { COMMANDS } from '../sim/commands.js';
import { PROJECT_CAPACITY, PROJECTS, committed, projectById } from '../sim/projects.js';
import { BEATS, MISSION, beatByKey, carrierFor, characterFor } from '../content/beats.js';
import { GROUND } from './anchors.js';

export class NarrativeRefusal extends Error {
  constructor(reason, detail) {
    super(detail ? `${reason}: ${detail}` : reason);
    this.reason = reason;
    this.detail = detail;
  }
}

/** Beats that are authored in full, in the order the morning reaches them. */
export const AUTHORED_BEATS = Object.freeze(BEATS.map((beat) => beat.beat));

/** The world states a commissioned project can be featured in. */
const WORK_BEATS = Object.freeze({
  scheduled: 'working', working: 'working', disrupted: 'disrupted',
  complete: 'complete', verified: 'verified',
});

const person = (key) => {
  const found = characterFor(key);
  if (!found) throw new NarrativeRefusal('narrative-names-an-unknown-person', key);
  return { key, name: found.name, office: found.office, portraitSlot: found.portraitSlot };
};

/** Did the participant look at this place, at or after this cycle? */
const inspected = (events, place, fromCycle) => events.some(
  (event) => event.type === EVENTS.PLACE_INSPECTED && event.place === place && event.cycle >= fromCycle);

/** The most recent event that moved a preparedness project, or null. */
const lastProjectEvent = (events) => {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (event.type === EVENTS.PROJECT_VERIFIED || event.type === EVENTS.PROJECT_STATE_CHANGED) return event;
  }
  return null;
};

/**
 * ★ WHICH BEAT THE MORNING IS ON — derived, in one place.
 *
 * Ordered from latest to earliest, so a world that has moved on several axes is
 * named by how far it has actually got rather than by whichever branch happened
 * to be written first. The same discipline as `classifyOrdinary`.
 */
export function classifyBeat(world, events) {
  const moved = lastProjectEvent(events);
  if (moved) {
    // ★ A PERFORMED-BUT-UNTESTED PROJECT TAKES THE BEAT, even if something else
    // moved more recently. Otherwise the card speaks about the work that just
    // changed while the act beside it verifies a different project — the
    // participant reads one name and clicks another. `complete` is the state
    // that demands an act from a person, so it is the state that gets the card.
    const awaiting = committed(world).find((id) => world.projects[id].state === 'complete');
    const featured = awaiting ?? moved.project;
    const state = world.projects[featured]?.state;
    const beat = WORK_BEATS[state];
    if (!beat) throw new NarrativeRefusal('no-beat-covers-this-project-state', `${featured} is ${state}`);
    return { beat: `project-${beat}`, featured };
  }
  // The four-request window opens on the world's own rule; the participant
  // reaches the requests once they have read the capacity contradiction, which
  // is the comparison § 0.4A's beat map places at minute 5–7.
  if (world.status === 'preparation-window' && inspected(events, 'icu', 2)) return { beat: 'requests', featured: null };
  if (world.time.cycle >= 2) return { beat: 'cycle-two', featured: null };
  if (world.time.cycle === 1) return { beat: 'cycle-one', featured: null };
  return { beat: 'entry', featured: null };
}

/** Whether the authored beat's own act has been performed. */
function actedAt(beat, world, events) {
  switch (beat) {
    case 'entry': return inspected(events, 'gate', 0);
    case 'cycle-one': return inspected(events, 'ed', 1);
    case 'cycle-two': return inspected(events, 'icu', 2);
    // ★ The requests beat's act IS the commissioning, and it happens in the
    // preparedness panel rather than in the tray. So "acted" is the world fact
    // that something was taken on — not a click this projection cannot see.
    case 'requests': return committed(world).length > 0;
    default: return true;   // a work beat exists BECAUSE something was performed
  }
}

/**
 * ★ WHERE THE MISSION HAS GOT TO — counted, not asserted.
 *
 * The ribbon must not claim progress the world has not made. Every clause below
 * is a reading of a field.
 */
function missionProgress(world, events) {
  const taken = committed(world);
  const verified = taken.filter((id) => world.projects[id].state === 'verified');
  if (taken.length) {
    return `${taken.length} of ${PROJECT_CAPACITY} preparations commissioned`
      + `${verified.length ? `; ${verified.length} tested` : '; none tested yet'}`
      + `${world.residue.length ? `; ${world.residue.length} ordinary task${world.residue.length === 1 ? '' : 's'} stopped` : ''}.`;
  }
  if (inspected(events, 'icu', 2)) {
    const icu = world.services.icu;
    return `${icu.staffedPositions} of ${icu.physicalPositions} intensive-care places are staffed; the difference is being kept as evidence.`;
  }
  return 'Begin where the night shift left uncertainty.';
}

/** Displaced ordinary work, which outlives the cycle that caused it. */
const residueOf = (world) => world.residue.map((item) => ({
  id: item.id, what: item.what, where: item.where, because: item.because,
}));

/**
 * ★ EVERY REQUEST STAYS VISIBLE, including the ones that cannot be staffed.
 * The four situated requests are the same four projects the window offers, in
 * the same order, each carried by the person the content makes responsible.
 */
export function projectRequests(world) {
  return PROJECTS.map((project) => {
    const carrier = carrierFor(project.id);
    if (!carrier) throw new NarrativeRefusal('project-has-no-situated-carrier', project.id);
    const entry = world.projects[project.id];
    return {
      project: project.id,
      name: project.name,
      carrier: person(carrier.carrier),
      supporting: carrier.supporting,
      request: carrier.request.line,
      // ⛔ Protects and unknown are governed content; the cost is the engine's
      // own displaced work, so the panel cannot understate it.
      protects: carrier.protects,
      costs: `${project.displaces.what} stops, because ${project.displaces.because}.`,
      unknown: carrier.unknown,
      commissionAct: carrier.commissionAct,
      verifyAct: carrier.verifyAct,
      state: entry.state,
    };
  });
}

/** ★ THE WHOLE CONTRACT, FOR THE BEAT THE MORNING IS ACTUALLY ON. */
export function projectNarrative(world, events) {
  const { beat, featured } = classifyBeat(world, events);
  const mission = { text: MISSION.text, until: MISSION.until, progress: missionProgress(world, events) };
  const residue = residueOf(world);

  if (beat.startsWith('project-')) return workBeat(world, events, beat, featured, mission, residue);

  const content = beatByKey(beat);
  if (!content) throw new NarrativeRefusal('no-governed-content-for-beat', beat);
  const acted = actedAt(beat, world, events);
  const carrier = person(content.carrier);

  // ⚠️ The four-request beat keeps every requester visible until a commitment
  // exists, then reduces to the person carrying the response — visual bible
  // § 22.2, and the reason the portrait stack has two declared sizes.
  const speakers = beat === 'requests' && !acted
    ? projectRequests(world).map((request) => request.carrier)
    : [acted ? person(content.response.by) : carrier];

  return {
    beat, mission, acted,
    now: content.now.text,
    title: content.title,
    purpose: content.purpose.text,
    place: acted ? content.response.place : content.place,
    // ★ The card is anchored to the person's PLACE, not to a panel edge. The
    // owner rejected a permanent side panel as the dramatic carrier (§ 21.5),
    // so the request appears where the work is, over the map that holds it.
    anchor: GROUND[acted ? content.response.place : content.place],
    speakers,
    // Before the act this is the request; after it, the answer. One card, two
    // states — never two cards saying different things about one moment.
    line: acted ? content.response.line : content.request.line,
    speaker: acted ? person(content.response.by) : carrier,
    act: acted ? null : { ...content.act },
    preview: acted ? null : { ...content.preview },
    worldChange: acted ? content.worldChange.text : null,
    return: acted ? content.return : null,
    next: acted ? nextFor(beat, content, world) : null,
    closed: false,
    residue,
    // ★ ALWAYS PRESENT, NOT ONLY AT THE REQUESTS BEAT. Gating this on the beat
    // made the person who asked for the work vanish the moment it started — the
    // panel fell back to a specification with no requester and no
    // protects/unknown, which is the exact treatment I2A exists to correct.
    requests: projectRequests(world),
    featured: null,
  };
}

/**
 * The continue affordance after an authored beat resolves.
 *
 * ⚠️ `advance-cycle` is refused while the clock is paused, and the run starts
 * paused. The surface therefore resumes into `act-advanced` before advancing —
 * which is exactly what that mode is for: the participant deciding they are
 * ready, rather than a timer deciding for them.
 */
function nextFor(beat, content, world) {
  if (beat === 'requests') {
    const taken = committed(world).length;
    return taken >= PROJECT_CAPACITY
      ? { label: 'Begin the commissioned work', command: COMMANDS.ADVANCE_CYCLE }
      : { label: `Begin with ${taken} of ${PROJECT_CAPACITY} commissioned`, command: COMMANDS.ADVANCE_CYCLE };
  }
  return { ...content.continue };
}

/**
 * ★ A COMMISSIONED PIECE OF WORK, ANSWERED BY THE PERSON RESPONSIBLE FOR IT.
 * Everything here is looked up from the project that actually moved. Nothing is
 * chosen because it makes a better sentence.
 */
function workBeat(world, events, beat, featured, mission, residue) {
  const project = projectById(featured);
  const carrier = carrierFor(featured);
  if (!project || !carrier) throw new NarrativeRefusal('project-has-no-situated-carrier', String(featured));
  const state = world.projects[featured].state;
  const spoken = carrier[state];
  if (!spoken) throw new NarrativeRefusal('no-carrier-line-for-project-state', `${featured} is ${state}`);

  // ★ The strongest available act, and it NAMES the project it acts on. Only
  // the responsible function can move `complete` to `verified` — time never
  // does, which is why the ladder has six states rather than five.
  const verifiable = committed(world).filter((id) => world.projects[id].state === 'complete');
  const stillWorking = committed(world).filter(
    (id) => ['scheduled', 'working', 'disrupted'].includes(world.projects[id].state));

  // ⛔ AND WHEN THERE IS NOTHING LEFT TO DO, THERE IS NO BUTTON. With no active
  // work and nothing awaiting a test, an advance emits a cycle in which nothing
  // happens — a control that succeeds silently teaches the same distrust as one
  // that declines silently. The slice closes on its residue and its unanswered
  // question instead, which is what § 0.4B asks it to close on.
  const next = verifiable.length
    ? { label: carrierFor(verifiable[0]).verifyAct, command: COMMANDS.VERIFY_PROJECT, project: verifiable[0] }
    : stillWorking.length
      ? { label: `Let ${person(carrierFor(stillWorking[0]).carrier).name} carry on`, command: COMMANDS.ADVANCE_CYCLE }
      : null;

  return {
    beat, mission, acted: true,
    now: nowFor(state, project, world),
    title: project.name,
    purpose: carrier.protects,
    place: spoken.place,
    anchor: GROUND[spoken.place],
    speakers: [person(spoken.by)],
    line: spoken.line,
    speaker: person(spoken.by),
    act: null,
    preview: null,
    worldChange: worldChangeFor(project, events),
    return: returnFor(state, carrier, project, world),
    next,
    // The slice has run out of commissioned work; say so rather than offering a
    // cycle that changes nothing.
    closed: !next,
    residue,
    requests: projectRequests(world),
    featured,
  };
}

/** The situation, stated from the project's own state. */
function nowFor(state, project, world) {
  const at = world.time.bell === 'first' ? 'First Bell' : world.time.bell === 'second' ? 'Second Bell' : 'Third Bell';
  switch (state) {
    case 'scheduled':
    case 'working': return `${at}. ${project.responsibleFunctions.join(' and ')} have left ordinary work to do this.`;
    case 'disrupted': return `${at}. The work stopped with its site still occupied.`;
    case 'complete': return `${at}. The work was performed. Nobody has tested it.`;
    case 'verified': return `${at}. The responsible function tested the result and recorded where it came from.`;
    default: throw new NarrativeRefusal('no-situation-for-project-state', state);
  }
}

/**
 * ★ THE WORLD PERFORMED SOMETHING; SAY WHAT, FROM THE EVENT THAT SAID IT.
 * `because` was recorded when the change happened. Reconstructing it here by
 * comparing two snapshots would be a guess about which difference mattered.
 */
function worldChangeFor(project, events) {
  const moved = lastProjectEvent(events);
  if (!moved?.because) throw new NarrativeRefusal('a-work-beat-with-no-event-behind-it', project.id);
  return capitalise(moved.because);
}

function returnFor(state, carrier, project, world) {
  if (state === 'verified') return carrier.residue;
  if (state === 'disrupted') {
    const holder = committed(world).find((id) => id !== project.id
      && ['scheduled', 'working'].includes(world.projects[id].state));
    return holder
      ? `${projectById(holder).name} holds what this needs. This resumes when it comes free.`
      : 'This resumes when what it needs comes free.';
  }
  if (state === 'complete') return project.verification;
  return `Still owed: ${project.displaces.what.toLowerCase()}.`;
}

const capitalise = (text) => text.charAt(0).toUpperCase() + text.slice(1);
