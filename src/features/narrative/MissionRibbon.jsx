/**
 * R0-C05A — THE MISSION, COMPACT AND ABOVE THE WORLD.
 *
 * ★ THE OWNER REJECTED A PERMANENT SIDE PANEL as the dramatic carrier
 * (visual bible § 21.5). The mission is the one thing that must persist, so it
 * persists as a ribbon over the map rather than as a column beside it — the
 * hospital stays the largest thing on the screen.
 *
 * ⚠️ `progress` IS COUNTED, NOT ASSERTED. The projection derives it from
 * committed projects, verified projects and residue, so the ribbon cannot
 * claim the morning has got somewhere the world has not.
 */
export function MissionRibbon({ mission }) {
  return (
    <section className="nar-mission" aria-label="Current mission">
      <span className="nar-mission-when">{mission.until}</span>
      <strong>{mission.text}</strong>
      <small>{mission.progress}</small>
    </section>
  );
}
