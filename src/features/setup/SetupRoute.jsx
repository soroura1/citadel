import { SetupScreen } from './SetupScreen.jsx';
import { SELECTABLE_ROLES, notYetPlayable } from '../../engine/roles.js';
import { localeCoverage, setLocale } from '../../locales/index.js';
import { startRun } from '../../engine/run.js';

/**
 * ★ THE SETUP SURFACE, COMPOSED WHERE A TEST CAN EXECUTE IT. (EVS-7)
 *
 * ============================================================================
 * ⚠️ SIXTH APPEARANCE OF ONE SHAPE, AND THE LAST PLACE IT WAS HIDING.
 * ============================================================================
 * `main.jsx` cannot be executed by a test — `createRoot`, `document` — so
 * anything composed there is untested by construction. Every other surface has
 * been pulled out over EVS-3 to 5A; this was the one left, and it holds the
 * two things a clean start depends on: which roles are offered, and the
 * `setLocale` that must run BEFORE the next screen renders.
 *
 * That second one matters more than it looks. EVS-3 found the language being
 * collected and discarded; the fix lives in an `onBegin` that no test ran.
 */
export function SetupRoute({ scenes, onStarted, applyLocale = setLocale }) {
  return (
    <SetupScreen
      roles={SELECTABLE_ROLES}
      notYetPlayable={notYetPlayable(scenes)}
      localeCoverage={localeCoverage()}
      onBegin={(config) => {
        // ★ The language applies before the next screen renders, not after.
        applyLocale(config.locale);
        // ⚠️ startRun REFUSES a missing or unplayable role. The refusal travels
        // out rather than being swallowed: a participant who somehow reaches
        // this without a role is owed the reason.
        const run = startRun({ bundle: onStarted.bundle, config });
        onStarted(run, config);
        return run;
      }}
    />
  );
}
