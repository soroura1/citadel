import { MagnifyingGlass } from '@phosphor-icons/react';

/**
 * R0-C04 — ONE PLACE, INSPECTED.
 *
 * ★ SOURCE AND CONFIDENCE TRAVEL WITH EVERY CLAIM (§ 6 of the mechanics
 * authority), and `not-investigated` is displayed as itself. It is not
 * `unknown`, it is not `unavailable`, and flattening the three would tell a
 * participant that nobody knows when the truth is that nobody has looked.
 */
export function MorningInspector({ inspector, label }) {
  return (
    <section className="inspector-card morning-inspector" aria-label={`Inspection of ${label}`}>
      <div className="inspector-title">
        <MagnifyingGlass />
        <span><small>Inspection</small><b>{label}</b></span>
      </div>

      {inspector.units.length === 0
        ? <p>No operational unit is working here in this cycle.</p>
        : <ul className="inspector-units">
            {inspector.units.map((unit) => (
              <li key={unit.id}><b>{unit.name}</b><span>{unit.fact}</span><small>Responsible: {unit.responsibleFunction}</small></li>
            ))}
          </ul>}

      {inspector.work.length > 0 && (
        <ul className="inspector-work">
          {inspector.work.map((item) => (
            <li key={item.id}><b>Active work</b><span>{item.id.replace(/^work-/, '').replace(/-/g, ' ')} · needs {item.needs}</span><small>{item.responsibleFunction}</small></li>
          ))}
        </ul>
      )}

      {inspector.routes.length > 0 && (
        <dl className="inspector-routes">
          {inspector.routes.map((route) => (
            <div key={route.id}>
              <dt>{route.class} route</dt>
              <dd>{route.from} → {route.to} · {route.condition} · owner {route.owner}</dd>
            </div>
          ))}
        </dl>
      )}

      {inspector.evidence.length > 0 && (
        <ul className="inspector-evidence">
          {inspector.evidence.map((item) => (
            <li key={item.id}>
              <span>{item.claim}</span>
              <small>Source: {item.source} · confidence: {item.confidence} · {item.accessibility}</small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
