/**
 * ★ THE TEST RUNNER CAN NOW EXECUTE A COMPONENT. (EVS-2)
 *
 * ============================================================================
 * THIS RETIRES AN ITEM OWED SINCE 17 AUGUST.
 * ============================================================================
 * `citadel/CLAUDE.md` has carried "⛔ Owed — a render assertion" since the day
 * the production page rendered BLANK while the build succeeded, seventeen tests
 * passed, and all three reachability assertions passed. Every one of those
 * assertions asks whether a surface CAN be reached. None EXECUTES it. A human
 * opening the page found the fault in one click.
 *
 * The reason no test had ever rendered a component is mechanical: `node --test`
 * cannot import `.jsx` (`ERR_UNKNOWN_FILE_EXTENSION`). This hook is the whole
 * fix — twenty lines, and the gap it closes cost a deploy.
 *
 * ⚠️ WHY NOT vite's `transformWithEsbuild`. It is exported (vite 8.2.1) and it
 * is ASYNC. `module.registerHooks` is synchronous, so an async transform needs
 * `module.register` and a worker thread, which is a great deal of machinery for
 * a JSX transform. `esbuild.transformSync` fits the synchronous hook exactly.
 * Do not "simplify" this back to vite's helper without also moving to the
 * worker-thread loader.
 */
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';

registerHooks({
  load(url, context, nextLoad) {
    if (!url.endsWith('.jsx')) return nextLoad(url, context);
    const source = readFileSync(fileURLToPath(url), 'utf8');
    const { code } = transformSync(source, {
      loader: 'jsx',
      format: 'esm',
      jsx: 'automatic',          // matches @vitejs/plugin-react — no React import needed
      sourcefile: url,
    });
    return { format: 'module', shortCircuit: true, source: code };
  },
});
