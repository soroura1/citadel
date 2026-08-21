import { t } from '../../locales/index.js';

/**
 * ★ WHAT HAPPENED, AND WHAT YOU DID. (EVS-6)
 *
 * ============================================================================
 * FPE-04's NAMED FAILURE WAS "A CHAPTER END THAT LISTS ONLY SCENE TITLES."
 * ============================================================================
 * That is exactly what this replaced. It was flagged at EVS-2 as owed to this
 * session, and it is closed here: every scene names the option committed to,
 * whether it was DECIDED or SUPPORTED, what was found out before it and where
 * each fact came from, and what moved.
 *
 * ⚠️ NOTHING RANKS. Improvements and costs sit in one list, unsorted, because
 * sorting a cost below a benefit is a judgement the record has no business
 * making — and a total would be a score. `DEC-005`.
 */
export function RecordView({ record }) {
  if (!record) return null;

  return (
    <section className="record" aria-label={t('record.title')}>
      <h2>{t('record.title')}</h2>

      <ol className="record-scenes">
        {record.scenes.map((scene) => (
          <li key={scene.sequence} data-scene={scene.sceneId}>
            <h3>
              {t(`scene.${scene.sceneId}.title`)}
              {scene.bell && <> · {t(`bell.${scene.bell}`)}</>}
            </h3>

            {/* ★ THE SPECIFIC OPTION. A record that cannot say what you did is
                not a record of what you did. */}
            {scene.option && (
              <p className="record-option">
                <span className="label">
                  {t(scene.committedAs === 'support' ? 'record.you_supported' : 'record.you_decided')}
                </span>{' '}
                <b>{t(scene.option.labelKey)}</b>
              </p>
            )}

            {scene.committedAs === 'support' && scene.authorityHeldBy?.length > 0 && (
              <p className="record-authority">
                {t('play.authority_held_by')}{' '}
                {scene.authorityHeldBy.map((r) => t(`role.${r.replace('role.', '')}.title`)).join(', ')}
              </p>
            )}

            {/* What was known at the moment of the commitment, with provenance —
                so a debrief can ask where a belief came from rather than
                treating every held fact as equally sound. */}
            {scene.evidenceConsulted.length > 0 && (
              <details className="record-evidence">
                <summary>
                  {t('record.what_you_knew')} ({scene.evidenceConsulted.length})
                </summary>
                <ul>
                  {scene.evidenceConsulted.map((e) => (
                    <li key={e.evidenceId}>
                      {e.what}{' '}
                      <span className="provenance">{t('play.according_to')} <cite>{e.source.id}</cite></span>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {scene.changes.length > 0 && (
              <ul className="record-changes">
                {scene.changes.map((c) => (
                  <li key={`${c.kind}.${c.variable}`}>
                    <span className="moved-name">
                      {c.kind === 'season' ? t(`variable.${c.variable}`) : c.variable}
                    </span>{' '}
                    <span className="moved-to">{c.kind === 'season' ? t(`band.${c.to}`) : c.to}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* ★ SG-1 — RESIDUE IS PER PATHWAY NOW, AND IT IS A LIST.
                Three approaches leave three different worlds behind; one shared
                sentence described all of them, so a debrief could not
                reconstruct a cost. A scene whose options carry no residue still
                renders its own string, which is why both shapes are handled. */}
            {Array.isArray(scene.residue)
              ? scene.residue.length > 0 && (
                  <ul className="record-residue">
                    {scene.residue.map((r) => <li key={r.what}>{r.what}</li>)}
                  </ul>
                )
              : scene.residue && <p className="record-residue">{scene.residue}</p>}
          </li>
        ))}
      </ol>

      {/* ★ WHAT THE WORLD IS STILL CARRYING. Named, never counted. */}
      {record.worldMemory.length > 0 && (
        <section aria-label={t('place.what_changed')}>
          <h3>{t('place.what_changed')}</h3>
          <ul>
            {record.worldMemory.map((m) => (
              <li key={m.locationId}><strong>{m.name}</strong> — {m.what}</li>
            ))}
          </ul>
        </section>
      )}

      {/* The debt that outlives the chapter. A participant told nothing is
          outstanding will not expect Chapter 2 to answer for Chapter 1. */}
      {record.owed.length > 0 && (
        <section aria-label={t('chapter_end.owed')}>
          <h3>{t('chapter_end.owed')}</h3>
          <p>{t('chapter_end.owed_body')}</p>
        </section>
      )}
    </section>
  );
}
