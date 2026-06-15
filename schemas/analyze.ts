import { z } from "zod";

/** SSOT for the /api/analyze request body. */

export const ImageMediaTypeSchema = z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export type ImageMediaType = z.infer<typeof ImageMediaTypeSchema>;

export const AnalyzeRequestSchema = z.object({
  zone: z.string().min(1).default("Zone A"),
  /** Where the frame came from — drives the `source` recorded on the event. */
  source: z.enum(["frame", "upload"]).default("upload"),
  /** Base64-encoded image data (no data: prefix). */
  imageBase64: z.string().min(1),
  mediaType: ImageMediaTypeSchema,
});
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
