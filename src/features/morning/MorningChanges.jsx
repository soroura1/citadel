/**
 * R0-C04 — WHAT CHANGED, AND WHY.
 *
 * ★ R0-S1's acceptance is "I can identify what changed and why". Both halves
 * come from the event that made the change — `changed` and `because` were
 * recorded when it happened, not reconstructed afterwards by diffing two
 * snapshots and guessing which difference the participant cared about.
 *
 * `aria-live="polite"` announces the cycle once. § 18.7: "A change announcement
 * names origin → destination → resulting constraint once."
 */
export function MorningChanges({ changes, cycle }) {
  return (
    <section className="change-list" aria-live="polite" aria-label="What changed">
      <p className="kicker">{cycle === 0 ? 'Before the first cycle' : `After cycle ${cycle}`}</p>
      {changes.length === 0 && <p className="change-empty">Nothing has changed yet. Advance the morning to see the institution work.</p>}
      {changes.map((change) => (
        <div key={change.id} className={change.warn ? 'change warn' : 'change'}>
          <div>
            <b>{change.changed}</b>
            <span>{change.because}</span>
          </div>
        </div>
      ))}
    </section>
  );
}
