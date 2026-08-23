import { ArrowRight, ClipboardText } from '@phosphor-icons/react';

/**
 * R0-C05A — THE TEMPORARY COMMITMENT TRAY.
 *
 * ============================================================================
 * ★ IT APPEARS FOR A DECISION AND RETRACTS AFTER THE PERFORMANCE
 * ============================================================================
 * Visual bible § 21.5, the owner's own revision: purpose, act and
 * Protects/Costs/Unknown belong to the moment of choosing, not to the furniture
 * of the screen. A permanent panel holding a preview of an act you already took
 * is an engine report with better typography.
 *
 * ★ THE PREVIEW IS FAIR AND IT IS BEFORE THE ACT. `gameplay-and-state.md` § 7:
 * known effects are previewed fairly. A cost discovered afterwards is a trap,
 * and the whole opportunity-cost mechanic depends on the participant being able
 * to see what they are giving up while they can still choose otherwise.
 *
 * ⚠️ THE ACT IS AN ACTOR AND A PURPOSE, not a progression verb. *Send Rami to
 * walk the declared power route*, not *Advance one cycle*. The label comes from
 * the projection, which reads it from governed content keyed to the project the
 * participant actually commissioned — this component invents no wording.
 */
export function CommitmentTray({ narrative, onAct, onOpenRecord }) {
  const { now, title, purpose, act, preview } = narrative;
  if (!act) return null;
  const surfaceOnly = act.command === 'open-record' || act.command === 'none';

  return (
    <section className="nar-tray" aria-label="Current decision">
      <div className="nar-tray-intro">
        <p className="nar-eyebrow">{now}</p>
        <h2>{title}</h2>
        <p className="nar-purpose">{purpose}</p>
      </div>
      <div className="nar-tray-act">
        <button type="button" className="nar-act"
                onClick={() => (surfaceOnly ? onOpenRecord() : onAct(act))}>
          {act.label} <ArrowRight weight="bold" />
        </button>
        <button type="button" className="nar-secondary" onClick={onOpenRecord}>
          <ClipboardText /> Evidence and work order
        </button>
        <dl className="nar-preview">
          <div><dt>Protects</dt><dd>{preview.protects}</dd></div>
          <div><dt>Costs</dt><dd>{preview.costs}</dd></div>
          <div><dt>Unknown</dt><dd>{preview.unknown}</dd></div>
        </dl>
      </div>
    </section>
  );
}

/**
 * ★ AFTER THE WORLD PERFORMS: what changed, then what remains.
 *
 * The order is deliberate and is § 21.1's: world change first, human response
 * second (it is on the place card), the unresolved question last. The old
 * treatment led with a delta list, which is the engine talking.
 *
 * ⛔ NO BUTTON WHEN THERE IS NOTHING LEFT TO DO. The projection returns
 * `closed`, and a cycle that changes nothing is not offered as though it might.
 */
export function OutcomeBar({ narrative, onAct, onOpenRecord }) {
  const { worldChange, next, closed } = narrative;
  return (
    <section className="nar-outcome" role="status" aria-label="What changed">
      <span className="nar-outcome-world"><b>The world</b>{worldChange}</span>
      <span className="nar-outcome-return"><b>Still open</b>{narrative.return}</span>
      <button type="button" className="nar-secondary" onClick={onOpenRecord}>
        <ClipboardText /> Evidence and record
      </button>
      {next
        ? <button type="button" className="nar-act" onClick={() => onAct(next)}>{next.label} <ArrowRight weight="bold" /></button>
        : closed && <p className="nar-closed">The commissioned work has been performed and tested. What it uncovered is still open.</p>}
    </section>
  );
}
