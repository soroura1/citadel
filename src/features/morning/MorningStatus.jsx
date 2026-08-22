/**
 * R0-C04 — THE STATUS STRIP, FROM THE PROJECTION.
 *
 * ★ TONE NEVER CARRIES MEANING ALONE. Each reading is a sentence; the dot is
 * additive. `visual-and-interaction-bible.md` § 11: "No state is expressed only
 * by colour, label, sound or motion."
 *
 * ★ AND ICU IS ALWAYS TWO NUMBERS. The projection produces
 * "5 staffed · 8 physical" as one string precisely so no surface can decide to
 * show the friendlier half.
 */
export function MorningStatus({ strip }) {
  return (
    <div className="status-strip" role="group" aria-label="Current operational status">
      {strip.map((item) => (
        <div key={item.id} className={item.warn ? 'status-item warn' : 'status-item'}>
          <span>{item.label}</span>
          <b><i aria-hidden="true" />{item.value}</b>
        </div>
      ))}
    </div>
  );
}
