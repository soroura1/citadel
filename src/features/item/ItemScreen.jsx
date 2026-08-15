import { useEffect, useState } from 'react';
import { t } from '../../locales/index.js';

/**
 * R0's entire user-visible feature — F3.
 *
 * One checklist item that travelled contracts → checklist-api → citadel → here.
 * That is the walking skeleton: every seam proven while the cost of getting one
 * wrong is one item on one screen.
 *
 * It renders the gateway's PROVENANCE, so a cached or synthetic source is
 * visible to the user rather than indistinguishable from live truth.
 */
export function ItemScreen({ gateway, version = 'latest-approved', id = 'HZ-HVCA-001-i01' }) {
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    gateway
      .getItem(version, id)
      .then((r) => !cancelled && setState({ status: 'ready', ...r }))
      .catch((err) => !cancelled && setState({ status: 'refused', err }));
    return () => { cancelled = true; };
  }, [gateway, version, id]);

  if (state.status === 'loading') return <p>{t('item.loading')}</p>;

  if (state.status === 'refused') {
    // Named refusals travel from the server, so the interface explains WHICH rule
    // fired rather than showing a generic failure.
    const key = state.err.refusal ? `refusal.${state.err.refusal.replace(/-/g, '_')}` : null;
    return <p role="alert">{key ? t(key) : state.err.message}</p>;
  }

  const { item, provenance } = state;
  return (
    <main>
      <h1>{t('item.heading')}</h1>
      <h2>{item.title.fallback ?? item.title.key}</h2>
      <p>{item.purpose.fallback ?? item.purpose.key}</p>

      <dl>
        <dt>{t('item.version')}</dt><dd>{item.version}</dd>
        <dt>{t('item.authority_class')}</dt><dd>{item.authorityClass}</dd>
        {/* The gateway states where this came from. Never presented as live truth
            when it is not. */}
        <dt>{t('item.provenance')}</dt><dd>{provenance.source}</dd>
      </dl>
    </main>
  );
}
