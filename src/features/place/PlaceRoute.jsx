import { PlaceSurface } from './PlaceSurface.jsx';
import { currentSceneId } from '../../engine/run.js';

/**
 * ★ THE PLACE SURFACE, COMPOSED WHERE A TEST CAN EXECUTE IT. (EVS-5A)
 *
 * ============================================================================
 * ⚠️ FIFTH APPEARANCE OF ONE SHAPE. IT IS BEING REMOVED ON SIGHT NOW.
 * ============================================================================
 * `main.jsx` cannot be executed by a test — `createRoot`, `document` — so
 * anything composed there is untested by construction. This build has paid for
 * that four times already; the `here` computation below (which scene the
 * participant is in, and therefore which locations are marked "you are here")
 * lived in `main.jsx` and no test ran it.
 */
export function PlaceRoute({ run, bundle, scenes }) {
  // Where the participant is, from the run. A completed run is nowhere in
  // particular — the chapter is over, and marking a location would be claiming
  // they are still standing in it.
  const here = run && !run.complete
    ? (scenes.find((s) => s.id === currentSceneId(run))?.location_ids ?? [])
    : [];

  return <PlaceSurface run={run} scenes={scenes} here={here} />;
}
