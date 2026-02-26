/**
 * Returns scroll behavior respecting prefers-reduced-motion for accessibility.
 * @module scrollBehavior
 */

/**
 * 'auto' when the user prefers reduced motion, otherwise 'smooth'.
 * Use for scrollTo/scrollIntoView behavior so motion-sensitive users get instant scroll.
 */
export function getScrollBehavior(): ScrollBehavior {
  if (typeof window === 'undefined') return 'auto';
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth';
}
