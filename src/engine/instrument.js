/**
 * ★ THE FIVE OPERATIONAL INSTRUMENTS, AND THE ACT OF PLACING TWO SIDE BY SIDE. (SG-1 C2)
 *
 * ============================================================================
 * THE PARTICIPANT COULD READ EVERYTHING AND COMPARE NOTHING
 * ============================================================================
 * EVS-4 made the instruments consultable: inspect the Hall display, inspect the
 * electrical sequence, and a paragraph appended under "what you know so far".
 * The SG-1 audit found what that leaves out. Chapter 1's argument is that the
 * Hall is RIGHT about the bus and WRONG about the bay — and holding both facts
 * in a list is not the same act as putting them beside each other. Comparison
 * happened in the participant's head or not at all.
 *
 * So an instrument declares what it is and what it must never imply, and a
 * comparison is a thing the participant DOES, producing a contradiction they
 * can carry and cite later.
 *
 * ============================================================================
 * ⛔ `unavailable` IS A STATE, NOT AN ERROR — AND IT IS THE WHOLE CHAPTER
 * ============================================================================
 * Canon builds this into the objects themselves. The Measure's weight room
 * holds one weight per DECLARED dependency and "shows nothing at all when a
 * dependency was never declared". A burned-out wick on the slate map "reads
 * exactly like a service that has stopped reporting". The message rail's amber
 * shutter means SENT, NOT ANSWERED — and canon is explicit that it does not
 * mean not received, and does not mean received and not understood, "and the
 * difference between those three has cost people their lives".
 *
 * An engine that models silence as failure cannot express any of that. So
 * `unavailable` is a first-class reading state, and nothing in this module
 * treats it as a problem to be handled.
 *
 * ⚠️ THE READINGS ARE NOT HERE. A reading is EVIDENCE: it has a source, it is
 * held only by someone who went and looked, and it may be partial. A parallel
 * store of instrument readings beside `scene.evidence` would be one thing
 * defined twice, and the two would disagree the first time either moved.
 */

import INSTRUMENTS from '../content/instruments.json' with { type: 'json' };

export class InstrumentRefusal extends Error {
  constructor(refusal, detail) {
    super(detail ? `${refusal}: ${detail}` : refusal);
    this.refusal = refusal;
    this.detail = detail;
  }
}

export const INSTRUMENT_VERSION = INSTRUMENTS.version;
export const INSTRUMENTS_ALL = Object.freeze(
  INSTRUMENTS.instruments.map((i) => Object.freeze({ ...i })));
export const instrumentIndex = () => new Map(INSTRUMENTS_ALL.map((i) => [i.id, i]));

/** The five reading states. `unavailable` is one of them, deliberately. */
export const READING_STATES = Object.freeze(
  ['known', 'uncertain', 'conflicting', 'unavailable', 'changed']);

/**
 * Every reading a run currently holds, grouped by instrument.
 *
 * Derived from held evidence, never stored: a second copy of "what the board
 * says now" would disagree with the evidence the moment one was updated, and
 * the participant would be shown a reading they never took.
 */
export function readingsHeld(scenes, held) {
  const out = new Map();
  for (const scene of scenes) {
    for (const e of scene.evidence ?? []) {
      if (!e.reading || !held.has(e.id)) continue;
      const list = out.get(e.reading.instrument) ?? [];
      list.push({
        evidenceId: e.id,
        what: e.what,
        source: e.source,
        state: e.reading.state,
        mark: e.reading.mark ?? null,
      });
      out.set(e.reading.instrument, list);
    }
  }
  return out;
}

/**
 * ★ THE COMPARE ACT.
 *
 * Two instruments the participant holds readings from, placed side by side.
 * The result is not an answer — it is the disagreement, stated, with both
 * sources kept. Canon's own control on the Measure is that the reading frame
 * "cannot show two things at once", so comparison is an act with a cost rather
 * than a view that is always on.
 *
 * ⚠️ IT REFUSES RATHER THAN RETURNING EMPTY. A comparison of two instruments
 * the participant has not read is not an empty result — it is a comparison that
 * did not happen, and returning `[]` for it would let an interface offer the
 * control and show nothing.
 */
export function compare(scenes, held, aId, bId) {
  const index = instrumentIndex();
  const a = index.get(aId);
  const b = index.get(bId);
  if (!a) throw new InstrumentRefusal('unknown-instrument', aId);
  if (!b) throw new InstrumentRefusal('unknown-instrument', bId);
  if (aId === bId) throw new InstrumentRefusal('cannot-compare-an-instrument-with-itself', aId);
  if (!(a.comparable_with ?? []).includes(bId)) {
    throw new InstrumentRefusal('instruments-not-comparable', `${aId} declares no comparison with ${bId}`);
  }

  const readings = readingsHeld(scenes, held);
  const left = readings.get(aId) ?? [];
  const right = readings.get(bId) ?? [];
  if (!left.length) throw new InstrumentRefusal('nothing-read-from-instrument', aId);
  if (!right.length) throw new InstrumentRefusal('nothing-read-from-instrument', bId);

  // A disagreement is a pair of readings whose states cannot both be acted on.
  // `conflicting` says so about itself; `unavailable` beside anything else is
  // the chapter's own shape -- one instrument reporting and one silent.
  const disagrees = (x, y) =>
    x.state === 'conflicting' || y.state === 'conflicting'
    || x.state === 'unavailable' || y.state === 'unavailable';

  const pairs = [];
  for (const x of left) for (const y of right) if (disagrees(x, y)) pairs.push({ left: x, right: y });

  return {
    instruments: [a, b],
    left,
    right,
    disagreements: pairs,
    // ⚠️ NOT "agreed". Two readings that do not disagree have not been shown to
    // be consistent -- they have been shown not to contradict each other in the
    // one respect this function can see. Naming it `agreed` would be the
    // interface concluding on the participant's behalf.
    contradiction_found: pairs.length > 0,
  };
}

/**
 * Load-time refusals. Called by `loadBundle`, so a dangling instrument
 * reference fails when the bundle loads and never when a participant clicks.
 */
export function instrumentRefusals(scenes = []) {
  const out = [];
  const index = instrumentIndex();

  for (const i of INSTRUMENTS_ALL) {
    if (!(i.never_implies ?? []).length) {
      out.push({ refusal: 'instrument-implies-anything', detail: `${i.id} declares nothing it must never imply` });
    }
    for (const other of i.comparable_with ?? []) {
      if (!index.has(other)) {
        out.push({ refusal: 'instrument-comparable-with-unknown', detail: `${i.id} -> ${other}` });
      }
      // ★ COMPARISON IS SYMMETRICAL OR IT IS A ONE-WAY MIRROR. If the Hall
      // display can be compared with the chronology and not the reverse, the
      // act is available from one screen and missing from the other, and the
      // participant meets a capability that depends on where they happened to
      // start.
      const back = index.get(other);
      if (back && !(back.comparable_with ?? []).includes(i.id)) {
        out.push({ refusal: 'comparison-is-not-symmetrical', detail: `${i.id} -> ${other}, but not back` });
      }
    }
  }

  for (const scene of scenes) {
    for (const e of scene.evidence ?? []) {
      if (!e.reading) continue;
      if (!index.has(e.reading.instrument)) {
        out.push({ refusal: 'reading-of-unknown-instrument', detail: `${scene.id}/${e.id} -> ${e.reading.instrument}` });
      }
      if (!READING_STATES.includes(e.reading.state)) {
        out.push({ refusal: 'unknown-reading-state', detail: `${scene.id}/${e.id} -> ${e.reading.state}` });
      }
    }
  }
  return out;
}
