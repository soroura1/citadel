import { RouteLayer } from './RouteLayer.jsx';
import { slot } from '../../projections/slots.js';

/**
 * R0-C04 — THE OPERATIONAL MAP, DRIVEN BY STATE.
 *
 * ============================================================================
 * ★ EVERY UNIT IS WHERE THE SIMULATION PUT IT
 * ============================================================================
 * No component here chooses a position, a size or a state name. The projection
 * computed all three from the world; this renders them. That is the difference
 * between a living morning and three painted pictures with buttons under them.
 *
 * ⛔ AND NOTHING HERE IS BOUND ART. Each unit names a slot, the slot names a
 * candidate, and `Q10` has reviewed none of them. The map says so on its face.
 */
export function LivingMap({ view, labels = true, onSelectPlace, hotspots = [] }) {
  const base = slot('R0-SL02');
  return (
    <div className={`map-stage living-map${labels ? '' : ' labels-off'}`}>
      <img className="sector-map" src={base.file} alt={base.alt} width="1600" height="900" />
      <div className="map-vignette" />

      <RouteLayer routes={view.routes} nodes={view.nodes} />

      {view.units.map((unit) => {
        const asset = slot(unit.slot);
        if (!asset) return null;
        return (
          <img
            key={unit.id}
            className={`op-unit${unit.changed ? ' changed' : ''}`}
            data-unit={unit.id}
            src={asset.file}
            srcSet={asset.lowBandwidth ? `${asset.lowBandwidth} 256w, ${asset.file} 512w` : undefined}
            /* ⚠️ MAP-RELATIVE, NOT VIEWPORT-RELATIVE. The unit's width is a
               percentage of the MAP, and the map is not the viewport — an
               earlier `vw` value here described a size the element never had.
               The map occupies roughly two thirds of the shell at desktop and
               the full width below it, so `sizes` says so and the browser picks
               the low-bandwidth derivative whenever that is genuinely enough. */
            sizes={`(max-width: 980px) ${unit.width / 16}vw, ${(unit.width / 16) * 0.66}vw`}
            /* ⚠️ Empty alt, on purpose. The unit is an additive depiction of a
               fact the structured world already states in full. Announcing
               "a clinical service team at work" beside a list that already says
               five staffed of eight physical positions is noise, not access. */
            alt=""
            aria-hidden="true"
            style={{ left: `${unit.x * 100}%`, top: `${unit.y * 100}%`, width: `${unit.width / 16}%` }}
          />
        );
      })}

      {labels && view.units.map((unit) => (
        <span key={`${unit.id}-label`} className="op-unit-label"
              style={{ left: `${unit.x * 100}%`, top: `calc(${unit.y * 100}% + 6px)` }}>
          {unit.name}
        </span>
      ))}

      {hotspots.map((spot) => {
        const Icon = spot.icon;
        return (
          <button key={spot.id} type="button"
                  className={view.inspector.place === spot.id ? 'hotspot active' : 'hotspot'}
                  style={{ top: spot.top, left: spot.left }}
                  onClick={() => onSelectPlace(spot.id)}
                  aria-label={`Inspect ${spot.label}`}>
            <Icon weight="fill" /><span>{spot.label}</span>
          </button>
        );
      })}

      <p className="map-candidate-note">Candidate operational depiction · not reviewed · <code>Q10</code> open</p>
    </div>
  );
}
