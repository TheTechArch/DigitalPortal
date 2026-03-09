import { useState } from 'react';

export default function RawResponseToggle({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);

  if (!data) return null;

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity text-gray-500"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${open ? 'rotate-90' : ''}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        {open ? 'Skjul' : 'Vis'} rå API-respons
      </button>

      {open && (
        <pre className="mt-3 bg-gray-900 text-green-300 rounded-xl p-4 text-xs font-mono overflow-auto max-h-[600px] border border-gray-700">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
