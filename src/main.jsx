import './styles.css';
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { EntryScreen } from './features/entry/EntryScreen.jsx';
import { ItemScreen } from './features/item/ItemScreen.jsx';
import { SetupScreen } from './features/setup/SetupScreen.jsx';
import { PlayScreen } from './features/play/PlayScreen.jsx';
import { CHAPTER_1 } from './content/chapter-1.js';
import ATTESTATION from './content/attestation.json' with { type: 'json' };
import { PlayRoute } from './features/play/PlayRoute.jsx';
import { PlaceRoute } from './features/place/PlaceRoute.jsx';
import { RecordView } from './features/record/RecordView.jsx';
import { ObservationRoute } from './features/record/ObservationRoute.jsx';
import { buildRecord } from './engine/record.js';
import * as store from './engine/local-store.js';
import { bundleFrom, startRun, commit, act, advance } from './engine/run.js';
import { Navigation } from './layout/navigation.jsx';
import { HttpCatalogueGateway } from './gateways/catalogue-gateway.js';
import { SURFACES } from './surfaces.js';
import { setLocale, localeCoverage, t } from './locales/index.js';
import { SELECTABLE_ROLES, notYetPlayable } from './engine/roles.js';

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

// Built once. loadBundle validates every scene and decision at load, so a
// broken bundle fails HERE rather than when a participant reaches the scene.
const chapter = bundleFrom(CHAPTER_1);

// ★ EVS-6 — LOCAL, AND ONLY LOCAL. Injected everywhere it is used, so a test
// can enumerate what is stored and prove the delete control removed it.
const local = store.browserStore() ?? store.memoryStore();

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [run, setRun] = useState(null);
  const surface = SURFACES.find((s) => s.path === path) ?? SURFACES[0];
  const go = (p) => { window.history.pushState({}, '', p); setPath(p); };

  return (
    <>
      <Navigation onNavigate={go} />
      {/* ⚠️ A surface declared reachable in surfaces.js MUST be rendered here.
          The deployed-bytes assertion caught exactly this gap once: both R3
          surfaces were declared reachable and never wired in, which is the
          prior attempt's signature failure — six screens shipped that nobody
          could navigate to. */}
      {surface.id === 'entry' && <EntryScreen onContinue={() => go('/setup')} />}
      {surface.id === 'item' && <ItemScreen gateway={gateway} />}
      {surface.id === 'setup' && (
        <SetupScreen
          roles={SELECTABLE_ROLES}
          notYetPlayable={notYetPlayable(CHAPTER_1.scenes)}
          localeCoverage={localeCoverage()}
          onBegin={(config) => {
            // ★ EVS-3 — THE LANGUAGE APPLIES BEFORE THE NEXT SCREEN RENDERS.
            // It was collected and discarded: setLocale('en') ran once at module
            // load and `config.locale` reached the run and nothing else.
            setLocale(config.locale);
            setRun(startRun({ bundle: chapter, config }));
            go('/play');
          }}
        />
      )}
      {/* ★ EVS-5 — THE PLACE. Reachable from navigation, because a participant
          must be able to ask where they are without leaving the scene to find
          out. It renders with or without a run: before one starts it is the
          Bimaristan as it stands; during one it says where you are and what
          your decisions changed. */}
      {/* ★ ONE COMPOSITION, SHARED WITH THE TESTS. The `here` computation
          lived in this file, where no test could run it. */}
      {surface.id === 'place' && (
        <PlaceRoute run={run} bundle={chapter} scenes={CHAPTER_1.scenes} />
      )}

      {surface.id === 'record' && (
        run
          ? <main><h1>{t('record.title')}</h1><RecordView record={buildRecord(run, chapter)} /></main>
          : <main><p role="status">{t('record.no_run')}</p></main>
      )}

      {/* ★ ONE COMPOSITION, SHARED WITH THE TESTS. The store wiring, the
          export and the DELETE live in `ObservationRoute` — this file cannot be
          executed by a test, and those are the two paths whose whole point is
          what does and does not leave the device. */}
      {surface.id === 'observation' && (
        <ObservationRoute
          run={run} bundle={chapter} local={local} t={t}
          onDeleted={() => { setRun(null); go('/'); }}
        />
      )}

      {surface.id === 'play' && (() => {
        // ⚠️ EVS-3 — A DEEP LINK TO /play GOES TO SETUP, NOT TO A RUN.
        //
        // This used to call `startRun({ bundle: chapter })` with no config. A
        // run has required a role since EVS-3, so that call THROWS — and a
        // throw during render is exactly the blank production page that took a
        // human to find on 17 August. There is no configuration to guess: a
        // role chosen for the participant is the "unrestricted authority"
        // default this session exists to remove.
        if (!run) {
          return <SetupScreen
            roles={SELECTABLE_ROLES}
            notYetPlayable={notYetPlayable(CHAPTER_1.scenes)}
            localeCoverage={localeCoverage()}
            onBegin={(config) => { setLocale(config.locale); setRun(startRun({ bundle: chapter, config })); }}
          />;
        }

        // ★ ONE COMPOSITION, SHARED WITH THE TESTS. `PlayRoute` spreads the
        // view; this file previously enumerated PlayScreen's props by hand
        // while the tests spread it, and the two shapes drifted — EVS-3's role
        // panel and private stake reached the tests and not the browser.
        return (
          <PlayRoute
            run={run}
            bundle={chapter}
            attestation={ATTESTATION}
            onChoose={(optionId) => setRun(commit(run, chapter, optionId).run)}
            onAct={(actionId) => setRun(act(run, chapter, actionId).run)}
            onAdvance={() => setRun(advance(run, chapter))}
          />
        );
      })()}
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
