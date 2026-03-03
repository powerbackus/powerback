/**
 * Client router. Hash-based routes for unsubscribe, activate, reset, join, main.
 * @module router
 */
import { createRouter, defineRoute, param } from 'type-route';

const hashParamRoute = (path: string) =>
  defineRoute(
    {
      hash: param.path.string,
    },
    (p) => `/${path}/${p.hash}`
  );

export const { RouteProvider, useRoute, routes } = createRouter({
  unsubscribe: hashParamRoute('unsubscribe'),
  activate: hashParamRoute('activate'),
  reset: hashParamRoute('reset'),
  join: hashParamRoute('join'), // Legacy route from emails, redirects to activate
  main: defineRoute('/'),
});
