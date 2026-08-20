import { useState } from 'react';
import { t, AVAILABLE_LOCALES, directionFor } from '../../locales/index.js';

/**
 * The Setup surface. (R3 F1, F2 · EVS-3)
 *
 * ★ EVERY CHOICE HERE MUST CHANGE SOMETHING IN PLAY.
 *
 * A setup screen whose options do not reach the engine is a questionnaire, and
 * the participant learns within one scene that their answers did not matter.
 *
 * ============================================================================
 * ⚠️ WHAT EVS-3 REMOVED, AND WHY REMOVING WAS THE HONEST ANSWER
 * ============================================================================
 * This screen offered leadership tendency, scenario and severity. Chapter 1
 * canon authors none of the three:
 *
 *   tendency   Canon's chapter contract has no leadership style, and
 *              `C1_...` carries no such variable. Nothing could observe it.
 *   scenario   Canon states Chapter 1's incident is "independent of the
 *              selected primary hazard, EVEN WHEN the later scenario is a
 *              regional power failure". Independence is the authored fact —
 *              so in this chapter a scenario selector is a control whose
 *              correct behaviour is to change nothing.
 *   severity   No severity variant is authored for any Chapter 1 scene, and
 *              inventing one would be authoring content behind a dropdown.
 *
 * They were not disabled or hidden. A greyed control still promises. The
 * engine keeps `defineScenario` and `startingStateFor`, because the synthetic
 * eighth scenario is R3's configurability proof and it must keep running.
 *
 * ★ AND THE ROLE LIST IS TWO, NOT SIXTEEN. The content carries a variant for
 * all sixteen of canon's council roles; two are at slice depth. Offering
 * sixteen would promise a variation the slice does not have — so the other
 * fourteen are NAMED as not yet playable rather than quietly absent. A
 * participant should be able to see that the world is larger than the slice.
 */
export function SetupScreen({ roles = [], notYetPlayable = [], localeCoverage = {}, onBegin }) {
  const [config, setConfig] = useState({
    role: roles[0]?.id ?? null,
    stake: '',
    displayName: '',
    locale: 'en',
  });

  const set = (k) => (e) => setConfig((c) => ({ ...c, [k]: e.target.value }));
  const chosen = roles.find((r) => r.id === config.role) ?? null;

  return (
    <main>
      <h1>{t('setup.title')}</h1>
      <p>{t('setup.intro')}</p>

      <form
        onSubmit={(e) => { e.preventDefault(); onBegin?.(config); }}
        aria-describedby="setup-help"
      >
        <p id="setup-help">{t('setup.help')}</p>

        <label htmlFor="role">{t('setup.role')}</label>
        <select id="role" value={config.role ?? ''} onChange={set('role')} required>
          {roles.map((r) => <option key={r.id} value={r.id}>{t(r.title_key)}</option>)}
        </select>

        {/* ★ WHY THIS ROLE, IN THE SLICE'S OWN WORDS. The two were chosen to
            disagree about what the chapter was; saying so before the choice is
            what makes it a choice rather than a coin toss. */}
        {chosen && <p className="role-because">{chosen.chosen_because}</p>}

        {notYetPlayable.length > 0 && (
          <p className="not-yet-playable">
            {t('setup.roles_not_yet_playable')}{' '}
            {notYetPlayable.map((id) => t(`role.${id.replace('role.', '')}.title`)).join(', ')}
          </p>
        )}

        {/* The stake is free text on purpose: it is the participant's own reason
            for being here, and a dropdown would make it ours. It is private —
            acknowledged back to them at the beat canon names, never spoken by a
            character and never shown on a board. */}
        <label htmlFor="stake">{t('setup.stake')}</label>
        <input id="stake" value={config.stake} onChange={set('stake')} />
        <p className="field-note">{t('setup.stake_is_private')}</p>

        <label htmlFor="displayName">{t('setup.name')}</label>
        <input id="displayName" value={config.displayName} onChange={set('displayName')} />

        <label htmlFor="locale">{t('setup.language')}</label>
        <select id="locale" value={config.locale} onChange={set('locale')}>
          {AVAILABLE_LOCALES.map((l) => <option key={l} value={l}>{t(`locale.${l}`)}</option>)}
        </select>

        {/* ⚠️ THE TRANSLATION IS INCOMPLETE AND SAYS SO. Arabic covers a small
            fraction of the strings and the rest fall back to English. A
            language selector that hides that spends a participant's time before
            it disappoints them. The number is COMPUTED — nobody maintains it. */}
        {localeCoverage[config.locale] && localeCoverage[config.locale].missing.length > 0 && (
          <p className="field-note" role="status">
            {t('setup.locale_incomplete')}{' '}
            {localeCoverage[config.locale].translated}/{localeCoverage[config.locale].total}
            {' · '}{directionFor(config.locale)}
          </p>
        )}

        <button type="submit">{t('setup.begin')}</button>
      </form>
    </main>
  );
}
