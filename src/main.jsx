import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { EntryScreen } from './features/entry/EntryScreen.jsx';
import { ItemScreen } from './features/item/ItemScreen.jsx';
import { Navigation } from './layout/navigation.jsx';
import { HttpCatalogueGateway } from './gateways/catalogue-gateway.js';
import { SURFACES } from './surfaces.js';
import { setLocale } from './locales/index.js';

setLocale('en');

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
