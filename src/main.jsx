import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { EntryScreen } from './features/entry/EntryScreen.jsx';
import { ItemScreen } from './features/item/ItemScreen.jsx';
import { Navigation } from './layout/navigation.jsx';
import { HttpCatalogueGateway } from './gateways/catalogue-gateway.js';
import { SURFACES } from './surfaces.js';
import { setLocale } from './locales/index.js';

setLocale('en');

// ---------------------------------------------------------------------------
// R0 PLACEHOLDER SESSION — delete this block at R2.
//
// checklist-api's requireSession validates PRESENCE ONLY in R0; real signature
// validation arrives with identity-enrolment (Q7-Q9). But something has to be
// present, and R0 has no identity to issue it — so the walk sets its own.
//
// This works because the API is reached SAME-ORIGIN through /api/content. A
// cookie set here travels with the gateway's `credentials: 'include'` request.
// If the proxy is ever replaced by a cross-origin absolute VITE_API, this stops
// working and the walk breaks again -- keep them together.
//
// It is deliberately NOT a login screen. Inventing a credential UI two releases
// before identity exists is how scope arrives early and never leaves.
//
// AT R2: delete these two lines. The broker issues the session.
// ---------------------------------------------------------------------------
const R0_PLACEHOLDER_SESSION = 'r0-walk';
document.cookie = `citadel_session=${R0_PLACEHOLDER_SESSION}; path=/; SameSite=Lax`;

// R0 has two surfaces. A real router lands with the first nested route (R3);
// the surface INVENTORY is already the source of truth, which is the part that matters.
const gateway = new HttpCatalogueGateway({ baseUrl: import.meta.env.VITE_API ?? '/api/content' });

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const surface = SURFACES.find((s) => s.path === path) ?? SURFACES[0];
  const go = (p) => { window.history.pushState({}, '', p); setPath(p); };

  return (
    <>
      <Navigation onNavigate={go} />
      {surface.id === 'entry'
        ? <EntryScreen onContinue={() => go('/item')} />
        : <ItemScreen gateway={gateway} />}
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
