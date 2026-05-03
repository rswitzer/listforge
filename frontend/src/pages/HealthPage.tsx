import { useCallback, useEffect, useState } from 'react';
import { checkApi, checkDatabase, type HealthResult } from '@/lib/health';

type ProbeId = 'api' | 'database';
type CardState = 'checking' | HealthResult;

const PROBES: ReadonlyArray<{
  id: ProbeId;
  label: string;
  check: (signal?: AbortSignal) => Promise<HealthResult>;
}> = [
  { id: 'api', label: 'API', check: checkApi },
  { id: 'database', label: 'Database', check: checkDatabase },
];

const initialState: Record<ProbeId, CardState> = {
  api: 'checking',
  database: 'checking',
};

export function HealthPage() {
  const [cards, setCards] = useState<Record<ProbeId, CardState>>(initialState);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCards(initialState);
    PROBES.forEach(({ id, check }) => {
      check(controller.signal)
        .then((result) => {
          setCards((prev) => ({ ...prev, [id]: result }));
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          setCards((prev) => ({
            ...prev,
            [id]: { status: 'unreachable', detail: 'Probe failed' },
          }));
        });
    });
    return () => controller.abort();
  }, [refreshKey]);

  const isChecking = Object.values(cards).some((s) => s === 'checking');
  const onRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <main className="min-h-screen p-6 md:p-12 flex items-start justify-center">
      <div className="max-w-2xl w-full bg-sand rounded-2xl shadow-sm p-8 md:p-10 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-espresso">System Health</h1>
          <p className="text-espresso/70">
            Live status of the services ListForge depends on.
          </p>
        </header>

        <ul className="space-y-3" aria-busy={isChecking}>
          {PROBES.map(({ id, label }) => (
            <HealthCard key={id} id={id} label={label} state={cards[id]} />
          ))}
        </ul>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isChecking}
            aria-busy={isChecking}
            className="rounded-xl bg-espresso text-cream min-h-11 px-4 py-2.5 font-medium shadow-sm transition hover:bg-espresso/90 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            {isChecking ? 'Checking…' : 'Check again'}
          </button>
        </div>
      </div>
    </main>
  );
}

function HealthCard({
  id,
  label,
  state,
}: {
  id: ProbeId;
  label: string;
  state: CardState;
}) {
  const headingId = `health-${id}-label`;
  const variant = pickVariant(state);

  return (
    <li className="rounded-xl bg-cream px-4 py-3" aria-labelledby={headingId}>
      <h2 id={headingId} className="text-base font-medium text-espresso">
        {label}
      </h2>
      <p role="status" className={`mt-1 flex items-center gap-2 ${variant.tone}`}>
        <span aria-hidden="true" className="inline-block w-4 text-center">
          {variant.icon}
        </span>
        <span>{variant.text}</span>
      </p>
      {state !== 'checking' && state.status === 'unreachable' && (
        <details className="mt-2 text-sm text-espresso/70">
          <summary className="inline-flex items-center min-h-11 py-2 cursor-pointer rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta">
            More info
          </summary>
          <pre className="mt-1 whitespace-pre-wrap break-words">{state.detail}</pre>
        </details>
      )}
    </li>
  );
}

function pickVariant(state: CardState) {
  if (state === 'checking') {
    return { icon: '○', text: 'Checking…', tone: 'text-espresso/70' };
  }
  if (state.status === 'ok') {
    return { icon: '✓', text: 'Connected', tone: 'text-moss' };
  }
  return { icon: '✕', text: 'Unreachable', tone: 'text-terracotta' };
}
