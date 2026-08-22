/**
 * DEPLOYMENT SHAPE — the parts of the release that only fail in production.
 *
 * ============================================================================
 * ⛔ AN SPA FALLBACK TURNS A MISSING ASSET INTO A CACHEABLE 200
 * ============================================================================
 * On 22 August `/layers/…png` was requested before that release shipped it. The
 * fallback did exactly what it is written to do and answered 200 with
 * `index.html`; Cloudflare, correctly, cached that HTML for the four hours its
 * `max-age` allowed. The asset then deployed, the origin served it perfectly,
 * and the edge kept returning 761 bytes of HTML in place of a PNG.
 *
 * The failure is structural. `try_files … /index.html` makes every
 * not-yet-shipped asset path a cacheable success, and nothing downstream can
 * tell that 200 from a real one. Static directories are therefore handled
 * explicitly, so a miss ends as a genuine 404.
 *
 * ★ THIS TEST IS THE PART THAT CANNOT GO STALE. The rule is only worth writing
 * if adding `public/something-new/` fails until the server config names it —
 * otherwise the next asset directory inherits the trap and nobody finds out
 * until a URL is poisoned again.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const caddyfile = readFileSync(new URL('citadel.Caddyfile', root), 'utf8');

/** Directory names directly under `public/`, which become URL prefixes. */
const publicDirs = () =>
  readdirSync(new URL('public', root), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

test('★ every public asset directory is handled explicitly, not by the SPA fallback', () => {
  for (const dir of publicDirs()) {
    assert.match(
      caddyfile, new RegExp(`handle /${dir}/\\*`),
      `public/${dir}/ has no explicit Caddy handler, so a missing file there answers `
      + `200 with index.html and can be cached as a success. Add:\n\n\thandle /${dir}/* {\n\t\tfile_server\n\t}\n`,
    );
  }
});

test('★ the build output directory is handled explicitly too', () => {
  // `assets/` is emitted by vite rather than copied from `public/`, so the
  // check above cannot see it — and content-hashed bundles are exactly what a
  // stale 200 would break worst.
  assert.match(caddyfile, /handle \/assets\/\*/);
});

test('★ and the fallback still exists, because client routes must survive a reload', () => {
  // The correction must not become "no fallback at all": a participant who
  // reloads on a client-side route would then get a 404 instead of the app.
  assert.match(caddyfile, /try_files \{path\} \/index\.html/);
});

test('the asset handlers come BEFORE the fallback, or they never run', () => {
  // `handle` blocks are evaluated in order; a static handler placed after the
  // catch-all is dead configuration that reads as if it works.
  const fallback = caddyfile.indexOf('try_files {path} /index.html');
  for (const dir of [...publicDirs(), 'assets']) {
    const handler = caddyfile.indexOf(`handle /${dir}/*`);
    assert.ok(handler > -1 && handler < fallback, `handle /${dir}/* must precede the SPA fallback`);
  }
});

test('the API proxy still precedes the fallback — a mis-ordered rule makes a dead route look alive', () => {
  const api = caddyfile.indexOf('handle /api/*');
  const fallback = caddyfile.indexOf('try_files {path} /index.html');
  assert.ok(api > -1 && api < fallback);
});

test('every asset directory shipped in public/ actually reaches the release', () => {
  // RELEASE_PATHS ships `dist`, and vite copies `public/**` into it. If that
  // ever changes, the handlers above would point at nothing.
  const manifest = readFileSync(new URL('scripts/release-manifest.sh', root), 'utf8');
  assert.match(manifest, /RELEASE_PATHS="dist/);
  assert.ok(existsSync(new URL('public', root)));
});
