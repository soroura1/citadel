import { t } from '../../locales/index.js';

/**
 * The end of the chapter. (POC P7)
 *
 * ⚠️ NOT A SCORE SCREEN, AND NOT A CONGRATULATION.
 *
 * DEC-005: gamify the learning behaviour, never the safety state. There is no
 * total, no grade and no "well done" — the chapter ends by showing what state
 * the Bimaristan is in and what is still owed, which is the honest report.
 *
 * The delayed consequence is CROSS-CHAPTER by definition, so what is owed
 * stays owed. Saying so is the point: a participant who is told nothing is
 * outstanding will not expect Chapter 2 to answer for Chapter 1.
 */
export function ChapterEnd({ state, history, owed = [] }) {
  return (
    <main>
      <h1>{t('chapter_end.heading')}</h1>
      <p>{t('chapter_end.lede')}</p>

      <section aria-label={t('chapter_end.state')}>
        <h2>{t('chapter_end.state')}</h2>
        <dl>
          {Object.entries(state?.season ?? {}).map(([v, band]) => (
            <div key={v}>
              <dt>{t(`variable.${v}`)}</dt>
              <dd>{t(`band.${band}`)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-label={t('chapter_end.decisions')}>
        <h2>{t('chapter_end.decisions')}</h2>
        <ol>
          {(history ?? []).map((h) => (
            <li key={h.sequence}>{t(`scene.${h.sceneId}.title`)}</li>
          ))}
        </ol>
      </section>

      {owed.length > 0 && (
        <section aria-label={t('chapter_end.owed')}>
          <h2>{t('chapter_end.owed')}</h2>
          {/* Named, never counted. A number here would be a score. */}
          <p>{t('chapter_end.owed_body')}</p>
        </section>
      )}
    </main>
  );
}
