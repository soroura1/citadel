import { t } from '../../locales/index.js';

/**
 * The entry surface — R0 F2.
 *
 * ============================================================================
 * ENFORCEMENT MECHANISM E1
 * It states the purpose and the four boundary exclusions BEFORE any credential
 * decision. "Before" is LITERAL: not on a page reached after signing in, and
 * not behind a link.
 * ============================================================================
 *
 * A user who forms an impression of the product before reading its limits has
 * not read them. The prior attempt carried the boundary SENTENCE and lost most
 * of its enforcement, because the sentence and the mechanisms that made it true
 * lived in different places and only the sentence was copied forward.
 *
 * Also: works without images, reachable with no session, language selectable
 * before sign-in — a user who cannot READ the boundary statement has not read it.
 */
export function EntryScreen({ onContinue }) {
  return (
    <main>
      {/* First light over the Bimaristan. Atmosphere, never information — the
          page is complete without it, and `alt` carries what a sighted viewer
          takes from it rather than a filename. */}
      <figure className="hero" data-provisional={t('provisional.badge')}>
        <img src="/scenes/first-light.jpg" alt={t('art.first_light.alt')}
             width="1100" height="733" fetchPriority="high" />
      </figure>

      <h1>{t('entry.heading')}</h1>
      <p>{t('entry.lede')}</p>

      {/* The boundary is not a footnote. It is the first substantive content. */}
      <section aria-labelledby="boundary">
        <h2 id="boundary">{t('boundary.heading')}</h2>
        <p><strong>{t('boundary.statement')}</strong></p>
        <p>{t('boundary.not_intro')}</p>
        <ul>
          <li>{t('boundary.not_1')}</li>
          <li>{t('boundary.not_2')}</li>
          <li>{t('boundary.not_3')}</li>
          <li>{t('boundary.not_4')}</li>
        </ul>
      </section>

      {/* The credential decision comes AFTER the boundary, never before. */}
      <button type="button" onClick={onContinue}>{t('entry.continue')}</button>
    </main>
  );
}
