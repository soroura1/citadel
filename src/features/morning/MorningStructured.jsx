import { ListBullets } from '@phosphor-icons/react';

/**
 * R0-C04 — THE STRUCTURED WORLD.
 *
 * ============================================================================
 * ★ THE SAME PROJECTION, NOT A SUMMARY OF IT
 * ============================================================================
 * This receives `view.structured`, which the projection built from the same
 * world that produced the map's unit positions. There is no second source and
 * no shortened transcript — § 18.7 forbids "relying on image alt text as a
 * substitute for state", and a paraphrase would be the same failure in prose.
 *
 * It is always rendered, not only when the map is hidden: at narrow widths and
 * at 200% zoom the map yields and this carries the world, and a participant who
 * simply prefers reading should not have to switch modes to be taken seriously.
 */
export function MorningStructured({ view, onSelectPlace, places = [] }) {
  return (
    <section className="structured-world" aria-label="Equivalent world state">
      <div className="structured-heading">
        <ListBullets size={26} />
        <div>
          <p className="kicker">Equivalent representation</p>
          <h2>The same morning, in words</h2>
        </div>
      </div>

      <dl className="structured-state">
        {view.structured.map((row) => (
          <div key={row.id}>
            <dt>{row.term}</dt>
            <dd>{row.detail}</dd>
          </div>
        ))}
      </dl>

      <h3 className="structured-subhead">Places</h3>
      <div className="structured-grid">
        {places.map((place) => {
          const Icon = place.icon;
          const here = view.units.filter((unit) => unit.place === place.id);
          return (
            <button key={place.id} type="button"
                    className={view.inspector.place === place.id ? 'place-row active' : 'place-row'}
                    onClick={() => onSelectPlace(place.id)}>
              <Icon />
              <span>
                <b>{place.label}</b>
                <small>{here.length ? here.map((unit) => unit.fact).join(' ') : place.meta}</small>
              </span>
            </button>
          );
        })}
      </div>

      <h3 className="structured-subhead">Routes in use</h3>
      <ul className="structured-routes">
        {view.routes.length === 0 && <li>No route is currently occupied.</li>}
        {view.routes.map((route) => (
          <li key={route.id}>
            <b>{route.from} → {route.to}</b>
            <small>{route.class} route · {route.condition}{route.changed ? ' · changed this cycle' : ''}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
