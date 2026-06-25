"use client";

import { useEffect, useRef, useState } from "react";
import { Wifi, WifiOff, RefreshCw, Camera } from "lucide-react";
import { cn } from "@/lib/cn";

interface Stream {
  name: string;
  deviceId: string;
  status: string;
  hls: string | null;
}

interface CctvGridProps {
  streams: Stream[];
  updatedAt?: string;
}

function HlsPlayer({ url, name }: { url: string; name: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    let hls: import("hls.js").default | null = null;

    import("hls.js").then(({ default: Hls }) => {
      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: false, lowLatencyMode: true });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) setError(true);
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS
        video.src = url;
        video.play().catch(() => {});
      } else {
        setError(true);
      }
    });

    return () => { hls?.destroy(); };
  }, [url]);

  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-black/60 text-xs text-muted">
        <WifiOff className="size-6 opacity-50" />
        <span>Stream unavailable</span>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      className="h-full w-full object-cover"
      muted
      autoPlay
      playsInline
      controls={false}
    />
  );
}

function CameraCard({ stream }: { stream: Stream }) {
  const online = stream.status === "online";

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-surface-alt">
      {/* Video area */}
      <div className="relative aspect-video w-full bg-black">
        {stream.hls && online ? (
          <HlsPlayer url={stream.hls} name={stream.name} />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted">
            <Camera className="size-8 opacity-30" />
            <span className="text-xs opacity-50">
              {online ? "Memuat stream..." : "Kamera offline"}
            </span>
          </div>
        )}

        {/* Live badge */}
        {stream.hls && online && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        )}

        {/* Status badge */}
        <div className={cn(
          "absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm",
          online ? "bg-green-500/20 text-green-400 border border-green-500/30"
                 : "bg-red-500/20 text-red-400 border border-red-500/30"
        )}>
          {online ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
          {online ? "Online" : "Offline"}
        </div>
      </div>

      {/* Label */}
      <div className="px-3 py-2">
        <p className="text-sm font-medium truncate">{stream.name}</p>
        <p className="text-[11px] text-muted">{stream.deviceId}</p>
      </div>
    </div>
  );
}

export function CctvGrid({ streams, updatedAt }: CctvGridProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium">
            {streams.filter(s => s.status === "online").length}/{streams.length} Kamera Online
          </span>
        </div>
        {updatedAt && (
          <span className="flex items-center gap-1 text-xs text-muted">
            <RefreshCw className="size-3" />
            {new Date(updatedAt).toLocaleTimeString("id-ID")}
          </span>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {streams.map((s) => (
          <CameraCard key={s.deviceId} stream={s} />
        ))}
      </div>
    </div>
  );
}
