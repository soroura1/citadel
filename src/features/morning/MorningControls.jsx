import { Pause, Play, SkipForward, Eye, EyeSlash } from '@phosphor-icons/react';
import { SPEEDS } from '../../sim/commands.js';

/**
 * R0-C04 — TIME CONTROLS, AND THE NON-TIMED EQUIVALENT BESIDE THEM.
 *
 * ============================================================================
 * ★ THE NON-TIMED CONTROL IS NOT AN ACCESSIBILITY CONSOLATION
 * ============================================================================
 * `accessibility-and-play-modes.md` § 1: equivalent "does not mean visually
 * identical. It means equal ability to understand, decide and progress without
 * a strategically easier or thinner game." So *Advance one cycle* sits in the
 * same control group as pause and speed, available to everyone, and it produces
 * exactly the same events the running clock would. Nobody is routed to a
 * lesser path, and nobody who uses it is behind.
 *
 * ⛔ SPEED IS NOT DIFFICULTY, AND IT IS NOT A REACTION TEST. `DEC-014` and
 * `gameplay-and-state.md` § 3 permit bounded speed; the same two cycles produce
 * the same events at any of them.
 */
export function MorningControls({ view, onMode, onSpeed, onAdvance, labels, onLabels }) {
  const paused = view.time.mode === 'paused';
  const done = view.time.cycle >= view.time.ordinaryCycles;

  return (
    <div className="morning-controls" role="group" aria-label="Fictional time controls">
      <button type="button" className={paused ? 'control active' : 'control'}
              aria-pressed={paused}
              onClick={() => onMode(paused ? 'running' : 'paused')}>
        {paused ? <Play weight="fill" /> : <Pause weight="fill" />}
        {paused ? 'Resume' : 'Pause'}
      </button>

      <button type="button" className="control" onClick={onAdvance} disabled={paused || done}>
        <SkipForward weight="fill" /> Advance one cycle
      </button>

      <span className="speed-group" role="group" aria-label="Speed">
        {SPEEDS.map((speed) => (
          <button key={speed} type="button"
                  className={view.time.speed === speed ? 'control speed active' : 'control speed'}
                  aria-pressed={view.time.speed === speed}
                  disabled={paused}
                  onClick={() => onSpeed(speed)}>×{speed}</button>
        ))}
      </span>

      <button type="button" className={labels ? 'control' : 'control active'}
              aria-pressed={!labels} onClick={onLabels}>
        {labels ? <EyeSlash /> : <Eye />} {labels ? 'Hide labels' : 'Show labels'}
      </button>

      <p className="clock-reading">
        <span className="visually-hidden">Fictional time: </span>
        {view.time.bell === 'first' ? 'First' : view.time.bell === 'second' ? 'Second' : 'Third'} Bell
        {' · '}cycle {view.time.cycle} of {view.time.ordinaryCycles}
        {paused && <b className="paused-flag"> · paused</b>}
      </p>

      {/* ⛔ A refusal is stated, never swallowed. A control that declines in
          silence is indistinguishable from a broken one. */}
      {view.lastRefusal && (
        <p className="refusal" role="status">
          Not permitted: {refusalText(view.lastRefusal.reason)}
        </p>
      )}
    </div>
  );
}

const refusalText = (reason) => ({
  'cannot-advance-fictional-time-while-paused': 'fictional time is paused, so nothing can progress.',
  'the-ordinary-morning-has-already-run-its-cycles': 'the ordinary morning has already run its cycles.',
  'speed-cannot-be-set-while-paused': 'speed cannot be changed while paused.',
  'preparation-window-needs-two-ordinary-cycles': 'the preparation window opens after two ordinary cycles.',
  'preparation-window-is-already-open': 'the preparation window is already open.',
}[reason] ?? reason.replace(/-/g, ' '));
