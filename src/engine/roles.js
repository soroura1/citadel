/**
 * ★ WHICH ROLES ARE ACTUALLY PLAYABLE. (EVS-3)
 *
 * ============================================================================
 * SIXTEEN SELECTABLE ROLES WAS A PROMISE THE SLICE COULD NOT KEEP
 * ============================================================================
 * Chapter 1's content carries a `role_variant` for all sixteen Bimaristan
 * Resilience Council roles, because canon's role table has sixteen rows. That
 * is not sixteen roles brought to slice depth — each is three sentences, and
 * the same three in every scene. A selector offering all of them tells a
 * participant their choice will change the chapter, and it changes one panel.
 *
 * `src/content/roles.json` names the two the EVS carries. The other fourteen
 * are COMPUTED here, never listed: a hand-written exclusion list goes stale the
 * moment a role is added to the content, and it goes stale silently.
 *
 * ============================================================================
 * ⚠️ AND A MISSING ROLE WAS UNRESTRICTED AUTHORITY
 * ============================================================================
 * `presentOptions` read `authorised = !requires_authority || !role || ...`, so a
 * run with no role passed every authority gate. The check was there, it was
 * correct, and `!role` short-circuited it — the same shape as an isolation test
 * on the owner connection. It was invisible because every test started a run
 * without a role, which is precisely the case that skipped the gate.
 */

import CATALOGUE from '../content/roles.json' with { type: 'json' };

export class RoleRefusal extends Error {
  constructor(refusal, detail) {
    super(detail ? `${refusal}: ${detail}` : refusal);
    this.refusal = refusal;
    this.detail = detail;
  }
}

export const ROLE_CATALOGUE_VERSION = CATALOGUE.version;

/** The two the slice carries, with the reason each was chosen. */
export const SELECTABLE_ROLES = Object.freeze(
  CATALOGUE.evs_selectable.map((r) => Object.freeze({ ...r })),
);

export const isSelectable = (roleId) => SELECTABLE_ROLES.some((r) => r.id === roleId);

/** Every role id the CONTENT knows, gathered from the scenes themselves. */
export function rolesInContent(scenes) {
  const ids = new Set();
  for (const scene of scenes) for (const v of scene.role_variants ?? []) ids.add(v.role_id);
  return [...ids];
}

/**
 * Declared but not brought to slice depth. DERIVED, so it cannot go stale.
 *
 * This is what the setup surface says out loud instead of pretending the
 * fourteen do not exist: they are in the world and they are not playable yet.
 */
export function notYetPlayable(scenes) {
  return rolesInContent(scenes).filter((id) => !isSelectable(id));
}

/**
 * ★ A DECLARED ROLE MUST EXIST IN EVERY SCENE.
 *
 * Otherwise the catalogue can name a role that plays three scenes and vanishes
 * in the fourth — and the participant discovers it at the vanishing, not at the
 * selector.
 */
export function catalogueRefusals(scenes) {
  const out = [];
  for (const role of SELECTABLE_ROLES) {
    for (const scene of scenes) {
      const has = (scene.role_variants ?? []).some((v) => v.role_id === role.id);
      if (!has) out.push({ refusal: 'selectable-role-missing-from-scene', detail: `${role.id} in ${scene.id}` });
    }
  }
  return out;
}

export function assertCatalogueIsPlayable(scenes) {
  const failures = catalogueRefusals(scenes);
  if (failures.length) {
    throw new RoleRefusal('selectable-role-missing-from-scene',
      failures.map((f) => f.detail).join('; '));
  }
  return true;
}

/**
 * The role's own position in a scene.
 *
 * ⚠️ `starting_position` AND `information_held` HOLD THE SAME STRING in all 64
 * variants. Canon's role table has ONE evidence column; the content wrote it
 * into two fields. Rendering both would show a participant the same sentence
 * twice under two headings, which reads as a bug in the writing rather than in
 * the schema. One is returned, and `roles.json` records that the duplication is
 * a content decision nobody has taken.
 */
export function variantFor(scene, roleId) {
  const v = (scene.role_variants ?? []).find((x) => x.role_id === roleId);
  if (!v) return null;
  return Object.freeze({
    roleId,
    evidence: v.starting_position,
    contribution: v.options_available ?? [],
    // Deliberately not surfaced as a second fact. Kept so a caller can see it
    // agrees, and a test can assert the duplication is still what it was.
    informationHeldIsDuplicate: v.starting_position === v.information_held,
  });
}

/**
 * ★ THE ROLE A RUN MAY START WITH. Refused by name, three ways.
 *
 * A missing role is refused rather than defaulted, because the default this
 * codebase had was "authorised for everything".
 */
export function assertRoleIsPlayable(roleId) {
  if (roleId == null || roleId === '') throw new RoleRefusal('run-has-no-role');
  if (!isSelectable(roleId)) throw new RoleRefusal('role-not-selectable-in-this-slice', roleId);
  return true;
}

/**
 * ★ SG-1 C6 — THE AUTHORITY NEITHER PLAYABLE ROLE HOLDS.
 *
 * Canon assigns electrical isolation and restoration to Operations, care
 * decisions to Medical and Clinical Services, and staffed-capacity limits to
 * Nursing, Midwifery and Patient Flow. Neither the Resilience Lead nor Quality
 * and Patient Safety is any of those, which is why the slice's commitment beat
 * is SUPPORT under a named constraint rather than a decision.
 *
 * ⚠️ THAT IS CANON, NOT AN OVERSIGHT, AND IT IS ONE CONTENT EDIT FROM BEING
 * LOST. Adding Operations to the selectable set would hand a participant
 * electrical command and every automated check would still pass, because
 * "playable" and "holds clinical authority" have never been compared. This
 * compares them.
 */
export const CLINICAL_OR_ELECTRICAL_AUTHORITY = Object.freeze([
  'role.medical-clinical-services',
  'role.nursing-patient-flow',
  'role.operations',
]);

export function authorityRefusals(scenes = []) {
  const out = [];

  for (const r of SELECTABLE_ROLES) {
    if (CLINICAL_OR_ELECTRICAL_AUTHORITY.includes(r.id)) {
      out.push({
        refusal: 'selectable-role-holds-clinical-or-electrical-authority',
        detail: `${r.id} — the slice's commitment beat is support under a named constraint precisely because no playable role holds this`,
      });
    }
  }

  // ★ A ROLE THAT OFFERS NOTHING THE OTHER DOES NOT IS A COSTUME.
  //
  // This is a FLOOR, not the target. The before-state audit measured the two
  // roles at one differing action out of seventeen across the whole chapter;
  // the design's role table (strategy-gold-slice-design.md section 7.3) is what
  // E11 has to reach. What this refuses is the regression to zero, which no
  // existing check could see.
  const ids = SELECTABLE_ROLES.map((r) => r.id);
  if (ids.length > 1) {
    const byRole = new Map(ids.map((id) => [id, new Set()]));
    for (const scene of scenes) {
      for (const a of scene.actions ?? []) {
        for (const id of ids) {
          if (a.visible_to_roles == null || a.visible_to_roles.includes(id)) byRole.get(id).add(a.id);
        }
      }
    }
    for (const id of ids) {
      const others = ids.filter((o) => o !== id).flatMap((o) => [...byRole.get(o)]);
      const unique = [...byRole.get(id)].filter((a) => !others.includes(a));
      if (!unique.length) {
        out.push({
          refusal: 'role-offers-nothing-another-role-does-not',
          detail: `${id} — every act available to this role is available to another; the choice changes nothing a participant can take`,
        });
      }
    }
  }
  return out;
}
