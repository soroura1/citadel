import { SLOTS, anyUnreviewed } from '../../projections/slots.js';

/**
 * R0-C05A — WHERE THE BUILD LABELS WENT.
 *
 * ============================================================================
 * ⛔ THEY WERE NOT DELETED. THEY WERE MOVED.
 * ============================================================================
 * The merged build showed a participant *Experience Prototype 0*, *R0-I1 ·
 * deterministic living morning · candidate visuals* and *Candidate operational
 * depiction · not reviewed · `Q10` open* — on the map, in the footer and on the
 * entry screen. Every one of those is true and every one is production
 * information: § 0.4A's required treatment puts build labels, review gates,
 * schema terms and candidate status in an owner/debug surface, and § 0.8 fails
 * participant-surface review for exactly these strings.
 *
 * ⚠️ AND DELETING THEM WOULD HAVE BEEN WORSE. `Q10` is open, no slot is
 * reviewed, and the owner must be able to see that at any moment. Removing the
 * statement to tidy the screen would make the build look further along than it
 * is — which is the failure mode this whole project distrusts most.
 *
 * ★ REACHED WITH `?build=1`, and by nothing else. A participant cannot arrive
 * here by clicking; an owner opens it deliberately. The route is recorded in
 * `repos/citadel/CLAUDE.md` rather than advertised on the page.
 */
export function BuildPanel({ increment, narrative }) {
  const slots = Object.values(SLOTS);
  return (
    <aside className="nar-build" aria-label="Build and review status (owner information)">
      <h2>Build and review status</h2>
      <p>Owner and debug information. This surface is not part of participant play.</p>
      <dl>
        <div><dt>Increment</dt><dd>{increment}</dd></div>
        <div><dt>Current beat</dt><dd>{narrative.beat}{narrative.featured ? ` · ${narrative.featured}` : ''}</dd></div>
        <div><dt>Asset slots</dt><dd>{slots.length} declared · {slots.filter((entry) => !entry.reviewed).length} unreviewed</dd></div>
        <div><dt>Review gate</dt><dd>{anyUnreviewed() ? 'Q10 open — no asset is bound or canonical' : 'all slots reviewed'}</dd></div>
      </dl>
      <ul>
        {slots.map((entry) => (
          <li key={entry.id}>
            <code>{entry.id}</code> · {entry.candidateRef} · {entry.reviewed ? 'reviewed' : 'candidate, unreviewed'}
            {entry.reviewGate ? ` · gate ${entry.reviewGate}` : ''}
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** `?build=1`, and nothing else, opens the owner surface. */
export const buildSurfaceRequested = () => {
  try {
    return new URLSearchParams(globalThis.location?.search ?? '').get('build') === '1';
  } catch {
    return false;
  }
};
