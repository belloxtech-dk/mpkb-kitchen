import { clsx, type ClassValue } from "clsx";

/** Tiny className combiner. SSOT for conditional class composition. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
