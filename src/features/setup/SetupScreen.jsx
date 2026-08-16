import { useState } from 'react';
import { t } from '../../locales/index.js';

/**
 * The Setup surface. (R3 F1, F2)
 *
 * ★ EVERY CHOICE HERE MUST CHANGE SOMETHING IN PLAY.
 *
 * A setup screen whose options do not reach the engine is a questionnaire, and
 * the participant learns within one scene that their answers did not matter.
 * `runConfiguration` is what the engine reads — there are NO hidden defaults,
 * so a field absent here is absent in play too.
 */
export function SetupScreen({ roles = [], scenarios = [], onBegin }) {
  const [config, setConfig] = useState({
    role: roles[0]?.id ?? null,
    stake: '',
    tendency: 'cautious',
    scenario: scenarios[0]?.id ?? null,
    severity: 'moderate',
    displayName: '',
    locale: 'en',
  });

  const set = (k) => (e) => setConfig((c) => ({ ...c, [k]: e.target.value }));

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
        <select id="role" value={config.role ?? ''} onChange={set('role')}>
          {roles.map((r) => <option key={r.id} value={r.id}>{t(`role.${r.id}.title`)}</option>)}
        </select>

        {/* The stake is free text on purpose: it is the participant's own reason
            for being here, and a dropdown would make it ours. */}
        <label htmlFor="stake">{t('setup.stake')}</label>
        <input id="stake" value={config.stake} onChange={set('stake')} />

        <label htmlFor="tendency">{t('setup.tendency')}</label>
        <select id="tendency" value={config.tendency} onChange={set('tendency')}>
          <option value="cautious">{t('setup.tendency.cautious')}</option>
          <option value="decisive">{t('setup.tendency.decisive')}</option>
          <option value="consultative">{t('setup.tendency.consultative')}</option>
        </select>

        <label htmlFor="scenario">{t('setup.scenario')}</label>
        <select id="scenario" value={config.scenario ?? ''} onChange={set('scenario')}>
          {scenarios.map((s) => <option key={s.id} value={s.id}>{t(`scenario.${s.id}.title`)}</option>)}
        </select>

        <label htmlFor="severity">{t('setup.severity')}</label>
        <select id="severity" value={config.severity} onChange={set('severity')}>
          <option value="mild">{t('setup.severity.mild')}</option>
          <option value="moderate">{t('setup.severity.moderate')}</option>
          <option value="severe">{t('setup.severity.severe')}</option>
        </select>

        <label htmlFor="displayName">{t('setup.name')}</label>
        <input id="displayName" value={config.displayName} onChange={set('displayName')} />

        <label htmlFor="locale">{t('setup.language')}</label>
        <select id="locale" value={config.locale} onChange={set('locale')}>
          <option value="en">{t('locale.en')}</option>
          <option value="ar">{t('locale.ar')}</option>
        </select>

        <button type="submit">{t('setup.begin')}</button>
      </form>
    </main>
  );
}
