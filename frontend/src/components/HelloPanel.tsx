import { useEffect, useState } from 'react';

type HelloPayload = { message: string };

type Status = 'loading' | 'ok' | 'error';

export function HelloPanel() {
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/hello')
      .then(async (res) => {
        if (!res.ok) throw new Error(`status ${res.status}`);
        const body = (await res.json()) as HelloPayload;
        if (!cancelled) {
          setMessage(body.message);
          setStatus('ok');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      aria-live="polite"
      aria-busy={status === 'loading'}
      className="space-y-3"
    >
      <h1 className="text-3xl font-semibold text-espresso">
        {status === 'ok' ? message : 'ListForge'}
      </h1>
      {status === 'loading' && <p className="text-espresso/70">Loading…</p>}
      {status === 'error' && (
        <p
          role="alert"
          className="text-terracotta flex items-center justify-center gap-2"
        >
          <span aria-hidden="true">⚠</span>
          <span>Couldn't reach the server.</span>
        </p>
      )}
      {status === 'ok' && (
        <p className="text-espresso/70">
          ListForge backend is wired and serving the API.
        </p>
      )}
    </div>
  );
}
