/**
 * ★ OPPORTUNITY: A NAMED HOLDER IN A NAMED STATE. (SG-1 C3)
 *
 * ============================================================================
 * EVERY ACTION WAS FREE, SO THERE WAS NOTHING TO CHOOSE
 * ============================================================================
 * The SG-1 before-state audit measured it: seventeen actions across the
 * chapter, all free, all repeatable in effect, and exactly one gate in the
 * whole of Chapter 1 -- and that gate was a knowledge prerequisite, not a cost.
 * A participant who inspected everything was strictly better off than one who
 * chose. That is the difference between a strategy and a narration, and it is
 * this module's whole reason for existing.
 *
 * ============================================================================
 * ⛔ THERE IS NO NUMBER IN HERE, AND ADDING ONE CHANGES WHAT THE PRODUCT IS
 * ============================================================================
 * Canon names time, trust, workload, service capacity and evidence as this
 * world's currencies and sets no prices for any of them. This repository
 * already wrote the rule down at EVS-4: "a cost is a declared note in canon's
 * own currency, never a quantity. Nothing sums them."
 *
 * So a capability has no amount, no remaining and no pool. It has a HOLDER --
 * Nour, the mobile set, Rami, the lower route, the source-marked timeline --
 * and a holder can be in one place doing one thing. The constraint is
 * EXCLUSIVITY, and exclusivity survives the removal of every clock, which is
 * exactly why the non-timed accessibility path carries the same trade-off
 * rather than a relaxed one.
 *
 * ⚠️ AND THE STATE IS DERIVED FROM WHAT WAS COMMITTED, NOT STORED BESIDE IT.
 * The run already records the option committed to. A second store of "what is
 * committed now" would disagree with it the first time either moved -- the same
 * defect the place model refused when it derived world memory from the chapter
 * enums instead of keeping its own copy.
 */

import CAPABILITIES from '../content/capabilities.json' with { type: 'json' };
import { instrumentIndex } from './instrument.js';
import { locationIndex } from './place.js';

export class OpportunityRefusal extends Error {
  constructor(refusal, detail) {
    super(detail ? `${refusal}: ${detail}` : refusal);
    this.refusal = refusal;
    this.detail = detail;
  }
}

export const CAPABILITY_VERSION = CAPABILITIES.version;
export const CAPABILITIES_ALL = Object.freeze(
  CAPABILITIES.capabilities.map((c) => Object.freeze({ ...c })));
export const capabilityIndex = () => new Map(CAPABILITIES_ALL.map((c) => [c.id, c]));

/** Three states, and no fourth. `available` is the absence of the other two. */
export const CAPABILITY_STATES = Object.freeze(['available', 'committed', 'consumed']);

/**
 * What each capability is doing now, derived from the run's own history.
 *
 * ⚠️ `consumed` OUTRANKS `committed`, AND NEITHER IS EVER UNDONE HERE. A
 * capability released back to `available` by a later commitment would let a
 * participant recover a cost by choosing again, which is the shape of an undo
 * -- and this product does not support rewinding a consequence. Recovery is
 * authored and earned, never decayed back.
 */
export function capabilityStates(run, bundle) {
  const state = new Map(CAPABILITIES_ALL.map((c) => [c.id, {
    capability: c, state: 'available', committedFor: null, byOption: null,
  }]));

  for (const entry of run?.history ?? []) {
    const decision = bundle?.decision?.(entry.decisionId);
    const option = decision?.options?.find((o) => o.id === entry.optionId);
    for (const commit of option?.commits ?? []) {
      const current = state.get(commit.capability);
      if (!current) continue;                       // refused at load; not re-refused per act
      if (current.state === 'consumed') continue;   // nothing outranks consumed
      current.state = commit.becomes;
      current.committedFor = commit.for ?? null;
      current.byOption = option.id;
    }
  }
  return state;
}

/**
 * ★ WHAT THE PARTICIPANT IS TOLD, AND IN WHOSE WORDS.
 *
 * Never a total, never a remaining count, never a comparison between pathways.
 * The holder's own account of what is available, and -- once committed -- where
 * they are and what they are doing.
 */
