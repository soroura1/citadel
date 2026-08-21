/**
 * The decision engine. (R3 C6, C7)
 *
 * ★ EVERY OPTION PROTECTS SOMETHING LEGITIMATE AT A COST.
 *
 * That is the product's whole proposition. An option nobody would defend is a
 * wrong answer wearing a choice's clothes, and the plan names it as the most
 * common serious-game failure.
 */

import { applyOption, visibleChanges } from './effects.js';

export class DecisionRefusal extends Error {
  constructor(refusal, detail) {
    super(detail ? `${refusal}: ${detail}` : refusal);
    this.refusal = refusal;
    this.detail = detail;
  }
}

/**
 * ★ Refused AT LOAD TIME, not at render time. (C7)
 *
 * A decoy option that only fails when a player reaches it has already shipped.
 */
export function assertDecisionIsReal(decision) {
  const options = decision.options ?? [];
  if (options.length < 2) {
    throw new DecisionRefusal('decision-has-no-alternative', `${decision.id} has ${options.length} option(s)`);
  }
  for (const o of options) {
    if (!o.defensible_by || !String(o.defensible_by).trim()) {
      throw new DecisionRefusal(
        'option-nobody-would-defend',
        `${decision.id} option ${o.id} has an empty defensible_by`,
      );
    }
    if (!(o.effects ?? []).length) {
      // An option that changes nothing is not a cost, it is a formality.
      throw new DecisionRefusal('option-costs-nothing', `${decision.id} option ${o.id} has no effects`);
    }
    // ★ SG-1 — AN OPTION THAT ENDANGERS NOTHING IS NOT AN OPTION.
    //
    // `protects` was required from the start and `risks` never was, so an
    // option could legitimately protect something at no stated cost. Three of
    // those side by side are not three pathways: they are three ways of being
    // right, and the participant learns within one scene that the choice was
    // decorative.
    //
    // EITHER form counts. EVS-4 made some risks findable rather than given, so
    // an option whose cost depends on what a donating service would lose says
    // how to find out instead of pretending the cost does not exist -- and
    // `risk_requires_evidence` is that. What is refused is neither.
    if (!o.risks && !(o.risk_requires_evidence ?? []).length) {
      throw new DecisionRefusal(
        'option-endangers-nothing',
        `${decision.id} option ${o.id} has neither a stated risk nor a findable one`,
      );
    }
  }
  return true;
}

/**
 * Present the options.
 *
 * ⚠️ THE ORDER IS AUTHORED, NEVER SORTED BY DESIRABILITY. (C6)
 *
 * Sorting by outcome would tell the player which option is "best" before they
 * have weighed anything, which is the opposite of a decision that costs
 * something. The engine has no notion of a best option and must not acquire one.
 */
export function presentOptions(decision, { role, held = new Set() } = {}) {
  assertDecisionIsReal(decision);

  const gated = Array.isArray(decision.requires_authority) && decision.requires_authority.length > 0;

  // ⚠️ A MISSING ROLE IS NOT A PASS. This read `!requires_authority || !role || …`
  // until EVS-3, so a run with no role satisfied every authority gate — the
  // check was present, correct, and short-circuited by the one case every test
  // exercised. Same shape as an isolation test run on the owner connection.
  const hasRole = Boolean(role);
  const authorised = hasRole && (!gated || decision.requires_authority.includes(role));

  /**
   * ★ SUPPORT — WHAT A ROLE WITHOUT AUTHORITY MAY STILL DO. (EVS-3)
   *
   * Canon is explicit in both directions and they look contradictory until you
   * read the third line:
   *
   *   "No solo player gains fictional authority to make every decision."
   *   "The responsible clinicians define eligibility and minimum safety.
   *    The player influences which system carries the resulting pressure."
   *
   * The Final Product Experience Contract's commit beat is what reconciles
   * them: "the player decides, escalates, delegates, negotiates OR SUPPORTS
   * ANOTHER PERSON'S PROPOSAL under a named constraint."
   *
   * So an unauthorised role is not a spectator. It puts its weight behind a
   * pathway, the authored effects apply, and the record says which of the two
   * it was. Neither EVS role holds authority over the power-pressure or
   * capacity decisions — that is canon, not an oversight — and without support
   * the slice's own two roles could not reach the capacity commitment the EVS
   * gate requires.
   *
   * ⚠️ DECIDING REMAINS REFUSED. `role-lacks-authority-to-decide` still fires
   * for a caller that asks to decide; support is what is offered instead.
   */
  const mayCommit = hasRole;
  const commitAs = authorised ? 'decision' : 'support';

  return {
    prompt: decision.prompt,
    // Authored order, preserved.
    options: decision.options.map((o) => {
      /**
       * ★ EVS-4 — FPE-05, INVERTED. A RISK IS SHOWN WHEN IT COULD BE KNOWN.
       *
       * "Option risks are available before commitment WHENEVER THE PLAYER'S
       * ROLE COULD REASONABLY KNOW THEM." Until EVS-4 every risk was
       * unconditionally visible, which reads as a briefing: the trade-offs
       * arrived with the options and nothing had to be found out.
       *
       * ⚠️ `protects` IS NEVER WITHHELD, and there is no field with which to
       * withhold it. An option whose protection is hidden is not a position
       * anyone can weigh — that would be FPE-03 broken from the other side.
       * The same reasoning is why not every option may be gated, which is
       * asserted over the content rather than left to an author's judgement.
       */
      const needs = o.risk_requires_evidence ?? [];
      const knowable = needs.every((id) => held.has(id));
      return {
      id: o.id,
      label: o.label,
      protects: o.protects,
      risks: knowable ? o.risks : null,
      riskRequires: knowable ? [] : needs,
      // Shown so the player can see WHO would defend it -- the thing that makes
      // it a position rather than a trap.
      defensibleBy: o.defensible_by,
      };
    }),
    authorised,
    mayCommit,
    commitAs,
    // WHO holds it, so the surface names the constraint rather than saying
    // "not permitted". Canon: "the relevant professional explains the binding
    // constraint... This is authority, not a game hint."
    authorityHeldBy: gated ? [...decision.requires_authority] : null,
    refusal: hasRole
      ? (authorised ? null : 'role-lacks-authority-to-decide')
      : 'run-has-no-role',
  };
}

/** Choose, apply, and report only what the player should honestly see. (C9) */
export function choose(state, decision, optionId) {
  assertDecisionIsReal(decision);
  const option = decision.options.find((o) => o.id === optionId);
  if (!option) throw new DecisionRefusal('unknown-option', optionId);

  const after = applyOption(state, option);
  return {
    state: after,
    // ★ Nothing congratulates a costly decision. The turn reports what moved,
    // including what worsened, and the interface must not decorate it.
    changes: visibleChanges(state, after).filter((c) => c),
    held: (after.pending ?? []).length - (state.pending ?? []).length,
  };
}
