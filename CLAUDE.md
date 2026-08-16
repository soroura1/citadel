# `citadel` — status

**Last updated:** 2026-08-17 · ⚠️ **Merged (`5fead70`) but NOT DEPLOYED**
**Topology:** [`../CLAUDE.md`](../CLAUDE.md) — `citadel.endura-assess.com` → `172.17.0.1:8087`,
`TARGET=/opt/citadel/citadel`.

## To finish the first deploy

`.env` is **VPS-owned and CI never writes it**, so the first deploy of any service fails until it
exists:

```bash
sudo mkdir -p /opt/citadel/citadel
sudo tee /opt/citadel/citadel/.env >/dev/null <<'EOF'
APP_BASE_URL=https://citadel.endura-assess.com
HOST_BIND_IP=172.17.0.1
HOST_APP_PORT=8087
API_UPSTREAM=172.17.0.1:8086
EOF
```

Then **raise a deployment** in Woodpecker. Merging does not deploy.

## ★ The same-origin proxy is load-bearing

The gateway calls `/api/content/*` with `credentials: 'include'`, and citadel's Caddy proxies that
to `API_UPSTREAM`. **That is the only reason the session cookie travels.**

Point it at a cross-origin absolute `VITE_API` and the walk breaks **silently** — no CORS error,
just a 401 at the final step. The mirror-image failure already happened: `checklist-api` could not
*read* cookies for the whole of R0 because `@fastify/cookie` was never registered, **and every
automated check still passed**, because nothing ever presented a credential.

## The R0 placeholder session — delete at R2

`src/main.jsx` sets `citadel_session` itself, because R0 has no identity and `requireSession`
validates presence only. **Two lines, marked for deletion.**

⚠️ That is R2 task **`E6`, which needs Phase C** — deleting it before the native issuer exists breaks
the deployed walk.

## Reachability — three assertions, and a fourth that is OWED

Routing · navigation inventory · **deployed bytes**. The prior attempt shipped **six screens nobody
could reach**, one for four consecutive releases.

### ⚠️ All three passed while the production page was BLANK

17 Aug: `<Navigation>` used TanStack Router's `<Link>`. **R0 mounts no `RouterProvider`** — it
navigates with `window.history`, because a real router lands at R3. The Link read a null router
context and threw `Cannot read properties of null (reading 'stores')` during render.

The build succeeded. 17 tests passed. All three reachability assertions passed. `/version`,
`/health` and the API all returned 200. **`H5` — a human opening the page — found it in one click.**

**Every assertion is about whether a surface CAN be reached. None EXECUTES it.**

| | |
|---|---|
| ✅ In place now | A static guard: no `@tanstack/react-router` import while nothing mounts a `RouterProvider`. It retires itself when R3 adds one |
| ⛔ **Owed** | **A render assertion.** `node --test` cannot import `.jsx` (`ERR_UNKNOWN_FILE_EXTENSION`) — there is no JSX transform in the test path, which is *why* no test has ever rendered a component. Needs a loader or an SSR build step before the tests |

Until that exists, **`H5` is the only thing that executes the page** — which is not a shortfall in
`H5`, it is the reason the plan specifies a human.

`SURFACES` in `src/surfaces.js` is the source of truth; the manifest is computed, never written.

```bash
export PATH="/opt/homebrew/opt/node@26/bin:$PATH"
npm test && npm run build && ./check-repo.sh
```