export function readCapability(id, run, bundle) {
  const current = capabilityStates(run, bundle).get(id);
  if (!current) throw new OpportunityRefusal('unknown-capability', id);
  const c = current.capability;
  return {
    id: c.id,
    nameKey: c.name_key,
    heldBy: c.held_by,
    howKnown: c.how_known,
    state: current.state,
    // The holder's own words about what is available. Prose, from canon.
    available: c.available_state,
    committedFor: current.committedFor,
    closes: current.state === 'available' ? [] : (c.closes ?? []),
    residue: current.state === 'available' ? null : (c.residue ?? null),
  };
}

/**
 * ★ WHY AN ACT IS UNAVAILABLE, IN THE VOICE OF WHOEVER HOLDS THE CONSTRAINT.
 *
 * Canon: "the relevant professional explains the binding constraint and
 * requires another pathway. THIS IS AUTHORITY, NOT A GAME HINT."
 *
 * So an unavailable option is never greyed out in silence and never absent. It
 * names the capability, the holder, and what committing it already closed --
 * which is the difference between a refusal a professional would make and a
 * disabled button.
 */
export function bindingConstraint(option, run, bundle) {
  const states = capabilityStates(run, bundle);
  for (const commit of option?.commits ?? []) {
    const current = states.get(commit.capability);
    if (!current) continue;
    if (current.state === 'consumed') {
      return {
        refusal: 'capability-already-consumed',
        capability: commit.capability,
        heldBy: current.capability.held_by,
        because: current.capability.closes ?? [],
        committedFor: current.committedFor,
      };
    }
  }
  return null;
}

/**
 * Load-time refusals. A capability that cannot be read, a commitment pointing
 * at nothing, or a residue bound to something that does not exist, all fail
 * when the bundle loads.
 */
export function opportunityRefusals(decisions = []) {
  const out = [];
  const caps = capabilityIndex();
  const instruments = instrumentIndex();

  for (const c of CAPABILITIES_ALL) {
    // ★ A CAPABILITY THE PARTICIPANT CANNOT READ IS A HIDDEN VARIABLE, and a
    // hidden variable that closes an option is the definition of an arbitrary
    // game. The schema requires an instrument id; this requires that it EXISTS.
    if (!instruments.has(c.how_known)) {
      out.push({ refusal: 'capability-read-from-unknown-instrument', detail: `${c.id} -> ${c.how_known}` });
    }
    if (!(c.closes ?? []).length) {
      out.push({ refusal: 'capability-closes-nothing', detail: `${c.id} costs nothing to commit` });
    }
  }

  for (const d of decisions) {
    for (const o of d.options ?? []) {
      for (const commit of o.commits ?? []) {
        if (!caps.has(commit.capability)) {
          out.push({ refusal: 'commits-unknown-capability', detail: `${o.id} -> ${commit.capability}` });
        }
        if (!CAPABILITY_STATES.includes(commit.becomes) || commit.becomes === 'available') {
          out.push({ refusal: 'commitment-releases-instead-of-committing', detail: `${o.id} -> ${commit.becomes}` });
        }
      }
      // ★ AN OPTION THAT COMMITS SOMETHING MUST SAY WHERE THE PRESSURE WENT.
      // Canon's Chapter 1 never removes pressure from the Bimaristan; it moves
      // it. An option that commits capability and transfers nothing has had its
      // cost omitted, and `deliberately_asymmetric` is the field for saying so.
      if ((o.commits ?? []).length && !o.transfers_pressure_to && !o.deliberately_asymmetric) {
        out.push({ refusal: 'commitment-transfers-nothing', detail: o.id });
      }
    }

    // ★ AND WITHIN ONE DECISION, EITHER EVERY PATHWAY COSTS OR NONE DOES.
    //
    // ⚠️ THIS IS THE RULE THE FIRST ATTEMPT MISSED. Requiring every option
    // everywhere to commit something would fire on decisions that have not
    // entered the strategy model yet — Chapter 1's other three carry their cost
    // as typed effects, which is a different and older mechanism. Requiring
    // nothing would let ONE free option sit beside three costly ones, and a
    // free option beside costly alternatives is not an alternative. It is the
    // answer.
    //
    // So the rule is evenness: a decision is either in the model or it is not.
    const opts = d.options ?? [];
    const costly = opts.filter((o) => (o.commits ?? []).length);
    if (costly.length && costly.length !== opts.length) {
      for (const o of opts) {
        if (!(o.commits ?? []).length) {
          out.push({
            refusal: 'option-costs-nothing-while-its-alternatives-do',
            detail: `${o.id} — a free pathway beside costly ones is not an alternative, it is the answer`,
          });
        }
      }
    }
  }
  return out;
}

