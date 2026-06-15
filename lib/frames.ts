/**
 * Client-safe types + loader for the staged CCTV frames manifest.
 * Drop Andrea's kitchen photos into /public/frames and list them in manifest.json;
 * the wall auto-populates. With no frames, zones accept drag-and-drop / upload.
 */

export interface ZoneDef {
  id: string;
  label: string;
}

export interface FrameDef {
  file: string;
  zone: string;
  label?: string;
}

export interface FrameManifest {
  zones: ZoneDef[];
  frames: FrameDef[];
}

export const MANIFEST_URL = "/frames/manifest.json";

export async function loadManifest(): Promise<FrameManifest> {
  const res = await fetch(MANIFEST_URL, { cache: "no-store" });
  if (!res.ok) return { zones: [], frames: [] };
  return (await res.json()) as FrameManifest;
}

export function framesForZone(manifest: FrameManifest, zoneId: string): FrameDef[] {
  return manifest.frames.filter((f) => f.zone === zoneId);
}
