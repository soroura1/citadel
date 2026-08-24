import { Eye, Scales, Hourglass, CheckCircle } from '@phosphor-icons/react';

/**
 * R0-C05B-A — THE REPEATED GRAMMAR, AND THIS MORNING'S FIRST FOUR STEPS.
 *
 * ============================================================================
 * ★ FOUR WORDS THAT EACH NAME A REAL COMMAND
 * ============================================================================
 * Observe → Decide → Watch → Respond is the rhythm every meaningful move
 * follows (§ 23.1). It is worth showing only because each part is keyed to a
 * command the participant can actually reach: `beatRefusals` refuses a loop
 * part that names no command, so this strip cannot become a diagram of a game
 * that is not this one.
 *
 * ⛔ IT IS NOT A PROGRESS BAR, and it deliberately reads oddly for that reason.
 * A part can be `done` (it has happened at least once) while a part earlier in
 * the reading order is still `ahead`, because the grammar repeats rather than
 * completes. R0-C05 already established why a ring is forbidden here: a
 * percentage cannot distinguish two different things that both look finished.
 *
 * ⚠️ THE STATE IS NEVER CARRIED BY COLOUR ALONE. Each part states its own state
 * in words to assistive technology, and `current` carries a marker as well as a
 * tone — § 18.4's rule, applied to interface rather than to routes.
 */
const ICONS = { observe: Eye, decide: Scales, watch: Hourglass, respond: CheckCircle };

const SAID = {
  current: 'now',
  done: 'already done at least once',
  ahead: 'not yet reached',
};

export function PlayLoop({ loop }) {
  return (
    <ol className="guide-loop" aria-label="How a move works">
      {loop.map((part) => {
        const Icon = ICONS[part.key] ?? Eye;
        return (
          <li key={part.key} className={`guide-loop-part guide-loop-${part.state}`} data-state={part.state}>
            <Icon weight={part.state === 'current' ? 'fill' : 'regular'} aria-hidden="true" />
            <b>{part.label}</b>
            <span className="visually-hidden">, {SAID[part.state]}. {part.gloss}</span>
            <em aria-hidden="true">{part.gloss}</em>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * ★ AND THE FIRST-USE STEPS, WHICH *ARE* LINEAR.
 *
 * The grammar repeats; this morning happens once. § 23.1 asks for both, and
 * keeping them as two lists is what lets each be honest about itself instead of
 * one of them pretending to be the other.
 *
 * ⛔ Later steps are a preview, never an enabled command. Nothing here is a
 * button — the participant reaches step three by playing steps one and two.
 */
export function FirstSteps({ steps }) {
  return (
    <ol className="guide-steps" aria-label="This morning, in order">
      {steps.map((step, index) => (
        <li key={step.key} className={`guide-step guide-step-${step.state}`} data-state={step.state}>
          <span className="guide-step-mark" aria-hidden="true">{index + 1}</span>
          <span>{step.label}</span>
          <span className="visually-hidden">
            {step.state === 'current' ? ' — this is the current step' : step.state === 'done' ? ' — done' : ' — not yet reached'}
          </span>
        </li>
      ))}
    </ol>
  );
}
