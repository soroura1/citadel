import { t } from '../../locales/index.js';
import { RecordView } from '../record/RecordView.jsx';

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
export function ChapterEnd({ state, history, owed = [], record = null, onObservation }) {
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

      {/* ★ EVS-6 — THE RECORD, NOT A LIST OF SCENE TITLES.
          This section listed `t(\`scene.${h.sceneId}.title\`)` and nothing
          else — FPE-04's named failure, verbatim: "a chapter end that lists
          only scene titles". A participant who cannot say what they did cannot
          debrief, and a debrief they cannot ground is a quiz about a story. */}
      {record && <RecordView record={record} />}

      {!record && owed.length > 0 && (
        <section aria-label={t('chapter_end.owed')}>
          <h2>{t('chapter_end.owed')}</h2>
          {/* Named, never counted. A number here would be a score. */}
          <p>{t('chapter_end.owed_body')}</p>
        </section>
      )}

      {/* ★ THE ONE THING THE PARTICIPANT LEAVES WITH.
          ⚠️ B3 — NOTHING CONGRATULATES. There is no "chapter complete", no
          checkmark and no total here: the honest end state is the record, and
          a route to the note they take away. */}
      <p className="advance">
        <button type="button" onClick={() => onObservation?.()}>{t('chapter_end.to_observation')}</button>
      </p>
    </main>
  );
}
