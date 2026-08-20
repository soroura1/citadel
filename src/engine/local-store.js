/**
 * ★ LOCAL, AND ONLY LOCAL. (EVS-6)
 *
 * ============================================================================
 * NOTHING HERE REACHES A NETWORK. THAT IS THE WHOLE POINT.
 * ============================================================================
 * The EVS gate's privacy condition: *"the real-hospital observation is
 * participant-controlled paper or local-only data for this gate. It is not
 * written to a production service, shown to an employer/facility surface, or
 * retained by the project."*
 *
 * So this module imports no gateway, calls no `fetch`, and holds no URL.
 * `test/privacy.test.js` proves it by running the whole slice with `fetch`,
 * `XMLHttpRequest`, `sendBeacon` and `WebSocket` replaced by throwing spies —
 * because "no payload leaves the client" is the promise the entire gate rests
 * on, and it is worth over-proving.
 *
 * ⚠️ THE STORE IS INJECTED, like the catalogue gateway's `fetchImpl`. A module
 * that reaches for `globalThis.localStorage` itself cannot be tested without a
 * browser, and the thing most worth testing here is deletion.
 */

import { serialise, deserialise } from './run.js';

export const KEYS = Object.freeze({
  run: 'citadel:run',
  observation: 'citadel:observation',
  reflection: 'citadel:reflection',
  participant: 'citadel:participant',
});

export class StoreRefusal extends Error {
  constructor(refusal, detail) {
    super(detail ? `${refusal}: ${detail}` : refusal);
    this.refusal = refusal;
    this.detail = detail;
  }
}

/** A store with the localStorage shape. In a browser, that IS localStorage. */
export const browserStore = () => (typeof localStorage === 'undefined' ? null : localStorage);

/** An in-memory store with the same shape — for tests, and for a refusing browser. */
export function memoryStore(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    // Enumerable on purpose: a deletion test that cannot list what remains is
    // asserting that the delete call did not throw.
    keys: () => [...map.keys()],
  };
}

/**
 * ★ SAVE THE RUN — pinned, and validated on the way back in by `deserialise`.
 *
 * ⚠️ NO SECOND VALIDATION LAYER HERE. `deserialise` already refuses a bundle
 * mismatch, an unknown beat, a response beat with no response, a role that is
 * no longer playable and evidence the bundle does not know. Re-checking any of
 * that here would be the same rule in two places, and the two would diverge.
 */
export function saveRun(store, run) {
  store.setItem(KEYS.run, serialise(run));
  return true;
}

export function loadRun(store, bundle) {
  const text = store.getItem(KEYS.run);
  if (!text) return null;
  // A refusal from `deserialise` travels out by name: a participant whose save
  // cannot be resumed is owed the reason, not a blank screen.
  return deserialise(text, bundle);
}

export const saveObservation = (store, record) => { store.setItem(KEYS.observation, JSON.stringify(record)); };
export const loadObservation = (store) => JSON.parse(store.getItem(KEYS.observation) ?? 'null');
export const saveReflection = (store, r) => { store.setItem(KEYS.reflection, JSON.stringify(r)); };
export const loadReflection = (store) => JSON.parse(store.getItem(KEYS.reflection) ?? 'null');

export function participantRef(store, make) {
  const existing = store.getItem(KEYS.participant);
  if (existing) return existing;
  const fresh = make();
  store.setItem(KEYS.participant, fresh);
  return fresh;
}

/**
 * ★ DELETE EVERYTHING. All of it, including the participant id.
 *
 * ⚠️ A DELETE CONTROL THAT LEAVES THE IDENTIFIER BEHIND HAS NOT DELETED
 * ANYTHING THAT MATTERS. The observation is keyed by that id; leaving it is
 * leaving the thread that ties a future record to the same person. Every key
 * this module knows is removed, and the list is derived from `KEYS` so a key
 * added later cannot be forgotten here.
 */
export function deleteEverything(store) {
  const removed = [];
  for (const key of Object.values(KEYS)) {
    if (store.getItem(key) !== null) removed.push(key);
    store.removeItem(key);
  }
  return removed;
}
