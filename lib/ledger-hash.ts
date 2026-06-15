import { createHash } from "node:crypto";

/** Pure hashing helpers for the tamper-evident ledger. No DB or env deps. */

export const GENESIS_HASH = "0".repeat(64);

function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/** Deterministic JSON (sorted keys) so the same payload always hashes the same. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  const entries = keys.map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`);
  return `{${entries.join(",")}}`;
}

export function hashPayload(payload: unknown): string {
  return sha256(stableStringify(payload));
}

/** Link a record into the chain: hash(prevHash + payloadHash). */
export function chainHash(prevHash: string, payloadHash: string): string {
  return sha256(`${prevHash}:${payloadHash}`);
}
