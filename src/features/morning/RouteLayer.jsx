import { ROUTE_STYLE } from '../../projections/anchors.js';

/**
 * R0-C04 — THE ROUTE GRAMMAR, AS SVG.
 *
 * ★ PATTERN AND ENDPOINT CARRY CLASS BEFORE COLOUR (§ 18.4). A participant who
 * cannot separate teal from stone still reads a dashed supply line with square
 * endpoints against a continuous service line with round ones.
 *
 * ⚠️ SVG RATHER THAN CANVAS, DELIBERATELY. The accepted V04 board drew these on
 * a canvas, which is correct for a comparison board and wrong for a product:
 * canvas output cannot be asserted in a render test, does not scale with zoom
 * and exposes nothing to assistive technology. The geometry is identical; only
 * the surface changed.
 *
 * The layer is `aria-hidden` because the structured world states every route,
 * its condition and its owner in words. Duplicating it here would make a screen
 * reader read the map twice.
 */
export function RouteLayer({ routes, nodes, objective = null }) {
  /* ⚠️ THE VIEWBOX IS 16:9, AND BOTH EARLIER ATTEMPTS AT THIS WERE WRONG.
   *
   * A `0 0 100 100` box with `preserveAspectRatio="none"` squashes every circle
   * into an ellipse, and `vectorEffect="non-scaling-stroke"` reinterprets a
   * stroke width of 0.55 user units as 0.55 CSS PIXELS — so the route grammar
   * rendered as hairlines almost nobody could see. Both looked correct in the
   * markup and both were found by opening the page.
   *
   * A 160×90 box matches the sector's own aspect, so nothing distorts, strokes
   * scale with the map, and the widths below are the accepted V03 values
   * expressed in map units rather than in device pixels. */
  const X = 160, Y = 90;
  const point = ([x, y]) => `${x * X},${y * Y}`;
  return (
    <svg className="route-layer" viewBox={`0 0 ${X} ${Y}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {/* ★ R0-C05B-A — THE OBJECTIVE ROUTE, UNDER EVERYTHING ELSE.
          Drawn first so the occupied head, the supply lines and the origin
          nodes all stay legible on top of it: the highlight says WHICH corridor
          the morning's first task concerns, and the existing grammar goes on
          saying what is happening along it. Nothing about the route's state is
          carried by this stroke, which is why it can be switched off with
          guidance without removing any operational fact. */}
      {objective && (
        <>
          <polyline className="route-objective-glow" points={objective.path.map(point).join(' ')}
                    fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <polyline className="route-objective" points={objective.path.map(point).join(' ')}
                    fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {[objective.fromAnchor, objective.toAnchor].map((end, index) => (
            <circle key={index} className="route-objective-end"
                    cx={end.x * X} cy={end.y * Y} r="1.5" fill="none" />
          ))}
        </>
      )}
      {routes.map((route) => {
        const style = route.style ?? ROUTE_STYLE.service;
        return (
          <polyline
            key={route.id}
            className={`route route-${route.class}${route.changed ? ' route-changed' : ''}`}
            points={route.path.map(([x, y]) => `${x * X},${y * Y}`).join(' ')}
            fill="none"
            stroke={route.changed ? style.changed : style.colour}
            strokeWidth={route.class === 'service' ? 0.7 : 0.5}
            strokeDasharray={style.dash.length ? style.dash.map((d) => d / 6).join(' ') : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
      {/* ★ ORIGIN NODES REMAIN AFTER A UNIT LEAVES (§ 19.2). An empty origin is
          the visible cost; without it a committed reserve looks like a reserve
          that was always there. */}
      {nodes.map((node) => node.shape === 'square' ? (
        <rect key={node.id} className={`route-node${node.occupied ? '' : ' route-node-empty'}`}
              x={node.x * X - 0.8} y={node.y * Y - 0.8} width="1.6" height="1.6"
              fill={node.occupied ? '#a6abc1' : 'none'} stroke="#cf8f4b" strokeWidth="0.35" />
      ) : (
        <circle key={node.id} className={`route-node${node.occupied ? '' : ' route-node-empty'}`}
                cx={node.x * X} cy={node.y * Y} r="0.9"
                fill={node.occupied ? '#d5bd95' : 'none'} stroke="#deb060" strokeWidth="0.35" />
      ))}
    </svg>
  );
}
