// Shared limits used by both the client composer and the server actions.
// Plain constants only (no browser or server-only imports) so both sides can
// import this safely.

/** Reject truly huge originals before we even try to process them client-side. */
export const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024 // 25 MB

/** Backstop cap on the bytes we actually upload (after client compression). */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024 // 8 MB

/** Longest edge (px) we downscale photos to before upload. */
export const MAX_IMAGE_DIMENSION = 1600

/** JPEG quality for compressed uploads. */
export const IMAGE_JPEG_QUALITY = 0.8

export const CAPTION_MAX = 280
export const STATUS_MAX = 100

export function humanBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`
}
