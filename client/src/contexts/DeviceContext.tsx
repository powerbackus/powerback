/**
 * Device context. Breakpoints, orientation, isMobile/isDesktop.
 * @module DeviceContext
 */
import {
  useMemo,
  useState,
  ReactNode,
  useEffect,
  useContext,
  createContext,
  useDeferredValue,
} from 'react';
import { APP } from '@CONSTANTS';
import { useMediaQuery } from 'react-responsive';

/**
 * Categorizes screen width into device type breakpoints
 * Maps pixel widths to semantic device categories
 *
 * @param width - Current viewport width in pixels
 * @returns Device type string matching breakpoint categories
 */
function getDeviceType(width: number) {
  if (width >= APP.BREAKPOINTS.xxl) return 'xxl'; // Big Screen (2000px+)
  if (width >= APP.BREAKPOINTS.xl) return 'xl'; // Desktop (1200px+)
  if (width >= APP.BREAKPOINTS.lg) return 'lg'; // Tablet landscape (900px+)
  if (width >= APP.BREAKPOINTS.md) return 'md'; // Tablet portrait (600px+)
  if (width > APP.BREAKPOINTS.xs) return 'sm'; // Mobile portrait (380px-599px)
  return 'xs'; // Mobile portrait small (≤379px)
}

/**
 * Device Context Interface
 * Provides comprehensive device and viewport information for responsive design
 *
 * Features:
 * - Granular device type detection (xs, sm, md, lg, xl, xxl)
 * - Orientation-aware breakpoints
 * - Legacy mobile detection for backward compatibility
 * - Real-time viewport dimensions
 * - Performance-optimized with deferred updates
 */
const DeviceContext = createContext({
  // Modern responsive breakpoints
  /** Mobile in landscape with constrained height */
  isMobileHorizontal: false,
  /** Very small mobile screens (≤379px) in portrait */
  isMobilePortraitSmall: false,
  /** Mobile devices in portrait mode (≤599px) */
  isMobilePortrait: false,
  /** Tablet devices in portrait mode (≥600px) */
  isTabletPortrait: false,
  /** Tablet devices in landscape mode (≥900px) */
  isTabletLandscape: false,
  /** Desktop devices (≥1200px) */
  isDesktop: false,
  /** Large desktop/TV screens (≥2000px) */
  isBigScreen: false,

  // Legacy properties for backward compatibility
  /** General mobile detection (portrait mobile only) */
  isMobile: true,
  /** Mobile devices with short screens (≤640px height) */
  isShortMobile: false,
  /** Current orientation: 'portrait' | 'landscape' */
  orientation: 'portrait',
  /** Semantic device category: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' */
  deviceType: 'xs',
  /** Current viewport height in pixels */
  height: 0,
  /** Current viewport width in pixels */
  width: 0,
});

/**
 * Device Provider Component
 * Tracks viewport dimensions and provides responsive breakpoint information
 *
 * Uses React's useDeferredValue for performance optimization to prevent
 * excessive re-renders during window resize events
 *
 * @param children - Child components that need device context
 */
export const DeviceProvider = ({ children }: { children: ReactNode }) => {
  // Track current viewport dimensions
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Listen for window resize events
  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Throttle re-renders to once per frame (or deferred timing)
  // This prevents excessive updates during rapid resize events
  const deferredSize = useDeferredValue(size);
  const { width, height } = deferredSize;

  const { xs, sm, md, lg, xl, xxl } = APP.BREAKPOINTS;
  const { shortLandscape } = APP.HEIGHT;

  // Determine orientation and device category
  const orientation = width > height ? 'landscape' : 'portrait';
  const deviceType = getDeviceType(width);

  // Media queries matching custom CSS breakpoints exactly
  // These provide granular control over responsive behavior
  const isDesktop = useMediaQuery({
      query: `(min-width: ${xl}px)`,
    }),
    isMobilePortraitSmall = useMediaQuery({
      query: `(max-width: ${xs}px) and (orientation: portrait)`,
    }),
    isMobileHorizontal = useMediaQuery({
      query: `(max-height: ${shortLandscape}px) and (orientation: landscape)`,
    }),
    isMobilePortrait = useMediaQuery({
      query: `(max-width: ${sm}px) and (orientation: portrait)`,
    }),
    isTabletLandscape = useMediaQuery({
      query: `(min-width: ${lg}px) and (orientation: landscape)`,
    }),
    isTabletPortrait = useMediaQuery({
      query: `(min-width: ${md}px) and (orientation: portrait)`,
    }),
    isBigScreen = useMediaQuery({
      query: `(min-width: ${xxl}px) and (orientation: landscape)`,
    });

  // Legacy properties for backward compatibility
  // These maintain API compatibility with older components
  const isMobile = isMobilePortrait || isMobilePortraitSmall;
  const isShortMobile = useMediaQuery({
    query: `(max-height: ${md}px) and (orientation: portrait)`,
  });

  // Memoize the context value to prevent unnecessary re-renders
  return (
    <DeviceContext.Provider
      value={useMemo(
        () => ({
          // Modern breakpoint system
          isMobilePortraitSmall,
          isMobileHorizontal,
          isTabletLandscape,
          isMobilePortrait,
          isTabletPortrait,
          isBigScreen,
          isDesktop,
          // Legacy properties for backward compatibility
          isShortMobile,
          orientation,
          deviceType,
          isMobile,
          height,
          width,
        }),
        [
          isMobilePortraitSmall,
          isMobileHorizontal,
          isTabletLandscape,
          isMobilePortrait,
          isTabletPortrait,
          isShortMobile,
          isBigScreen,
          orientation,
          deviceType,
          isDesktop,
          isMobile,
          height,
          width,
        ]
      )}
    >
      {children}
    </DeviceContext.Provider>
  );
};

/**
 * Hook to access device context
 * Must be used within DeviceProvider component tree
 *
 * Provides real-time viewport information and responsive breakpoint flags
 * for building adaptive UIs that respond to different screen sizes and orientations
 *
 * @returns Complete device context with dimensions and breakpoint flags
 */
export const useDevice = () => useContext(DeviceContext);
