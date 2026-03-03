import { useState, useCallback } from 'react';

/**
 * Type definition for managing glowing footnote states
 *
 * This type represents the state object that tracks which footnotes
 * should have a glowing effect applied. The keys correspond to
 * footnote numbers and values indicate the CSS class to apply.
 */
type GlowingFootnote = {
  /** CSS class for footnote 1 glow effect (empty string = no glow) */
  1: string;
  /** CSS class for footnote 2 glow effect (empty string = no glow) */
  2: string;
  /** CSS class for footnote 3 glow effect (empty string = no glow) */
  3: string;
};

/**
 * Return values from the useFootnoteGlow hook
 */
interface UseFootnoteGlowReturn {
  /** Current glowing footnote state */
  glowingFootnote: GlowingFootnote;
  /** Handler for mouse over events on footnotes */
  handleMouseOver: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  /** Handler for mouse out events on footnotes */
  handleMouseOut: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Custom hook for footnote glow state management
 *
 * Manages the glowing effect state for footnotes in the limit modal.
 * Provides handlers for mouse events that control the glow effect.
 *
 * @returns Object containing glowing state and mouse event handlers
 */
export const useFootnoteGlow = (): UseFootnoteGlowReturn => {
  /**
   * State for managing glowing footnotes on hover
   */
  const [glowingFootnote, setGlowingFootnote] = useState<GlowingFootnote>({
    1: '',
    2: '',
    3: '',
  });

  /**
   * Handle mouse over event for footnotes
   * Applies glow effect to the hovered footnote
   *
   * @param e - Mouse event from footnote element
   */
  const handleMouseOver = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      const citation = (e.target as HTMLElement).textContent?.trim() ?? '';
      setGlowingFootnote((g) => ({ ...g, [citation]: 'glow' }));
    },
    []
  );

  /**
   * Handle mouse out event for footnotes
   * Removes glow effect from the footnote
   *
   * @param e - Mouse event from footnote element
   */
  const handleMouseOut = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      const citation = (e.target as HTMLElement).textContent?.trim() ?? '';
      setGlowingFootnote((g) => ({ ...g, [citation]: '' }));
    },
    []
  );

  return {
    glowingFootnote,
    handleMouseOver,
    handleMouseOut,
  };
};
