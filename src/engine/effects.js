/**
 * Effect application — the four typed operations. (R3 C5)
 *
 * `DEC-009`: the rules live here, in `citadel`, not in `contracts`. The browser
 * and the server share this repository, so publishing a rule no other service
 * consumes would cost a tag-and-pin cycle per change and buy nothing.
 */

import { SEASON_VARIABLES, BANDS, isSeasonVariable, moveBand, HIGHER_IS_WORSE } from './season-variables.js';

export class EffectRefusal extends Error {
  constructor(refusal, detail) {
    super(detail ? `${refusal}: ${detail}` : refusal);
    this.refusal = refusal;
    this.detail = detail;
  }
}

/** `DEC-028`, proposed: canon writes +1/-1 and defines no mapping to these. */
const MAGNITUDE_STEPS = Object.freeze({ slight: 1, moderate: 1, major: 2 });

/**
 * Apply one effect to a state, returning a NEW state.
 *
 * Immutable deliberately: a run is a sequence of states, and save/resume (C12)
 * plus the traceback R4 needs both depend on being able to say what the state
 * was BEFORE a decision, not merely after it.
 */
export function applyEffect(state, effect) {
  const next = {
    season: { ...state.season },
    chapter: { ...state.chapter },
    log: [...(state.log ?? [])],
  };

  switch (effect.operation) {
    case 'set_enum': {
      // Chapter-local discrete state (C4) — C1_CRITICAL_PATH and friends.
      // Deliberately NOT a season variable: it does not band, and it does not
      // carry across chapters.
      if (!effect.enum_variable || effect.enum_value === undefined) {
        throw new EffectRefusal('effect-incomplete', 'set_enum needs both enum_variable and enum_value');
      }
      next.chapter[effect.enum_variable] = effect.enum_value;
      break;
    }

    case 'increment':
    case 'decrement': {
      const v = effect.variable;
      // ★ An invented variable is refused BY NAME. Silently creating one is how
      // a corpus grows state nobody can read.
      if (!isSeasonVariable(v)) {
        throw new EffectRefusal(
          'unknown-season-variable',
          `${v} is not one of V1-V11 (${Object.keys(SEASON_VARIABLES).join(', ')})`,
        );
      }
      const steps = MAGNITUDE_STEPS[effect.magnitude];
      if (!steps) throw new EffectRefusal('effect-incomplete', `unknown magnitude: ${effect.magnitude}`);
      const direction = effect.operation === 'increment' ? 1 : -1;
      next.season[v] = moveBand(next.season[v], direction * steps);
      break;
    }

    case 'set_band': {
      if (!isSeasonVariable(effect.variable)) {
        throw new EffectRefusal('unknown-season-variable', `${effect.variable} is not one of V1-V11`);
      }
      next.season[effect.variable] = effect.band;
      break;
    }

    default:
      throw new EffectRefusal('unknown-effect-operation', String(effect.operation));
  }

  // ★ Every application is recorded, with the delay it carries.
  //
  // R4 needs to answer "why did this happen?" three chapters later. That answer
  // is only constructible if the link was written down WHEN THE DECISION WAS
  // MADE. Reconstructing it afterwards is guessing, and the prior attempt ended
  // with a story whose payoff nobody could trace.
  next.log.push({
    operation: effect.operation,
    target: effect.variable ?? effect.enum_variable,
    delay: effect.delay,
    visible: effect.visible,
  });

  return next;
}

/**
 * Apply the effects of a chosen option.
 *
 * ⚠️ Only `immediate` effects land now. Everything else is RECORDED AND HELD —
 * the delayed consequence is the product's most valuable mechanic, and R4 is
 * what makes a held effect arrive. Building the vocabulary at R3 is deliberate:
 * the prior attempt built consequence last and shipped a story with no payoff.
 */
export function applyOption(state, option) {
  let next = { ...state, pending: [...(state.pending ?? [])] };

  for (const effect of option.effects ?? []) {
    if (effect.delay === 'immediate') {
      next = { ...applyEffect(next, effect), pending: next.pending };
    } else {
      next.pending.push({ ...effect, owedFrom: option.id });
    }
  }
  return next;
}

/**
 * What the player should SEE change. C9.
 *
 * ⚠️ BOTH season bands AND chapter state. An earlier version reported only
 * season variables, so an option whose whole cost was a chapter enum -- which
 * is most of Chapter 1's real decisions -- produced a turn where NOTHING
 * appeared to happen. A decision that visibly changes nothing reads as a
 * decision that did not matter, which is the opposite of the proposition.
 */
export function visibleChanges(before, after) {
  const seasonMoves = Object.keys(after.season)
    .filter((v) => before.season[v] !== after.season[v])
    .map((v) => ({
      kind: 'season',
      variable: v,
      from: before.season[v],
      to: after.season[v],
      // V8 is harm: a rise is a worsening. Rendering it as a gain would
      // congratulate the player for hurting somebody.
      worsened: HIGHER_IS_WORSE.includes(v)
        ? BANDS.indexOf(after.season[v]) > BANDS.indexOf(before.season[v])
        : BANDS.indexOf(after.season[v]) < BANDS.indexOf(before.season[v]),
    }));

  const chapterMoves = Object.keys(after.chapter)
    .filter((k) => before.chapter[k] !== after.chapter[k])
    .map((k) => ({
      kind: 'chapter',
      variable: k,
      from: before.chapter[k] ?? null,
      to: after.chapter[k],
      // A discrete state is not better or worse. Saying otherwise would invent
      // a ranking canon does not have.
      worsened: null,
    }));

  return [...seasonMoves, ...chapterMoves];
}
