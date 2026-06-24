import { cn } from "@/lib/cn";

interface TrendPoint {
  zone: string;
  score: number;
  status: string;
  time: Date | string;
}

export function ComplianceTrend({ points }: { points: TrendPoint[] }) {
  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-xs text-muted">
        Belum ada data inspeksi
      </div>
    );
  }

  const max = 100;
  const barW = Math.max(16, Math.min(32, Math.floor(300 / points.length)));

  return (
    <div className="flex items-end gap-1 h-20 px-1" aria-label="Tren skor kepatuhan">
      {points.map((p, i) => {
        const h = Math.max(4, (p.score / max) * 80);
        const color = p.score >= 80 ? "bg-pass" : p.score >= 60 ? "bg-warn" : "bg-fail";
        return (
          <div key={i} className="flex flex-col items-center gap-0.5 flex-1" title={`${p.zone}: ${Math.round(p.score)}`}>
            <span className="text-[9px] text-muted font-mono tabular-nums">{Math.round(p.score)}</span>
            <div
              className={cn("rounded-t w-full min-w-[6px]", color)}
              style={{ height: `${h}px` }}
            />
          </div>
        );
      })}
    </div>
  );
}
