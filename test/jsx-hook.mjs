/**
 * ★ SO THAT `node --test` CAN EXECUTE A COMPONENT.
 *
 * ============================================================================
 * WHY THIS EXISTS, AND WHY IT IS NOT OPTIONAL
 * ============================================================================
 * Without it no test can import a `.jsx` module, so no test can render one —
 * and this repository has already shipped a production page that rendered blank
 * while the build succeeded, every test passed and three reachability
 * assertions agreed. Nothing had executed the page.
 *
 * `R0-C04`'s whole claim is that the map and the structured world are one
 * projection. That claim is only checkable by rendering both and comparing what
 * comes out, so the hook is a precondition for the increment's evidence rather
 * than a testing convenience.
 *
 * ⚠️ `module.registerHooks` IS SYNCHRONOUS, and `esbuild.transformSync` matches
 * it. Vite's `transformWithEsbuild` is async and needs `module.register` plus a
 * worker thread — do not "simplify" this into that without also moving loaders.
 *
 * ⚠️ It also requires Node 22.12+; the repository already pins Node 26 for this
 * reason, and under the machine's default Node 20 every test file fails to load
 * for a reason that has nothing to do with the code.
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
      jsx: 'automatic',
      format: 'esm',
      sourcefile: url,
    });
    return { format: 'module', shortCircuit: true, source: code };
  },
});
