import { LedgerView } from "@/components/ledger/ledger-view";
import { getServerMessages } from "@/lib/i18n/server";

export default async function LedgerPage() {
  const m = await getServerMessages();
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5">
        <h1 className="text-lg font-semibold tracking-tight">{m.ledgerPage.title}</h1>
        <p className="mt-1 text-sm text-muted">{m.ledgerPage.subtitle}</p>
      </div>
      <LedgerView />
    </main>
  );
}
