/**
 * Client-safe types + loader for the staged CCTV frames manifest.
 * Each zone has an ordered list of frames in /public/frames; the Floor cycles
 * through them to simulate a live feed. Swap the files (and the manifest) for
 * Andrea's real kitchen photos. With no frames, a zone falls back to upload.
 */

export interface ZoneDef {
  id: string;
  label: string;
  frames: string[];
}

export interface FrameManifest {
  zones: ZoneDef[];
}

export const MANIFEST_URL = "/frames/manifest.json";

export async function loadManifest(): Promise<FrameManifest> {
  const res = await fetch(MANIFEST_URL, { cache: "no-store" });
  if (!res.ok) return { zones: [] };
  return (await res.json()) as FrameManifest;
}
