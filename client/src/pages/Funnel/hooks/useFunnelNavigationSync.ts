/**
 * Syncs TabContainer active tab with navigation context on browser back/forward.
 * Ensures the active tab reflects the current URL/history state.
 *
 * @module pages/Funnel/hooks/useFunnelNavigationSync
 */

import { useEffect, useMemo } from 'react';
import type { FunnelView } from '@Contexts';

/**
 * When nav context funnel step differs from current tab key, navigates to the
 * stored step so the tab matches the URL (e.g. after popstate).
 *
 * @param tabKey - Current funnel tab (from useNavigation().funnel); may be undefined before first nav
 * @param navContext - Current nav context ('splash' | 'funnel')
 * @param navigateToFunnel - Navigation action
 * @param funnelSteps - Ordered list of funnel steps (e.g. ['pol-donation', 'payment', 'tips', 'confirmation'])
 */
export default function useFunnelNavigationSync(
  tabKey: FunnelView | undefined,
  navContext: 'splash' | 'funnel',
  navigateToFunnel: (step: FunnelView, stepIndex?: number) => void,
  funnelSteps: FunnelView[]
): void {
  const stableNavFunnel = useMemo(() => tabKey, [tabKey]);
  const stableNavContext = useMemo(() => navContext, [navContext]);

  useEffect(() => {
    if (
      stableNavFunnel != null &&
      stableNavFunnel !== tabKey &&
      stableNavContext === 'funnel'
    ) {
      navigateToFunnel(stableNavFunnel, funnelSteps.indexOf(stableNavFunnel));
    }
  }, [
    tabKey,
    stableNavFunnel,
    stableNavContext,
    navigateToFunnel,
    funnelSteps,
  ]);
}
