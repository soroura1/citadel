/**
 * The catalogue gateway.
 *
 * Every server-backed surface reads through a gateway that can STATE ITS OWN PROVENANCE — where the
 * data came from and how old it is. This makes a cached or synthetic source VISIBLE to the user
 * rather than indistinguishable from live truth.
 *
 * ============================================================================
 * CACHE POLICIES ARE DELIBERATELY DIFFERENT ACROSS GATEWAYS. DO NOT UNIFY THEM.
 * ============================================================================
 *
 *   checklist-app, browsing a checklist  → serves stale, states its age
 *   citadel, a capability recommendation → REFUSES stale
 *
 * A stale checklist is still useful in the field. A stale recommendation is
 * misleading. The inconsistency IS the design, and the reasoning lives here so
 * a later engineer does not tidy it away.
 */

export class HttpCatalogueGateway {
  /** Every gateway can say what it is. A surface renders this, so a user is never misled. */
  describesItselfAs = 'the live catalogue';

  #baseUrl;
  #fetch;

  /**
   * ⚠️ `fetchImpl = fetch` CAPTURES THE UNBOUND NATIVE FUNCTION.
   *
   * Calling it as `this.#fetch(...)` invokes it with `this` = this gateway, and
   * the browser refuses:
   *
   *     Failed to execute 'fetch' on 'Window': Illegal invocation
   *
   * The whole item screen died on it in production. Every test passed, because
   * every test INJECTS a fake fetchImpl -- so the default, which is the only
   * thing production uses, was never once executed.
   *
   * Binding to globalThis is the fix. The arrow form also keeps a caller's own
   * injected implementation working unchanged.
   */
  constructor({ baseUrl, fetchImpl = (...args) => globalThis.fetch(...args) }) {
    this.#baseUrl = baseUrl;
    this.#fetch = fetchImpl;
  }

  /**
   * @returns {Promise<{ item: object, provenance: { source: string, catalogueVersion: string|null, retrievedAt: string } }>}
   */
  async getItem(version, id) {
    const res = await this.#fetch(`${this.#baseUrl}/catalogue/${version}/items/${id}`, {
      credentials: 'include',
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const err = new Error(body.message ?? `catalogue read failed (${res.status})`);
      // Named refusals travel from the server. The interface can explain WHICH rule fired,
      // not merely that something was refused.
      err.refusal = body.refusal ?? null;
      err.status = res.status;
      throw err;
    }

    return {
      item: await res.json(),
      provenance: {
        source: this.describesItselfAs,
        catalogueVersion: res.headers.get('X-Catalogue-Version'),
        retrievedAt: new Date().toISOString(),
      },
    };
  }
}

/**
 * A gateway backed by nothing, for development and tests.
 *
 * It names itself distinctly, and the bundle guard asserts that this string NEVER appears in the
 * production build. The prior attempt used exactly this pattern and it is worth copying: a synthetic
 * source that cannot silently reach production because its own name betrays it.
 */
export class SyntheticCatalogueGateway {
  describesItselfAs = 'a synthetic demonstration catalogue';

  #item;
  constructor(item) {
    this.#item = item;
  }

  async getItem() {
    return {
      item: this.#item,
      provenance: {
        source: this.describesItselfAs,
        catalogueVersion: this.#item.version,
        retrievedAt: new Date().toISOString(),
      },
    };
  }
}
