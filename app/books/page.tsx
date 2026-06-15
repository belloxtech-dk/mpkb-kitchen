import { BooksDashboard } from "@/components/books/books-dashboard";

export default function BooksPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5">
        <h1 className="text-lg font-semibold tracking-tight">The Books — financial integrity</h1>
        <p className="mt-1 text-sm text-muted">
          A deterministic engine computes the exact figures; Claude explains and judges them — ghost meals, price
          markups, duplicate invoices, threshold-gaming, and supplier concentration.
        </p>
      </div>
      <BooksDashboard />
    </main>
  );
}