/**
 * ★ SG-1 C4 — A CONSEQUENCE THAT BINDS TO NOTHING CANNOT PERSIST.
 *
 * ============================================================================
 * THE REAL DEFECT WAS ONE RESIDUE SENTENCE FOR THREE DIFFERENT AFTERMATHS
 * ============================================================================
 * `scene.residue` is a single string, so local stabilization, a mobile bridge
 * and a selective relocation -- which leave three genuinely different worlds
 * behind -- shared one description of what remained. That is the same shape as
 * three options sharing one consequence, and it is why the world did not appear
 * to answer a commitment.
 *
 * Per-option residue fixes the description. `binds_to` fixes the PERSISTENCE:
 * a residue attached to a location, a route, an instrument, a person or a
 * capability can be found later, at the hub, after a resume. A residue attached
 * to nothing can only be told to the participant.
 *
 * ⚠️ SO THIS CHECKS THAT THE TARGET EXISTS, not merely that the field is
 * filled. A binding to `loc.the-place-i-meant` is a field with a value and a
 * consequence that will never appear anywhere.
 */
export function worldBindingRefusals(scenes = [], decisions = []) {
  const out = [];
  const caps = capabilityIndex();
  const instruments = instrumentIndex();
  const places = locationIndex();
  const people = new Set(scenes.flatMap((s) => s.present ?? []));

  const resolves = (kind, id) => {
    switch (kind) {
      case 'location':
      case 'route': return places.has(id);
      case 'instrument': return instruments.has(id);
      case 'capability': return caps.has(id);
      case 'person': return people.has(id);
      default: return false;
    }
  };

  for (const d of decisions) {
    for (const o of d.options ?? []) {
      for (const r of o.residue ?? []) {
        if (!resolves(r.binds_to?.kind, r.binds_to?.id)) {
          out.push({
            refusal: 'residue-binds-to-nothing-in-the-world',
            detail: `${o.id} -> ${r.binds_to?.kind}:${r.binds_to?.id}`,
          });
        }
      }
    }
  }

  for (const scene of scenes) {
    for (const resp of scene.immediate_effect?.responses ?? []) {
      for (const [layer, value] of Object.entries(resp.world_response ?? {})) {
        if (value?.binds_to && !resolves(value.binds_to.kind, value.binds_to.id)) {
          out.push({
            refusal: 'response-binds-to-nothing-in-the-world',
            detail: `${scene.id}/${resp.option_id}/${layer} -> ${value.binds_to.kind}:${value.binds_to.id}`,
          });
        }
      }
    }

    // ★ A CHARACTER BEAT FOR SOMEBODY WHO IS NOT IN THE SCENE.
    // Canon controls entrances by name -- "Fadl and Maha enter after the first
    // stabilization and electrical-isolation actions are under way" -- so a beat
    // belongs to somebody the scene declares present. Without this, a beat can
    // be authored for a character the participant never meets and it renders.
    for (const b of scene.character_beats ?? []) {
      if (!(scene.present ?? []).some((p) => p.includes(b.character_id) || b.character_id.includes(p))) {
        out.push({
          refusal: 'beat-for-a-character-who-is-not-present',
          detail: `${scene.id}/${b.id} -> ${b.character_id}`,
        });
      }
      const pathwayIds = (decisions.find((d) => d.id === scene.choice_or_discovery)?.options ?? []).map((o) => o.id);
      if (b.pathway && !pathwayIds.includes(b.pathway)) {
        out.push({
          refusal: 'beat-for-a-pathway-that-does-not-exist',
          detail: `${scene.id}/${b.id} -> ${b.pathway}`,
        });
      }
    }
  }
  return out;
}
