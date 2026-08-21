import { createRoot } from 'react-dom/client';

/**
 * ⛔ SCAFFOLDING. THERE IS NO APPLICATION HERE YET.
 *
 * The repository was reset to its engineering and deployment infrastructure on
 * 2026-08-21. Everything that was a game — the engine, the surfaces, the
 * content, the locales, the styles and every test of them — was deleted
 * deliberately, to be rebuilt from the planning and the story canon, one
 * reviewed step at a time.
 *
 * ⚠️ THIS FILE EXISTS BECAUSE VITE NEEDS AN ENTRY, AND FOR NO OTHER REASON.
 * `index.html` names `/src/main.jsx`; without it `npm run build` fails and the
 * pipeline goes red for a reason that has nothing to do with the code. It
 * mounts an empty root and does nothing else.
 *
 * ⚠️ AND A BLANK PAGE IS AMBIGUOUS, WHICH THIS PROJECT HAS PAID FOR. On
 * 17 August a production page rendered blank while the build succeeded, every
 * test passed and three reachability assertions agreed — because nothing
 * executed the page. So this one says what it is, in the markup, rather than
 * leaving a reader to decide between "not built yet" and "broken".
 *
 * Delete this comment and this file the moment a real entry replaces it.
 */
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <main data-scaffolding="true">
      <p>This platform is being rebuilt. There is nothing to play here yet.</p>
    </main>,
  );
}
