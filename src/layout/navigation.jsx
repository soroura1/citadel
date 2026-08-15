import { Link } from '@tanstack/react-router';
import { navigableSurfaces } from '../surfaces.js';
import { t } from '../locales/index.js';

/**
 * Navigation.
 *
 * ============================================================================
 * DERIVED FROM THE SURFACE INVENTORY. NEVER HAND-WRITTEN.
 * ============================================================================
 *
 * A hand-written navigation bar and a surface inventory drift, and the drift is
 * invisible — which is precisely how the prior attempt shipped six screens
 * nobody could reach.
 *
 * Deriving it means the navigation inventory test can assert that what a person
 * can see matches what exists. Add a surface to `surfaces.js` and it appears
 * here; remove it and the test tells you.
 */
export function Navigation() {
  const surfaces = navigableSurfaces();

  return (
    <nav aria-label={t('nav.label')}>
      <ul>
        {surfaces.map((surface) => (
          <li key={surface.id}>
            {/* Real routes with typed params — not hand-parsed strings. The prior
                attempt had two defects where a nested route fetched a garbage id. */}
            <Link to={surface.path} activeProps={{ 'aria-current': 'page' }}>
              {t(`surface.${surface.id}.title`)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
