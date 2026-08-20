import { t } from '../../locales/index.js';

/**
 * ★ WHAT THE PARTICIPANT CAN DO BEFORE COMMITTING. (EVS-4)
 *
 * ============================================================================
 * TWO ACTION TYPES, AND THE DIFFERENCE IS NOT COSMETIC
 * ============================================================================
 * An INSPECTION reads a place, an instrument or a record. It always answers.
 * A CONSULTATION asks a person — and a person may answer, qualify, refuse or
 * withhold. Only one of the two can decline, which is why they are separate
 * controls and not one "interact" button with a noun after it.
 *
 * ⚠️ NO COPPER HERE. Copper is spent exactly once in this stylesheet, on the
 * decision. Investigating is what you do before the chapter turns; making it
 * look as decisive as the turn would tell the reader that two things are the
 * most important thing, which is the same as telling them nothing.
 */
export function ActionsPanel({ actions = [], discoveries = [], lastResponse, onAct }) {
  const hasSomethingToShow = actions.length > 0 || discoveries.length > 0;
  if (!hasSomethingToShow) return null;

  return (
    <section className="actions" aria-label={t('play.actions')}>
      {actions.length > 0 && (
        <>
          <h2>{t('play.actions')}</h2>
          <ul className="action-list">
            {actions.map((a) => (
              <li key={a.id} data-action-type={a.type}>
                <button type="button" onClick={() => onAct?.(a.id)}>
                  {/* The verb is part of the control, because the two acts are
                      different things and a participant should know which one
                      they are about to perform. */}
                  <span className="verb">{t(`action.${a.type}`)}</span>{' '}
                  <span className="target">{a.target.id}</span>
                </button>
                {a.cost && (
                  /* ⚠️ A NOTE, NOT A PRICE. Canon names the currencies and sets
                     no amounts; a number here would be a score with the word
                     removed. */
                  <p className="cost">
                    <span className="label">{t(`cost.${a.cost.currency}`)}</span> {a.cost.what}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* ★ WHAT THE LAST ACT PRODUCED, IN THE PERSON'S OWN POSITION.
          Canon writes the ACT and not the line — "Fadl classifies the
          patient-safety event and sets quality follow-up without taking
          clinical or electrical authority" — so what is rendered is what canon
          describes. `withholds` is the limit, and it is shown WITH the answer
          rather than instead of it: both halves are the same act. */}
      {lastResponse && (
        <aside className="response-from" aria-label={t('play.who_responded')}>
          <p><strong>{lastResponse.character_id}</strong> {lastResponse.does}</p>
          {lastResponse.withholds && (
            <p className="withholds">
              <span className="label">{t('play.withholds')}</span> {lastResponse.withholds}
            </p>
          )}
          {lastResponse.acts_independently && (
            <p className="acts-independently">{t('play.acts_independently')}</p>
          )}
        </aside>
      )}

      {discoveries.length > 0 && (
        <>
          <h3>{t('play.what_you_know')}</h3>
          {/* ★ EVERY FACT CARRIES ITS SOURCE. Chapter 1 turns on two people
              reading accurate information in different rooms; a list that
              flattened everything into "known" would lose the only thing that
              makes the contradiction visible. */}
          <ul className="discoveries">
            {discoveries.map((d) => (
              <li key={d.evidenceId} data-partial={d.partial ? 'true' : undefined}>
                <p>{d.what}</p>
                <p className="provenance">
                  {t('play.according_to')} <cite>{d.source.id}</cite>
                  {d.partial && <> · {t('play.partial')}</>}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
