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

  if (status === 'loading') {
    return <p className="text-espresso/70">Loading…</p>;
  }

  if (status === 'error') {
    return (
      <p className="text-terracotta">Couldn't reach the server.</p>
    );
  }

  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-semibold text-espresso">{message}</h1>
      <p className="text-espresso/70">
        ListForge backend is wired and serving the API.
      </p>
    </div>
  );
}
