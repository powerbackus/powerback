/**
 * Builds a public asset URL with PUBLIC_URL prefix (e.g. for logos in dev vs prod).
 * @param path - Path relative to public root (e.g. MEDIA_PATHS.CABLE_LOGO)
 * @returns Full path with process.env.PUBLIC_URL prefix
 * @module utils/publicAsset
 */
export function publicAsset(path: string): string {
  return `${process.env.PUBLIC_URL || ''}${path}`;
}
