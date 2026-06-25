"use client";

import { useEffect, useState, useCallback } from "react";
import { CctvGrid } from "./cctv-grid";
import { RefreshCw, Loader2 } from "lucide-react";

interface Stream {
  name: string;
  deviceId: string;
  status: string;
  hls: string | null;
}

const REFRESH_MS = 60 * 1000; // refresh HLS tokens every 60s

export function CctvLive({ kitchenId }: { kitchenId?: string }) {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStreams = useCallback(async () => {
    try {
      setError(null);
      const qs = kitchenId ? `?kitchen=${kitchenId}` : "";
      const res = await fetch(`/api/cctv/streams${qs}`);
      const data = await res.json();
      if (data.ok) {
        setStreams(data.streams);
        setUpdatedAt(data.updatedAt);
      } else {
        setError(data.error ?? "Gagal memuat stream");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStreams();
    const interval = setInterval(fetchStreams, REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchStreams, kitchenId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted">
        <Loader2 className="size-5 animate-spin" />
        <span className="text-sm">Menghubungkan ke kamera SPPG Gamping...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-sm text-red-400 mb-3">{error}</p>
        <button
          onClick={fetchStreams}
          className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
        >
          <RefreshCw className="size-4" /> Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CctvGrid streams={streams} updatedAt={updatedAt} />
      <div className="flex justify-end">
        <button
          onClick={fetchStreams}
          className="inline-flex items-center gap-2 rounded-lg border border-border/50 px-3 py-1.5 text-xs text-muted hover:text-fg hover:border-border transition-colors"
        >
          <RefreshCw className="size-3" /> Refresh Stream
        </button>
      </div>
    </div>
  );
}
