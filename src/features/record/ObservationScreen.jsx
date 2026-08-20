import { useState } from 'react';
import { t } from '../../locales/index.js';
import { SECTIONS, PROMPT_KEYS, EXPORT_LABEL } from '../../engine/observation.js';
import { reflectionPrompts } from '../../engine/reflection.js';

/**
 * ★ REFLECTION, AND THE NOTE THEY TAKE AWAY. (EVS-6)
 *
 * ============================================================================
 * ⚠️ EVERY FIELD ON THIS PAGE IS OPEN TEXT. THERE IS NO OPTION ANYWHERE.
 * ============================================================================
 * *"A reflection assembled from our sentences reflects us."* No multiple
 * choice, no answer key, no rubric, and no score — `reflection.schema.json` has
 * no `score` property and refuses additional ones, so a scored reflection is
 * not something this build declines to do; it is something it cannot express.
 *
 * ★ B3 — NOTHING CONGRATULATES. No "observation complete", no checkmark, no
 * total. The end state is that the participant has their note.
 *
 * ★ B1 — IT NEVER LEAVES THE BROWSER. There is no submit button, because there
 * is nowhere to submit to. `test/privacy.test.js` runs this whole flow with
 * `fetch`, `XMLHttpRequest`, `sendBeacon` and `WebSocket` replaced by throwing
 * spies.
 */
export function ObservationScreen({
  record = null, saved = {}, onSaveReflection, onSaveObservation, onExport, onDelete,
}) {
  const [reflection, setReflection] = useState(saved.reflection ?? {});
  const [observation, setObservation] = useState(saved.observation ?? {});
  const prompts = reflectionPrompts(record);

  const complete = SECTIONS.every((s) => (observation[s] ?? '').trim().length > 0);

  return (
    <main className="observation-screen">
      <h1>{t('observation.title')}</h1>
      <p>{t('observation.lede')}</p>

      {/* --- reflection: reconstruct, then say it in your own words --------- */}
      <section aria-label={t('reflection.title')}>
        <h2>{t('reflection.title')}</h2>
        {prompts.map((p) => (
          <div key={p.key} className="prompt" data-derived={p.derived ? 'true' : undefined}>
            <label htmlFor={p.key}>
              {t(p.key)}
              {/* The causal prompt names the participant's own last commitment,
                  so the question is about their chapter and not chapters in
                  general. */}
              {p.derived && p.about && <> <b>{t(p.about)}</b></>}
            </label>
            <textarea
              id={p.key} rows={4}
              value={reflection[p.key] ?? ''}
              onChange={(e) => setReflection((r) => ({ ...r, [p.key]: e.target.value }))}
            />
          </div>
        ))}
        <p className="advance">
          <button type="button" onClick={() => onSaveReflection?.(reflection)}>
            {t('reflection.keep')}
          </button>
        </p>
      </section>

      {/* --- the observation: about THEIR hospital, not the Bimaristan ------ */}
      <section aria-label={t('observation.heading')}>
        <h2>{t('observation.heading')}</h2>

        {/* ★ B5, on the page and not only on the export. A participant should
            know what they are writing before they write it. */}
        <p className="export-label">{EXPORT_LABEL}</p>
        <p className="field-note">{t('boundary.statement')}</p>

        {SECTIONS.map((section) => (
          <div key={section} className="prompt">
            <label htmlFor={section}>{t(PROMPT_KEYS[section])}</label>
            <textarea
              id={section} rows={3}
              value={observation[section] ?? ''}
              onChange={(e) => setObservation((o) => ({ ...o, [section]: e.target.value }))}
            />
            {/* ★ B4 — the last two are what make this an observation rather
                than a finding, so they are marked required rather than
                quietly expected. */}
            {(section === 'notSureAbout' || section === 'questionToAsk') && (
              <p className="field-note">{t('observation.required_note')}</p>
            )}
          </div>
        ))}

        <p className="advance">
          <button type="button" onClick={() => onSaveObservation?.(observation)}>
            {t('observation.keep')}
          </button>
        </p>

        {/* ⚠️ TWO FORMATS, AND NEITHER NEEDS THIS APPLICATION TO EXIST LATER.
            If reading it again next month required logging in, the product
            would have kept their note about their own hospital. */}
        <p className="advance">
          <button type="button" disabled={!complete} onClick={() => onExport?.('text', observation)}>
            {t('observation.export_text')}
          </button>{' '}
          <button type="button" disabled={!complete} onClick={() => onExport?.('json', observation)}>
            {t('observation.export_json')}
          </button>
        </p>
        {!complete && <p className="field-note">{t('observation.export_needs_all_four')}</p>}
      </section>

      {/* --- and they can take it all back --------------------------------- */}
      <section aria-label={t('observation.delete_heading')}>
        <h2>{t('observation.delete_heading')}</h2>
        <p>{t('observation.delete_body')}</p>
        <p className="advance">
          <button type="button" onClick={() => onDelete?.()}>{t('observation.delete')}</button>
        </p>
      </section>
    </main>
  );
}
