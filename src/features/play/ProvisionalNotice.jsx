import { t } from '../../locales/index.js';

/**
 * ★ THE USER-VISIBLE PROVISIONAL LABEL — DEC-029, P8.
 *
 * Anyone who sees this content must know what it is. The moment a claim is
 * made about reviewed content that nobody reviewed, the product's honesty is
 * gone — and it costs a label.
 *
 * `role="note"` rather than `role="alert"`: this is a standing condition of the
 * content, not an interruption. An alert would be announced over whatever the
 * participant was reading, every time.
 */
export function ProvisionalNotice({ attestation }) {
  if (!attestation || attestation.state !== 'owner-attested-provisional') return null;

  return (
    <aside role="note" aria-label={t('provisional.label')} className="provisional">
      <p>
        <strong>{t('provisional.heading')}</strong> {t('provisional.body')}
      </p>
      <p>{t('provisional.remediation')}</p>
    </aside>
  );
}
