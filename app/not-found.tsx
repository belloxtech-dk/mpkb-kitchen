import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-5xl">🔍</div>
      <h1 className="text-2xl font-bold tracking-tight">Halaman tidak ditemukan</h1>
      <p className="text-sm text-muted max-w-xs">
        Halaman yang Anda cari tidak ada atau sudah dipindahkan.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90"
      >
        Kembali ke Dashboard
      </Link>
    </main>
  );
}
