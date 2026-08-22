/**
 * R0-C05 — PREPAREDNESS WORK, AND WHAT IT COSTS.
 *
 * ============================================================================
 * FOUR PROJECTS, CAPACITY FOR TWO
 * ============================================================================
 * XP0 offered the same four as a two-of-four picker and nothing stood behind
 * it: nothing was scheduled, nothing progressed, nothing was displaced, and
 * "complete" and "verified" did not exist as separate ideas. The capacity limit
 * was a `disabled` attribute.
 *
 * ★ THE LIMIT IS NOW A RULE, NOT A DISABLED BUTTON. A hidden or greyed control
 * is still reachable from a keyboard path, a facilitated table or a replayed
 * command log, and `technical-design.md` invariant 2 is explicit that authority
 * lives in the rules.
 *
 * ============================================================================
 * ★ DISRUPTION IS DERIVED, NOT ROLLED AND NOT SCRIPTED
 * ============================================================================
 * Each project declares the world resources it needs — a technical team, the
 * mobile reserve cart, the service passage, the clinical bedside group. These
 * are things `world.js` actually holds, not an invented currency. Two scheduled
 * projects needing the SAME resource cannot both have it, so the second to
 * reach it is disrupted.
 *
 * Nothing here rolls a die and no pair is special-cased. Two of the six pairs
 * collide — power-trace with mobile-reserve over the service passage, and
 * power-trace with message-route over a technical team — which makes the
 * two-of-four choice a real and *knowable* trade rather than a trap:
 * `requires` is projected before the participant commits, because
 * `gameplay-and-state.md` § 7 says known effects are previewed fairly.
 *
 * ⛔ AND `complete` IS NOT `verified`. Complete means the work was performed.
 * Verified means the responsible function tested the result and recorded
 * evidence with a source and a time. The visual contract (§ 13.2) is explicit
 * that a progress ring cannot carry that difference, and neither can a boolean.
 */
import PROJECT_CONTENT from '../content/projects.json' with { type: 'json' };

export const PROJECT_STATES = Object.freeze(
  ['available', 'scheduled', 'working', 'disrupted', 'complete', 'verified']);

/** Two. The whole opportunity cost of the preparedness window. */
export const PROJECT_CAPACITY = 2;

export const PROJECTS = Object.freeze(PROJECT_CONTENT.projects.map((p) => Object.freeze(p)));

/**
 * Participant-facing state words.
 *
 * ★ `complete` READS AS "performed, not tested", because that is what it means
 * and because the word "complete" beside an untested result is the exact
 * confusion the six-state ladder exists to prevent.
 */
export const STATE_LABELS = Object.freeze(PROJECT_CONTENT.stateLabels);
export const projectIndex = () => new Map(PROJECTS.map((p) => [p.id, p]));
export const projectById = (id) => PROJECTS.find((p) => p.id === id) ?? null;

/** Projects the participant has committed to: anything past `available`. */
export const committed = (world) =>
  Object.entries(world.projects ?? {})
    .filter(([, entry]) => entry.state !== 'available')
    .map(([id]) => id);

/** Still doing work — a finished project no longer holds its capabilities. */
export const active = (world) =>
  Object.entries(world.projects ?? {})
    .filter(([, entry]) => entry.state === 'scheduled' || entry.state === 'working' || entry.state === 'disrupted')
    .map(([id]) => id);

/**
 * ★ WHO ELSE WANTS WHAT THIS PROJECT NEEDS.
 *
 * Exposed as a projection so the participant can read the collision BEFORE
 * scheduling. A cost discovered only after committing is a trap, and
 * `gameplay-and-state.md` § 7 requires known effects to be previewed fairly.
 */
export function contendedResources(world, projectId) {
  const project = projectById(projectId);
  if (!project) return [];
  const others = active(world).filter((id) => id !== projectId);
  const wanted = new Set(others.flatMap((id) => projectById(id)?.requires ?? []));
  return project.requires.filter((resource) => wanted.has(resource));
}

