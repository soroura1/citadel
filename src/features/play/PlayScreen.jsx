import { t } from '../../locales/index.js';
import { ResponseView } from './ResponseView.jsx';

/**
 * The Play surface. (R3 F3, F4, F5, F7 · EVS-2)
 *
 * ★ NO SCORE. NOTHING CONGRATULATES A COSTLY DECISION.
 *
 * `DEC-005`: gamify the learning behaviour, never the safety state. A number
 * attached to a resilience state teaches optimisation, which is the behaviour
 * this product exists to make harder rather than easier.
 *
 * ============================================================================
 * ★ EVS-2 — ONE BEAT AT A TIME. THE SIX MOVEMENTS ARE NOT A DOCUMENT.
 * ============================================================================
 * This component used to render all six authored movements as one ordered list,
 * so `turn` — what the commitment causes — and `residue` — what it leaves —
 * were on the page before the player had chosen anything. The interface was
 * spoiling its own drama, which is exactly what FPE-01 forbids.
 *
 * It now renders `presents`: the movements the CURRENT PHASE stages, projected
 * by `view()`. At `pre_commit` the turn is not hidden by a conditional; it is
 * not in the props at all. That distinction matters — a component trusted not
 * to draw something it holds is one careless edit from drawing it.
 *
 * ⚠️ DO NOT REACH FOR `scene.turn` OR `scene.residue` HERE. They are on the
 * scene object, which is passed for its chrome (title, bell, register, art).
 * `test/render.test.js` asserts their PROSE is absent from pre-commit markup,
 * so a reach past the projection fails a test rather than shipping.
 */

/**
 * ★ RENDER WHAT THE CONTENT DECLARES — NEVER A KEY THIS FILE INVENTS.
 *
 * An earlier version built `scene.${scene.id}.${movement}` and looked that up.
 * The content declares `scene.01.01.orientation`; the constructed key was
 * `scene.sc-01-01.orientation`. Two naming schemes for one string, so the
 * authored prose could never be found and every movement would have rendered
 * its own key back at the reader.
 *
 * A movement is one of three shapes, and each is honest about itself:
 *   · a plain string        — prose authored in the content file
 *   · { key }               — a locale key the content NAMES
 *   · [ { character_id, wants } ] — desire, which is a list of people
 */
function renderMovement(content) {
  if (content == null) return null;
  if (typeof content === 'string') return <p>{content}</p>;

  if (Array.isArray(content)) {
    return (
      <ul>
        {content.map((want, i) => (
          <li key={want.character_id ?? i}>
            <strong>{want.character_id}</strong> {want.wants}
          </li>
        ))}
      </ul>
    );
  }

  // An object carrying its own key. NOT the `what_matters_now` beside it —
  // t() returns ⟨key⟩ for a missing string on purpose, so the gap is visible
  // and reaches the coverage report. Quietly substituting the authored English
  // would hide exactly what that report exists to find.
  if (content.key) return <p>{t(content.key)}</p>;
  return null;
}

/* Which scene carries which candidate image. Only the scenes an image exists
 * for appear here; the rest render text-only, which is the designed state and
 * not a gap. Binding is still gated on Q10 — these are candidates, and the
 * provisional band says so on every one. */
const sceneArt = {
  'sc-01-01': 'gate-of-names',
  'sc-01-02': 'bay-that-went-dark',
};

