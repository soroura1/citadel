/**
 * R0-C04 — PLACE-LOCAL ANCHORS AND ROUTE GEOMETRY.
 *
 * ============================================================================
 * ★ A UNIT IS DRAWN WHERE IT IS, NOT WHERE ITS STATE NAME SAYS
 * ============================================================================
 * `visual-and-interaction-bible.md` § 18.2: "Every object is positioned in a
 * stable place-local coordinate system... A filename or screen pixel is never
 * its identity."
 *
 * So this file holds the *world's* geometry — one ground anchor per place and
 * one polyline per route — and the projection puts a unit at the anchor of the
 * place it occupies, or along the route it is travelling. Change the model and
 * the picture follows; recrop the map and only this file changes.
 *
 * ⛔ WHAT THIS DELIBERATELY IS NOT: a table of three states with hard-coded
 * coordinates. The accepted V04 board carries exactly such a table, correctly,
 * because it is *evidence for state language* — and § 19.4 forbids copying its
 * fixture values as an engine. Doing so would make `ordinary-rising` a scene
 * name with a picture attached, which is the failure this whole increment
 * exists to correct.
 *
 * Coordinates are fractions of the 16:9 sector map, so they survive any render
 * size. Ground anchors sit at the feet/wheels; the existing XP0 hotspot pins
 * sit higher, on the building — they are different things and stay separate.
 */
import { PLACES } from '../sim/world.js';

/** Where a unit STANDS in a place: the ground-contact anchor. */
export const GROUND = Object.freeze({
  [PLACES.GATE]: { x: 0.08, y: 0.58 },
  [PLACES.ED]: { x: 0.34, y: 0.66 },
  [PLACES.ICU]: { x: 0.49, y: 0.39 },
  [PLACES.STORES]: { x: 0.70, y: 0.53 },
  [PLACES.WORKSHOP]: { x: 0.84, y: 0.55 },
  [PLACES.UNDERWORKS]: { x: 0.63, y: 0.79 },
  [PLACES.COORDINATION]: { x: 0.20, y: 0.68 },
  [PLACES.POWER]: { x: 0.82, y: 0.22 },
});

/**
 * Route polylines, in the same fractional space.
 *
 * ⚠️ A ROUTE IS THE WHOLE PATH, ALWAYS. What changes with state is how much of
 * it is *occupied* — § 18.3: "rising demand increases occupied route/threshold
 * positions before any numeric update". Redrawing a shorter line for a quieter
 * morning would mean the corridor itself had moved.
 */
export const ROUTE_PATHS = Object.freeze({
  'gate-ed': [[0.08, 0.58], [0.24, 0.62], [0.34, 0.66], [0.46, 0.58]],
  'stores-ed': [[0.70, 0.53], [0.60, 0.60], [0.51, 0.67]],
  'stores-icu': [[0.70, 0.53], [0.62, 0.52], [0.53, 0.51]],
  'workshop-service': [[0.84, 0.55], [0.78, 0.56], [0.73, 0.58]],
  'workshop-underworks': [[0.84, 0.55], [0.72, 0.67], [0.63, 0.79]],
  'icu-support': [[0.49, 0.39], [0.55, 0.45], [0.61, 0.51]],
  'power-icu': [[0.82, 0.22], [0.66, 0.28], [0.52, 0.33]],
});

/**
 * ★ ROUTE CLASS CARRIES MEANING BEFORE COLOUR (§ 18.4).
 *
 * Pattern and endpoint shape are the class; the palette is secondary, and
 * copper stays reserved for a consequential commitment or a changed dependency.
 * A participant who cannot distinguish these colours must still be able to read
 * the map, which is why `dash` and `endpoint` exist here at all.
 */
export const ROUTE_STYLE = Object.freeze({
  // ⚠️ `service`, NOT `patient`. § 18.4 names this class "patient/service" and
  // either half is faithful — but a `class: "patient"` string in the saved world
  // reads exactly like the patient-level record the safety boundary forbids, and
  // the boundary test cannot tell a route class from an entity. Choosing the
  // unambiguous half costs nothing and removes a false positive that would
  // otherwise be "fixed" one day by weakening the test.
  service: { colour: 'rgba(95,163,155,.9)', changed: 'rgba(222,176,96,.95)', width: 3, dash: [], endpoint: 'circle' },
  staff: { colour: 'rgba(213,189,149,.84)', changed: 'rgba(222,176,96,.95)', width: 2, dash: [], endpoint: 'circle' },
  supply: { colour: 'rgba(166,171,193,.9)', changed: 'rgba(207,143,75,.96)', width: 2, dash: [8, 6], endpoint: 'square' },
  power: { colour: 'rgba(150,160,170,.55)', changed: 'rgba(207,143,75,.96)', width: 2, dash: [3, 4], endpoint: 'square' },
});

/**
 * Permitted display widths at the 1600 px sector reference (§ 18.2). A master
 * is never enlarged beyond its source, and a unit never shrinks out of
 * legibility.
 */
export const WIDTH_RANGE = Object.freeze({
  demand: [112, 160],
  clinical: [90, 130],
  technical: [80, 120],
  reserve: [72, 105],
  supply: [72, 105],
});

/** The point a fraction of the way along a polyline, by arc length. */
export function pointAlong(path, fraction) {
  const clamped = Math.max(0, Math.min(1, fraction));
  const lengths = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    lengths.push(d);
    total += d;
  }
  if (total === 0) return { x: path[0][0], y: path[0][1] };

  let travelled = clamped * total;
  for (let i = 0; i < lengths.length; i++) {
    if (travelled <= lengths[i]) {
      const t = lengths[i] === 0 ? 0 : travelled / lengths[i];
      return {
        x: path[i][0] + (path[i + 1][0] - path[i][0]) * t,
        y: path[i][1] + (path[i + 1][1] - path[i][1]) * t,
      };
    }
    travelled -= lengths[i];
  }
  const last = path[path.length - 1];
  return { x: last[0], y: last[1] };
}

/** The occupied head of a route, as a polyline for drawing. */
export function occupiedPath(path, fraction) {
  const head = pointAlong(path, fraction);
  const out = [path[0]];
  let total = 0;
  const lengths = [];
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    lengths.push(d);
    total += d;
  }
  let travelled = Math.max(0, Math.min(1, fraction)) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (travelled <= lengths[i]) break;
    out.push(path[i + 1]);
    travelled -= lengths[i];
  }
  out.push([head.x, head.y]);
  return out;
}

/**
 * ★ SIZE COMES FROM DEPTH, WHICH IS WHY IT IS ALLOWED TO CHANGE AT ALL.
 *
 * A cutout closer to the viewer is larger. Deriving width from the ground
 * anchor's vertical position keeps that honest and means a unit cannot grow
 * because a state was renamed.
 */
export function widthFor(kind, y) {
  const [min, max] = WIDTH_RANGE[kind] ?? [80, 120];
  // The sector's usable ground runs roughly from y=0.30 (far) to y=0.85 (near).
  const depth = Math.max(0, Math.min(1, (y - 0.30) / 0.55));
  return Math.round(min + (max - min) * depth);
}
