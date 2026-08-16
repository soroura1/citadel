/**
 * THE SURFACE INVENTORY — the single source of truth for what exists and what is reachable.
 *
 * ============================================================================
 * IMPLEMENTED ≠ ROUTED ≠ REACHABLE ≠ DEPLOYED
 * ============================================================================
 *
 * The prior build attempt shipped SIX screens nobody could navigate to. One was
 * built, tested, shipped and deployed, and for FOUR CONSECUTIVE RELEASES the
 * only way to see it was to type a URL by hand. It had passing component tests
 * for all of them.
 *
 * A component test is not a reachability test.
 *
 * This file is read by three different tests, each catching what the others
 * cannot:
 *
 *   routing.test.js       — the destination resolves
 *   navigation.test.js    — a person can FIND it from the navigation surface
 *   deployed-bytes.test.js— it is actually in the built output
 *
 * Adding a surface means adding it here. A surface not in this list is not
 * reachable, and the tests say so.
 */

/** @typedef {'reachable' | 'non-navigable' | 'planned'} SurfaceStatus */

export const SURFACES = [
  {
    id: 'entry',
    path: '/',
    title: 'Entry',
    status: 'reachable',
    inNavigation: false,
    reason:
      'The front door. Not in navigation because you arrive here; it is where navigation starts. ' +
      'It states the purpose and the scope boundary BEFORE any credential decision.',
    release: 'R0',
  },
  {
    id: 'item',
    path: '/item',
    title: 'Catalogue item',
    status: 'reachable',
    inNavigation: true,
    reason:
      "R0's entire user-visible feature: one checklist item that travelled contracts → " +
      'checklist-api → citadel → this screen. It proves every seam.',
    release: 'R0',
  },
  {
    id: 'setup',
    path: '/setup',
    title: 'Setup',
    status: 'reachable',
    inNavigation: true,
    reason:
      'R3. Role, stake, tendency, scenario, severity, name and language. Every choice here reaches ' +
      'the engine — a setup screen whose options do not is a questionnaire, and the participant ' +
      'learns within one scene that their answers did not matter.',
    release: 'R3',
  },
  {
    id: 'play',
    path: '/play',
    title: 'Play',
    status: 'reachable',
    inNavigation: true,
    reason:
      'R3. The scene, its decision, and honest state. Reachable from setup AND from a deep link, ' +
      'because a participant who closes the tab must be able to return to where they were.',
    release: 'R3',
  },
];

/**
 * Surfaces the plan defines but R0 does not build. Listed so the gap is TRACKED
 * rather than discovered — and so nobody mistakes "not built" for "forgotten".
 */
export const PLANNED_SURFACES = [
  { id: 'record', title: 'Record', release: 'R4' },
  { id: 'observation', title: 'Observation record', release: 'R4' },
  { id: 'results', title: 'Results', release: 'R4' },
  { id: 'doctrine', title: 'Doctrine', release: 'R5' },
  { id: 'standing', title: 'Standing', release: 'R5' },
  { id: 'facility', title: 'Facility', release: 'R4' },
];

export const navigableSurfaces = () => SURFACES.filter((s) => s.inNavigation);
export const reachableSurfaces = () => SURFACES.filter((s) => s.status === 'reachable');
export const surfaceByPath = (path) => SURFACES.find((s) => s.path === path);