export function PlayScreen({
  scene, phase, presents = [], decision, presented, response,
  state, onChoose, onAdvance, textPath = false,
}) {
  if (!scene) return <main><p role="alert">{t('play.no_scene')}</p></main>;

  const register = scene.emotional_state?.register ?? null;

  /* ★ THE TEXT PATH SUBSTITUTES AT THE ENCOUNTER, AND NOWHERE ELSE.
     All four authored `text_equivalent` strings are pre-commit material —
     arrival, pressure, who wants what, the difficulty. None narrates the turn
     or the residue, which is why substituting them here does not leak past the
     commitment. From `interactive` onwards both paths render the same beats,
     because parity means reaching the same decision and the same response, not
     reading a synopsis instead of playing. */
  const textPathEncounter = textPath && phase === 'pre_commit' && scene.text_equivalent;

  return (
    <main data-register={register ?? undefined} data-phase={phase}>
      {/* ★ V9 — THE REGISTER IS NAMED IN WORDS, not only in type and space.
          A scene that opens differently only through measure and motion says
          nothing to a screen reader and nothing on a printed page. The register
          drives how the scene ARRIVES; this sentence is what it MEANS, and the
          two are separate on purpose. */}
      {register && (
        <p className="register-note">
          <span className="visually-hidden">{t('register.label')} </span>
          {t(`register.${register}`)}
        </p>
      )}

      {/* ★ THE BELL — canon's own clock. Chapter 1 runs "First Bell to shortly
          after the Third Bell", so position is told in bells rather than
          "Scene 2 of 4". A number would be true of any content; this is true of
          this world. */}
      {scene.bell && (
        <p className="bell">{t('play.bell')} <b>{t(`bell.${scene.bell}`)}</b></p>
      )}

      {/* Atmosphere, never information. `art is additive`: the scene is
          complete in text, so no clue lives only here. */}
      {!textPath && sceneArt[scene.id] && (
        <figure className="scene-image" data-provisional={t('provisional.badge')}>
          <img src={`/scenes/${sceneArt[scene.id]}.jpg`}
               alt={t(`art.${sceneArt[scene.id].replace(/-/g, '_')}.alt`)}
               width="1100" height="733" loading="lazy" />
        </figure>
      )}

      <h1>{t(`scene.${scene.id}.title`)}</h1>

      {/* ★ EVS-2 — WHERE THE PLAYER IS, IN WORDS. A beat that changes what is
          on screen without saying so reads as content appearing and vanishing.
          Named rather than numbered: "of 4" would be a progress bar with the
          bar removed. */}
      <p className="beat"><span className="visually-hidden">{t('play.beat')} </span>{t(`beat.${phase}`)}</p>

      {textPathEncounter ? (
        <section aria-label={t('play.text_path')}>
          <p>{t(scene.text_equivalent.key)}</p>
        </section>
      ) : (
        presents.length > 0 && (
          <ol aria-label={t('play.movements')}>
            {presents.map(({ movement, content }) => (
              <li key={movement}>
                <h2>{t(`movement.${movement}`)}</h2>
                {renderMovement(content)}
              </li>
            ))}
          </ol>
        )
      )}

      {/* ★ THE DECISION EXISTS ONLY AT `interactive`. `view()` supplies it
          nowhere else, so this is not a conditional protecting a secret — there
          is nothing here to protect at any other beat. */}
      {presented && (
        <section className="decision" aria-label={t('play.decision')}>
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
                  {/* FPE-05 — the risk is available BEFORE commitment, because
                      the role could reasonably know it. */}
                  <p className="risk">{o.risks}</p>
                  {/* Available on request, not shouted: who would defend this.
                      It is what makes the option a position rather than a trap. */}
                  <details>
                    <summary>{t('play.who_would_defend')}</summary>
                    <p className="defensible">{o.defensibleBy}</p>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {response && <ResponseView response={response} />}

      {/* ★ ADVANCING IS A SEPARATE ACT FROM COMMITTING.
          There is no control here at `interactive`: the way forward is the
          decision, and a "skip" beside it would make the chapter's one real
          moment optional. Everywhere else the player leaves when they are
          ready — the response is not a flash between two pages. */}
      {phase !== 'interactive' && (
        <p className="advance">
          <button type="button" onClick={() => onAdvance?.()}>{t(`advance.${phase}`)}</button>
        </p>
      )}

      {/* ★ F5 — state shown as BANDS, never numbers, and never ranked.
          No praise, no congratulation, no total. This is where the Bimaristan
          STANDS, which the player has carried since the last scene — not the
          delta, which belongs to the response beat alone. */}
      <section className="state" aria-label={t('play.state')}>
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
