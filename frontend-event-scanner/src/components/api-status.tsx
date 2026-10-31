'use client';

interface ApiStatusProps {
  onRetry: () => void;
  busy?: boolean;
}

export default function ApiStatus({ onRetry, busy = false }: ApiStatusProps) {
  return (
    <div className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="alert">
      <p className="font-medium">The Gate API is waking up.</p>
      <p className="mt-1 text-amber-900">
        Render may take up to a minute after idle. Your details are still here; retry when the API is ready.
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={busy}
        className="mt-3 border border-amber-900 px-3 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-60"
      >
        {busy ? 'Retrying…' : 'Retry connection'}
      </button>
    </div>
  );
}
