/**
 * Root loading fallback — shown by Next.js Suspense during
 * client-side route transitions. Returns null because the
 * layout-level Rimoucha loader handles the visual.
 */
export default function Loading() {
  return null;
}
