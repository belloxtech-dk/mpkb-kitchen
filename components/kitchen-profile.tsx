import { MapPin, Users, LayoutGrid, Video, Phone, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";

interface KitchenProfileProps {
  cctvConnected?: boolean;
}

export function KitchenProfile({ cctvConnected = false }: KitchenProfileProps) {
  return (
    <div className="rounded-xl border bg-surface p-4 space-y-4">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-fg">
            SPPG Gamping 01
          </h2>
          <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">Kec. Gamping, Kab. Sleman, DI Yogyakarta</span>
          </div>
        </div>

        {/* Pilot badge */}
        <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-accent uppercase">
          Percontohan Aktif
        </span>
      </div>

      {/* ── SPPG Code ─────────────────────────────────────────────────── */}
      <div className="rounded-lg bg-panel px-3 py-2">
        <p className="text-[10px] font-semibold tracking-widest text-muted uppercase">Kode SPPG</p>
        <p className="mt-0.5 font-mono text-sm font-medium text-fg tracking-wider">
          SPPG-YK-GAM-01
        </p>
      </div>

      {/* ── Stats grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        {/* Capacity */}
        <div className="flex flex-col items-center rounded-lg bg-panel px-2 py-2.5 text-center">
          <Users className="size-4 text-accent mb-1" />
          <span className="text-lg font-semibold tabular-nums text-fg leading-none">540</span>
          <span className="mt-0.5 text-[10px] text-muted leading-tight">Siswa</span>
        </div>

        {/* Zones */}
        <div className="flex flex-col items-center rounded-lg bg-panel px-2 py-2.5 text-center">
          <LayoutGrid className="size-4 text-accent mb-1" />
          <span className="text-lg font-semibold tabular-nums text-fg leading-none">3</span>
          <span className="mt-0.5 text-[10px] text-muted leading-tight">Zona</span>
        </div>

        {/* CCTV */}
        <div className="flex flex-col items-center rounded-lg bg-panel px-2 py-2.5 text-center">
          <Video
            className={cn(
              "size-4 mb-1",
              cctvConnected ? "text-pass" : "text-muted",
            )}
          />
          <span
            className={cn(
              "text-lg font-semibold tabular-nums leading-none",
              cctvConnected ? "text-pass" : "text-muted",
            )}
          >
            3
          </span>
          <span className="mt-0.5 text-[10px] text-muted leading-tight">Kamera</span>
        </div>
      </div>

      {/* ── Zone list ─────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <p className="text-[10px] font-semibold tracking-widest text-muted uppercase">
          Zona Dapur
        </p>
        {['Prep', 'Memasak', 'Plating'].map((zone, i) => (
          <div
            key={zone}
            className="flex items-center justify-between rounded-md bg-panel px-3 py-1.5"
          >
            <span className="text-[12px] text-fg">{zone}</span>
            <span className="font-mono text-[10px] text-muted">Z{String(i + 1).padStart(2, '0')}</span>
          </div>
        ))}
      </div>

      {/* ── CCTV Status ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
        <Video className={cn("size-4 shrink-0", cctvConnected ? "text-pass" : "text-muted")} />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-fg">
            {cctvConnected ? "3 kamera aktif" : "Menunggu koneksi"}
          </p>
          <p className="text-[10px] text-muted">
            {cctvConnected
              ? "Feed langsung tersedia"
              : "CCTV belum terhubung ke sistem"}
          </p>
        </div>
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            cctvConnected ? "bg-pass live-dot" : "bg-muted",
          )}
        />
      </div>

      {/* ── Contact ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[12px] text-muted">
        <Phone className="size-3.5 shrink-0" />
        <span>Kepala SPPG Gamping</span>
      </div>

      {/* ── Operational status ────────────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-lg border border-pass/30 bg-pass-soft px-3 py-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-pass" />
          <span className="text-[12px] font-semibold text-pass">Status Operasional</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-pass live-dot" />
          <span className="text-[11px] font-semibold text-pass">Beroperasi</span>
        </div>
      </div>
    </div>
  );
}
