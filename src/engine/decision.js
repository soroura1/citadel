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
export function presentOptions(decision, { role } = {}) {
  assertDecisionIsReal(decision);

  const authorised =
    !decision.requires_authority || !role || decision.requires_authority.includes(role);

  return {
    prompt: decision.prompt,
    // Authored order, preserved.
    options: decision.options.map((o) => ({
      id: o.id,
      label: o.label,
      protects: o.protects,
      risks: o.risks,
      // Shown so the player can see WHO would defend it -- the thing that makes
      // it a position rather than a trap.
      defensibleBy: o.defensible_by,
    })),
    // A role without authority OBSERVES, and the surface can say why rather
    // than silently hiding the decision.
    authorised,
    refusal: authorised ? null : 'role-lacks-authority-to-decide',
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
