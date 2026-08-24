import { useEffect, useRef } from 'react';
import { X } from '@phosphor-icons/react';

/**
 * R0-C05B-A — A SHORT EXPLANATION, NOT A MANUAL.
 *
 * ============================================================================
 * ★ EVERY STEP DESCRIBES A COMMAND THAT EXISTS
 * ============================================================================
 * `beatRefusals` refuses a *How play works* step that names no command. An
 * instruction describing a control that is not there is worse than no
 * instruction at all, because it teaches a participant to go looking for it and
 * then to distrust what they did find.
 *
 * ============================================================================
 * ★ THE FOCUS CONTRACT IS THE ACCESSIBILITY CONTRACT
 * ============================================================================
 * § 23.4 requires this to be keyboard-operable, and a dialog that takes focus
 * without returning it strands a keyboard participant somewhere they did not
 * ask to be. So: focus moves in on open, Tab cycles inside, Escape closes, and
 * focus goes back to the control that opened it — which the caller owns,
 * because only the caller knows what that was.
 *
 * ⚠️ THE OVERLAY IS NOT REQUIRED READING. Everything it says is true of a
 * surface that already states its own objective, act, preview and consequence.
 * If it never opens, nothing is missing — which is the test for whether an
 * explanation has been allowed to become load-bearing.
 */
export function HowPlayWorks({ how, onClose }) {
  const panel = useRef(null);

  useEffect(() => {
    const node = panel.current;
    if (!node) return undefined;
    const focusable = () => [...node.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')];
    node.focus();

    const onKey = (event) => {
      if (event.key === 'Escape') { event.stopPropagation(); onClose(); return; }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      // ⛔ The trap is a CYCLE, not a wall. Shift+Tab from the first item must
      // reach the last one; a trap that only holds forwards lets a keyboard
      // participant reverse straight out of a dialog that is still open.
      if (event.shiftKey && (document.activeElement === first || document.activeElement === node)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    };
    node.addEventListener('keydown', onKey);
    return () => node.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="guide-scrim" onClick={onClose}>
      <div
        className="guide-how"
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-how-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="guide-how-title">{how.title}</h2>
        <p className="guide-how-lede">{how.lede}</p>
        <ol className="guide-how-steps">
          {how.steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <p className="guide-how-note">{how.guidanceNote}</p>
        <button type="button" className="guide-how-close" onClick={onClose}>
          <X weight="bold" aria-hidden="true" /> Close
        </button>
      </div>
    </div>
  );
}
