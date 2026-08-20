import { t } from '../../locales/index.js';

/**
 * ★ THE RESPONSE BEAT. What the commitment CAUSED, before anything advances.
 *
 * ============================================================================
 * FPE-02, FPE-03 — AND THE HONESTY THAT MAKES THIS SAFE TO SHIP THIN
 * ============================================================================
 * FPE-02: a commitment receives an immediate causal response before navigation
 * advances. FPE-03: that response names BOTH the protected value and the cost.
 *
 * Chapter 1 canon authors no post-commitment narration. EVS-1 recorded that
 * rather than filling it in, so most of what this component renders is a THIN
 * composition of the option's own `protects` and `risks` — restated after the
 * fact, which is a restatement and not a revelation.
 *
 * ⚠️ THAT IS MARKED, NOT DISGUISED. A derived response carries the provisional
 * band; an authored one does not. Without the mark, a beat that is waiting for
 * content is indistinguishable from a beat that has it, and the second EVS gate
 * would be passed by a slice that never got written.
 *
 * ★ AND NO CHARACTER IS EVER COMPOSED. Where canon names a reaction — Scene 4,
 * where Fadl, Maha and Rami each act differently per pathway — it is rendered
 * verbatim. Where canon is silent, nobody speaks. Putting a name in front of an
 * option's `risks` would be inventing a performance, which is the one thing the
 * content rules forbid outright.
 */
export function ResponseView({ response }) {
  if (!response) return null;
  const { narrative, characters, changes, turn, label, committedAs, authorityHeldBy } = response;
  const derived = narrative.provenance === 'derived';

  return (
    <section className="response" aria-label={t('play.response')}>
      <h2>{t('play.response')}</h2>

      {/* ★ FPE-04 — the SPECIFIC option, named. A record that lists only what
          scene you were in cannot tell you what you did in it. */}
      <p className="chosen">
        <span className="visually-hidden">{t('play.you_chose')} </span>
        <b>{t(label.key)}</b>
      </p>

      {/* ★ DECIDED, OR SUPPORTED. Two different acts, and canon distinguishes
          them: a solo player holds one direct authority and seeks other
          judgments. A record that flattens the two cannot answer what the
          participant's role actually changed. */}
      {committedAs === 'support' && authorityHeldBy && (
        <p className="committed-as">
          {t('play.you_supported')}{' '}
          {authorityHeldBy.map((r) => t(`role.${r.replace('role.', '')}.title`)).join(', ')}
        </p>
      )}

      {/* What changed in the world's own words. Staged in post_commit, so this
          is the first moment it exists at all. */}
      {turn && <p className="turn">{turn}</p>}

      <div className="narrative" data-provisional={derived ? t('provisional.badge') : undefined}>
        {narrative.provenance === 'authored' ? (
          <p>{t(narrative.key)}</p>
        ) : (
          <>
            {/* Only the sources the content DECLARES. `derived_from` is honoured
                rather than assumed: gate-access's keep-schedule declares
                protects and risks and not effects, so its account does not cite
                the state moves even though they are shown below. */}
            {narrative.protects && (
              <p><span className="label">{t('play.protected')}</span> {narrative.protects}</p>
            )}
            {narrative.risks && (
              <p><span className="label">{t('play.cost')}</span> {narrative.risks}</p>
            )}
            <p className="provisional-note">{t('play.response_derived')}</p>
          </>
        )}
      </div>

      {/* ★ THE STATE MOVES, kept separate from the account of them. These are
          what happened; the block above is a way of describing it. A derived
          narrative may be forbidden from citing them and they are still shown,
          because the player is owed the change either way.

          Bands, never numbers. Nothing here congratulates. */}
      {changes.length > 0 && (
        <section aria-label={t('play.what_moved')}>
          <h3>{t('play.what_moved')}</h3>
          <ul className="changes">
            {changes.map((c) => (
              <li key={`${c.kind}.${c.variable}`} data-worsened={c.worsened === true ? 'true' : undefined}>
                <span className="moved-name">{c.kind === 'season' ? t(`variable.${c.variable}`) : c.variable}</span>
                {' '}
                <span className="moved-to">
                  {c.kind === 'season' ? t(`band.${c.to}`) : c.to}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {characters.length > 0 && (
        <section aria-label={t('play.who_responded')}>
          <h3>{t('play.who_responded')}</h3>
          <ul className="characters">
            {characters.map((c) => (
              <li key={c.character_id}><strong>{c.character_id}</strong> {c.responds}</li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
