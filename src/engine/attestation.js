/**
 * ★ owner-attested-provisional — DEC-029, POC task P8.
 *
 * ============================================================================
 * THE ONE CONTROL THAT DOES NOT RELAX.
 * ============================================================================
 * Everything else on the POC path is deferred because a proof of concept has
 * no users, no data and no claims. This exists precisely BECAUSE someone will
 * eventually see it.
 *
 * The owner authored the canon, so he cannot review it. `canApprove` records
 * every editor and refuses self-approval — that is not bureaucracy to route
 * around, it is the control that stops a one-person project quietly becoming
 * its own reviewer.
 *
 * So POC content carries a state that is NOT `approved`, says so on screen, and
 * can never satisfy the separation test.
 */

export class AttestationRefusal extends Error {
  constructor(refusal, detail) {
    super(detail ? `${refusal}: ${detail}` : refusal);
    this.refusal = refusal;
    this.detail = detail;
  }
}

export const PROVISIONAL = 'owner-attested-provisional';

/**
 * Attest content the owner cannot review, because he wrote it.
 *
 * Every field is required. An attestation missing its remediation trigger is a
 * permanent exception wearing a temporary label.
 */
export function attest({ attestedBy, reason, remediationTrigger, expires }) {
  if (!attestedBy) throw new AttestationRefusal('attestation-names-nobody');
  if (!reason?.trim()) throw new AttestationRefusal('attestation-gives-no-reason');
  if (!remediationTrigger?.trim()) {
    throw new AttestationRefusal(
      'attestation-has-no-remediation-trigger',
      'without one this is a permanent exception wearing a temporary label',
    );
  }
  if (!expires) throw new AttestationRefusal('attestation-never-expires');

  return Object.freeze({
    state: PROVISIONAL,
    attestedBy,
    reason,
    remediationTrigger,
    expires,
    // ★ Stated in the record itself, so nothing downstream has to remember it.
    separationSatisfied: false,
    grantsApprovedAuthority: false,
  });
}

/**
 * ★ PROVISIONAL NEVER BECOMES APPROVED BY ANY PATH THROUGH THIS MODULE.
 *
 * Not "should not" — cannot. The only route to `approved` is `approveScene`,
 * which asks `canApprove`, which refuses an editor. An attestation that could
 * be upgraded here would be a second door into the room the first door guards.
 */
export function canClaimApproved(attestation) {
  if (!attestation) return { ok: true };
  if (attestation.state === PROVISIONAL) {
    return { ok: false, refusal: 'provisional-content-may-not-claim-approved' };
  }
  return { ok: true };
}

/** Is the attestation still within its stated life? */
export function isExpired(attestation, now = new Date()) {
  return new Date(attestation.expires) < now;
}
