import { t } from '../../locales/index.js';
import { movementsOf } from '../../engine/scene.js';
import { presentOptions } from '../../engine/decision.js';

/**
 * The Play surface. (R3 F3, F4, F5, F7)
 *
 * ★ NO SCORE. NOTHING CONGRATULATES A COSTLY DECISION.
 *
 * `DEC-005`: gamify the learning behaviour, never the safety state. A number
 * attached to a resilience state teaches optimisation, which is the behaviour
 * this product exists to make harder rather than easier.
 */
export function PlayScreen({ scene, decision, state, role, onChoose, textPath = false }) {
  if (!scene) return <main><p role="alert">{t('play.no_scene')}</p></main>;

  const presented = decision ? presentOptions(decision, { role }) : null;

  return (
    <main>
      <h1>{t(`scene.${scene.id}.title`)}</h1>

      {/* ★ F7 — THE TEXT PATH IS NOT A FALLBACK.
          It reaches the same decision. A "text version" that stops short of the
          choice excludes a whole access path from the product's only real
          moment. */}
      {textPath && scene.text_equivalent ? (
        <section aria-label={t('play.text_path')}>
          <p>{scene.text_equivalent}</p>
        </section>
      ) : (
        <ol aria-label={t('play.movements')}>
          {movementsOf(scene).map(({ movement, content }) => (
            <li key={movement}>
              <h2>{t(`movement.${movement}`)}</h2>
              <p>{typeof content === 'string' ? content : t(`scene.${scene.id}.${movement}`)}</p>
            </li>
          ))}
        </ol>
      )}

      {presented && (
        <section aria-label={t('play.decision')}>
          <h2>{t(presented.prompt?.key ?? 'play.decision')}</h2>

          {!presented.authorised ? (
            /* A role without authority OBSERVES, and is told WHICH rule applied
               rather than having the decision silently disappear. */
            <p role="status">{t(`refusal.${presented.refusal}`)}</p>
          ) : (
            <ul>
              {/* Authored order. Never sorted by desirability — sorting would
                  tell the participant which option is "best" before they have
                  weighed anything. */}
              {presented.options.map((o) => (
                <li key={o.id}>
                  <button type="button" onClick={() => onChoose?.(o.id)}>{t(o.label.key)}</button>
                  <p>{o.protects}</p>
                  {/* Available on request, not shouted: who would defend this.
                      It is what makes the option a position rather than a trap. */}
                  <details>
                    <summary>{t('play.who_would_defend')}</summary>
                    <p>{o.defensibleBy}</p>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ★ F5 — state shown as BANDS, never numbers, and never ranked.
          No praise, no congratulation, no total. */}
      <section aria-label={t('play.state')}>
        <dl>
          {Object.entries(state?.season ?? {}).map(([v, band]) => (
            <div key={v}>
              <dt>{t(`variable.${v}`)}</dt>
              <dd>{t(`band.${band}`)}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
