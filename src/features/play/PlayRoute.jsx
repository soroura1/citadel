import { view } from '../../engine/run.js';
import { PlayScreen } from './PlayScreen.jsx';
import { ChapterEnd } from './ChapterEnd.jsx';
import { ProvisionalNotice } from './ProvisionalNotice.jsx';

/**
 * ★ THE PLAY SURFACE, COMPOSED IN ONE PLACE THAT TESTS CAN EXECUTE.
 *
 * ============================================================================
 * WHY THIS FILE EXISTS: THE VIEW AND THE SURFACE HAD DRIFTED APART, AND
 * 203 TESTS WERE GREEN
 * ============================================================================
 * This composition lived inside `main.jsx`, which enumerated PlayScreen's props
 * by hand:
 *
 *     <PlayScreen scene={v.scene} phase={v.phase} presents={v.presents} … />
 *
 * while every test spread the whole view:
 *
 *     PlayScreen({ ...view(run, bundle) })
 *
 * TWO CALL SHAPES, ONE OF THEM TESTED. EVS-3 added `roleVariant` and
 * `acknowledgeStake` to the view, the tests saw them, and `main.jsx` dropped
 * them on the floor — so the role panel and the private stake, the two things
 * EVS-3 exists to deliver, would not have rendered in the deployed build.
 *
 * That is precisely the 17-August shape: implemented is not deployed, the build
 * is green, and a human opening the page finds it in one click.
 *
 * ⚠️ `main.jsx` CANNOT BE EXECUTED BY A TEST — it calls `createRoot` and reads
 * `document`. So the fix is not a guard over the enumeration; it is removing
 * the enumeration. The view is spread ONCE, here, and this component is what
 * both `main.jsx` and the render tests use. There is no second call shape left
 * to drift.
 */
export function PlayRoute({ run, bundle, attestation, onChoose, onAdvance, textPath = false }) {
  const v = view(run, bundle);

  // ★ The chapter ENDS. Without this the last decision left a blank screen,
  // which reads as a crash rather than a conclusion.
  if (v.complete) {
    return (
      <>
        <ProvisionalNotice attestation={attestation} />
        <ChapterEnd state={run.state} history={run.history} owed={run.state.pending ?? []} />
      </>
    );
  }

  return (
    <>
      <ProvisionalNotice attestation={attestation} />
      {/* ★ SPREAD, NEVER ENUMERATED. A named prop list is a second definition of
          what the surface needs, and the two definitions drift silently. */}
      <PlayScreen {...v} textPath={textPath} onChoose={onChoose} onAdvance={onAdvance} />
    </>
  );
}
