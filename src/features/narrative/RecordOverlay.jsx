import { X } from '@phosphor-icons/react';

/**
 * R0-C05A — THE SECONDARY RECORD, OVER THE SAME WORLD.
 *
 * ============================================================================
 * ★ IT DOES NOT CREATE A SECOND STATE
 * ============================================================================
 * Visual bible § 21.5: evidence, chronology, work order and technical detail
 * remain available in a drawer over the game, and "opening that drawer does not
 * create another state... or make the checklist the main play surface". So this
 * renders the same projection the map is rendering, and closing it returns to a
 * morning that did not move while it was open.
 *
 * ★ TECHNICAL DETAIL IS DISCLOSED HERE, NOT BY DEFAULT. § 0.4A's required
 * treatment: protects/costs/unknowns first; responsible, access, materials,
 * source and verification through inspection. The old surface opened every
 * technical fact at once, which reads as a specification rather than a morning.
 *
 * ⚠️ `not-investigated` IS DISPLAYED AS ITSELF. It is not `unknown` and it is
 * not `unavailable`; flattening the three tells a participant that nobody knows
 * when the truth is that nobody has looked.
 */
export function RecordOverlay({ view, onClose }) {
  const { narrative, preparedness, inspector, residue } = view;
  return (
    <>
      <div className="nar-backdrop" onClick={onClose} />
      <aside className="nar-drawer" role="dialog" aria-modal="true" aria-labelledby="nar-drawer-title">
        <div className="nar-drawer-head">
          <div>
            <p className="nar-eyebrow">Secondary operational record</p>
            <h2 id="nar-drawer-title">Evidence and work order</h2>
            <p className="nar-drawer-note">The morning is underneath and has not moved.</p>
          </div>
          <button type="button" className="nar-close" onClick={onClose} aria-label="Close the record"><X weight="bold" /></button>
        </div>

        {narrative.requests && (
          <section className="nar-drawer-section">
            <h3>The four requests, and what each one stops</h3>
            <ul className="nar-request-list">
              {narrative.requests.map((request) => (
                <li key={request.project}>
                  <b>{request.name}</b>
                  <em>{request.carrier.name} · {request.carrier.office}</em>
                  <p>{request.request}</p>
                  <dl>
                    <div><dt>Protects</dt><dd>{request.protects}</dd></div>
                    <div><dt>Costs</dt><dd>{request.costs}</dd></div>
                    <div><dt>Unknown</dt><dd>{request.unknown}</dd></div>
                  </dl>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="nar-drawer-section">
          <h3>Work order</h3>
          <ul className="nar-work-order">
            {preparedness.projects.map((project) => (
              <li key={project.id}>
                <b>{project.name}</b> — <span>{project.stateLabel}</span>
                <dl>
                  <div><dt>Responsible</dt><dd>{project.responsibleFunctions.join(' · ')}</dd></div>
                  <div><dt>Access</dt><dd>{project.accessNeed}</dd></div>
                  <div><dt>Materials</dt><dd>{project.materials}</dd></div>
                  <div><dt>Tested by</dt><dd>{project.verification}</dd></div>
                </dl>
              </li>
            ))}
          </ul>
        </section>

        <section className="nar-drawer-section">
          <h3>Evidence, with its source</h3>
          {inspector.evidence.length === 0
            ? <p className="nar-drawer-note">Nothing has been recorded yet this morning.</p>
            : <ul className="nar-evidence">
                {inspector.evidence.map((item) => (
                  <li key={item.id}>
                    <span>{item.claim}</span>
                    <small>Source: {item.source} · confidence: {item.confidence.replace(/-/g, ' ')} · {item.accessibility}</small>
                  </li>
                ))}
              </ul>}
        </section>

        <section className="nar-drawer-section">
          <h3>What stopped</h3>
          {residue.length === 0
            ? <p className="nar-drawer-note">No ordinary work has been displaced yet.</p>
            : <ul className="nar-residue-list">
                {residue.map((item) => <li key={item.id}><b>{item.what}</b><span>{item.because}</span></li>)}
              </ul>}
        </section>

        <p className="nar-drawer-safety">
          Fictional preparedness exercise. No patient record, live incident command or clinical recommendation.
        </p>
      </aside>
    </>
  );
}
