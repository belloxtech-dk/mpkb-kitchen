'use client';

import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg shadow transition hover:opacity-90 print:hidden"
    >
      <Printer className="size-4" />
      Cetak / Ekspor PDF
    </button>
  );
}
