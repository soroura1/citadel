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
 *
 * ============================================================================
 * ⚠️ NO ROUTER LINK UNTIL A ROUTER IS MOUNTED — R0 CRASHED ON THIS
 * ============================================================================
 * This used TanStack Router's <Link>. R0 mounts NO RouterProvider — main.jsx
 * navigates with window.history, because "a real router lands with the first
 * nested route (R3)".
 *
 * So <Link> called into a null router context and threw
 * `Cannot read properties of null (reading 'stores')` during render. The whole
 * page was BLANK in production, while:
 *
 *   - the build succeeded
 *   - 17 tests passed
 *   - all three reachability assertions passed
 *   - /version, /health and the API all returned 200
 *
 * Nothing executed the page. That is what H5 is for, and it caught this on its
 * first run. The fourth assertion -- "it renders" -- is now in
 * test/reachability.test.js.
 *
 * The typed-route Link returns at R3, WITH the RouterProvider that makes it work.
 */
export function Navigation({ onNavigate }) {
  const surfaces = navigableSurfaces();

  return (
    <nav aria-label={t('nav.label')}>
      <ul>
        {surfaces.map((surface) => (
          <li key={surface.id}>
            {/* A real href, so the link works with JS disabled and is a real
                navigation target for assistive technology. onNavigate keeps the
                SPA transition; the href is what makes it honest. */}
            <a
              href={surface.path}
              aria-current={
                typeof window !== 'undefined' && window.location.pathname === surface.path
                  ? 'page'
                  : undefined
              }
              onClick={(e) => {
                if (!onNavigate) return;
                e.preventDefault();
                onNavigate(surface.path);
              }}
            >
              {t(`surface.${surface.id}.title`)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