/**
 * ★ THE RESOURCES A PROJECT CAN CONTEND FOR, derived from the world rather than
 * listed twice. A requirement naming something the world does not hold is
 * refused at load — otherwise a project could declare a need nothing can ever
 * satisfy and quietly never be disrupted by anything.
 */
export function worldResources(world) {
  const out = new Set();
  if ((world.technical?.teams ?? []).length) out.add('technical-team');
  if (world.supply?.mobileReserve) out.add('mobile-reserve-cart');
  if (world.supply?.ordinaryCart) out.add('ordinary-supply-cart');
  if (world.staff?.clinical) out.add('clinical-bedside-group');
  if (world.routes?.['workshop-underworks']) out.add('service-passage');
  return [...out];
}

/**
 * The next state one cycle of preparation work produces.
 *
 * ⚠️ A DISRUPTED PROJECT IS NOT DEAD. Canon's own fail-forward temperament:
 * work stops, the unfinished site remains, and it continues when the
 * contention clears. Returning `available` would delete the cost already paid.
 */
export function advanceState(world, projectId) {
  const entry = world.projects[projectId];
  if (!entry) return null;

  switch (entry.state) {
    case 'scheduled': {
      const contended = contendedResources(world, projectId);
      // The project that got there first keeps the resource. Order is the
      // participant's own scheduling order, recorded on the entry — not a
      // coin toss, and replayable.
      const loser = contended.length > 0 && !holdsFirst(world, projectId, contended);
      return loser
        ? { state: 'disrupted', because: `another scheduled project already holds the ${contended.join(' and the ')}` }
        : { state: 'working', because: 'the responsible function began the work' };
    }
    case 'working':
      return { state: 'complete', because: 'the work was performed' };
    case 'disrupted': {
      const contended = contendedResources(world, projectId);
      const stillBlocked = contended.length > 0 && !holdsFirst(world, projectId, contended);
      return stillBlocked
        ? null                                   // nothing changes; the site stays occupied
        : { state: 'working', because: 'the contended resource came free and the work resumed' };
    }
    default:
      return null;                                // complete and verified do not advance by time
  }
}

/** Whichever project was scheduled earliest holds a contended resource. */
function holdsFirst(world, projectId, resources) {
  const mine = world.projects[projectId]?.scheduledAt ?? Infinity;
  for (const other of active(world)) {
    if (other === projectId) continue;
    const shares = (projectById(other)?.requires ?? []).some((r) => resources.includes(r));
    if (!shares) continue;
    const theirs = world.projects[other]?.scheduledAt ?? Infinity;
    if (theirs < mine) return false;
  }
  return true;
}

/** Load-time refusals: content that could never behave correctly. */
export function projectRefusals(availableResources) {
  const out = [];
  const seen = new Set();
  for (const project of PROJECTS) {
    if (seen.has(project.id)) out.push({ refusal: 'duplicate-project-id', detail: project.id });
    seen.add(project.id);

    if (!project.requires?.length) {
      // A project needing nothing costs nothing, and a preparedness window in
      // which everything is free is not a window.
      out.push({ refusal: 'project-requires-no-resource', detail: project.id });
    }
    for (const resource of project.requires ?? []) {
      if (!availableResources.includes(resource)) {
        // ⚠️ A requirement the world cannot satisfy would never be contended,
        // so the project would silently never be disrupted by anything.
        out.push({ refusal: 'project-requires-a-resource-the-world-does-not-hold', detail: `${project.id} -> ${resource}` });
      }
    }
    if (!project.displaces?.what) {
      // ⛔ Every project displaces something. That is the mechanic.
      out.push({ refusal: 'project-displaces-nothing', detail: project.id });
    }
    if (!project.verification) {
      out.push({ refusal: 'project-cannot-be-verified', detail: project.id });
    }
    if (!project.produces?.evidenceId) {
      out.push({ refusal: 'verified-project-produces-no-evidence', detail: project.id });
    }
  }
  if (PROJECTS.length <= PROJECT_CAPACITY) {
    // Capacity is only a choice while there are more projects than places.
    out.push({ refusal: 'capacity-is-not-a-constraint', detail: `${PROJECTS.length} projects, capacity ${PROJECT_CAPACITY}` });
  }
  return out;
}
