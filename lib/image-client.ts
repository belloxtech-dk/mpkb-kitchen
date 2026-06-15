"use client";

import type { ImageMediaType } from "@/schemas/analyze";

/** Client helpers to turn a File or URL into base64 the analyze API accepts. */

export interface LoadedImage {
  dataUrl: string;
  base64: string;
  mediaType: ImageMediaType;
}

const ALLOWED: readonly ImageMediaType[] = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function normalizeType(type: string): ImageMediaType {
  return (ALLOWED as readonly string[]).includes(type) ? (type as ImageMediaType) : "image/jpeg";
}

function fromDataUrl(dataUrl: string, fallbackType: string): LoadedImage {
  const comma = dataUrl.indexOf(",");
  const header = dataUrl.slice(5, comma); // e.g. "image/png;base64"
  const declared = header.split(";")[0] ?? "";
  return {
    dataUrl,
    base64: dataUrl.slice(comma + 1),
    mediaType: normalizeType(declared || fallbackType),
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function fileToImage(file: File): Promise<LoadedImage> {
  return fromDataUrl(await blobToDataUrl(file), file.type);
}

export async function urlToImage(url: string): Promise<LoadedImage> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  const blob = await res.blob();
  return fromDataUrl(await blobToDataUrl(blob), blob.type);
}
