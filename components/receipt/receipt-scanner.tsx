"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, Camera, ScanLine, Loader2, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ReceiptResults } from "./receipt-results";

type ScanState = "idle" | "loading" | "done" | "error";

interface ScanResponse {
  id: string;
  extraction: {
    supplierName: string;
    receiptDate?: string;
    receiptNumber?: string;
    total: number;
    confidence: string;
    notes?: string;
  };
  check: {
    checks: Array<{
      itemName: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      totalPrice: number;
      matchedBenchmark: string | null;
      referencePrice: number | null;
      pctAboveRef: number | null;
      overpaymentIdr: number;
      status: "pass" | "warn" | "fail" | "unknown";
      flag: string | null;
    }>;
    totalIdr: number;
    overpaymentIdr: number;
    flaggedCount: number;
    riskLevel: "low" | "medium" | "high" | "critical";
    summary: string;
  };
  imageHash: string;
  error?: string;
}

export function ReceiptScanner() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<ScanState>("idle");
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Hanya file gambar (JPG/PNG/WebP) yang diterima.");
      setState("error");
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);

      // Extract base64
      const [header, base64] = dataUrl.split(",");
      const mediaType = (header?.split(":")?.[1]?.split(";")?.[0] ?? "image/jpeg") as
        | "image/jpeg"
        | "image/png"
        | "image/webp";

      setState("loading");
      setResult(null);
      setErrorMsg("");

      try {
        const res = await fetch("/api/receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mediaType }),
        });

        const data: ScanResponse = await res.json();

        if (!res.ok || data.error) {
          setErrorMsg(data.error ?? "Gagal memproses struk.");
          setState("error");
          return;
        }

        setResult(data);
        setState("done");
      } catch {
        setErrorMsg("Terjadi kesalahan jaringan.");
        setState("error");
      }
    };
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const reset = () => {
    setPreview(null);
    setState("idle");
    setResult(null);
    setErrorMsg("");
  };

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      {state === "idle" || state === "error" ? (
        <div
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={cn(
            "relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200",
            dragging
              ? "border-accent bg-accent/5 scale-[1.01]"
              : "border-border bg-surface/50 hover:border-accent/50 hover:bg-accent/5",
          )}
        >
          <div className="flex size-16 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/20">
            <ScanLine className="size-8 text-accent" />
          </div>

          <div>
            <p className="text-base font-semibold text-fg">Scan Struk Pembelian</p>
            <p className="mt-1 text-sm text-muted">
              Foto struk, seret ke sini, atau pilih file
            </p>
            <p className="mt-0.5 text-xs text-muted/70">JPG · PNG · WebP — max 10 MB</p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg shadow-lg shadow-accent/20 transition hover:opacity-90 active:scale-95"
            >
              <Upload className="size-4" />
              Pilih Gambar
            </button>
            <button
              type="button"
              onClick={() => {
                if (inputRef.current) {
                  inputRef.current.setAttribute("capture", "environment");
                  inputRef.current.click();
                }
              }}
              className="flex items-center gap-2 rounded-xl border border-border bg-panel px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-accent/50 active:scale-95"
            >
              <Camera className="size-4" />
              Kamera
            </button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
      ) : null}

      {/* Loading state */}
      {state === "loading" && (
        <div className="rounded-2xl border border-border bg-surface p-8 space-y-4">
          {preview && (
            <img
              src={preview}
              alt="Struk"
              className="mx-auto max-h-48 rounded-xl object-contain border border-border"
            />
          )}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/30">
              <Loader2 className="size-6 animate-spin text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-fg">Memproses struk…</p>
              <p className="text-xs text-muted mt-0.5">Claude sedang membaca & memverifikasi harga</p>
            </div>
            <div className="flex gap-1.5">
              {["Baca teks", "Ekstrak item", "Cek harga pasar"].map((step, i) => (
                <span key={step} className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>
                  {step}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {state === "error" && (
        <div className="flex items-start gap-3 rounded-xl border border-fail/30 bg-fail/10 px-4 py-3">
          <AlertTriangle className="size-5 shrink-0 text-fail mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-fail">Gagal memindai struk</p>
            <p className="text-xs text-muted mt-0.5">{errorMsg}</p>
          </div>
          <button type="button" onClick={reset} className="text-muted hover:text-fg transition">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Results */}
      {state === "done" && result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-pass" />
              <span className="text-sm font-semibold text-fg">Struk berhasil diverifikasi</span>
            </div>
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition hover:border-accent/50 hover:text-fg"
            >
              <ScanLine className="size-3.5" />
              Scan baru
            </button>
          </div>

          {preview && (
            <img
              src={preview}
              alt="Struk asli"
              className="max-h-40 rounded-xl object-contain border border-border/50 mx-auto"
            />
          )}

          <ReceiptResults result={result} />
        </div>
      )}
    </div>
  );
}
