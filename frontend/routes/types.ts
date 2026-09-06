// FILE: frontend/routes/types.ts
// Shared route type used by all module route configs and the sidebar menu.

import type { ReactNode } from 'react';

/**
 * Known modules / suites in the Konnaxion front-end.
 * Used for metadata on routes (e.g. scope labelling in Kontrol).
 */
export type ModuleKey =
  | 'ekoh'
  | 'ethikos'
  | 'keenkonnect'
  | 'konnected'
  | 'kreative'
  | 'teambuilder'
  | 'kontrol';

/**
 * Scope of a route within the overall platform.
 * - 'platform' → affects the whole system (e.g. Kontrol admin views)
 * - 'module'   → scoped to a single module / suite
 */
export type RouteScope = 'platform' | 'module';

/**
 * Base navigation route definition used by:
 * - module route files (routesEkoh, routesEthikos, routesKontrol, etc.)
 * - the Menu component to render sidebars.
 */
export interface Route {
  /** Concrete path for a leaf route (e.g. "/ekoh/dashboard"). */
  path?: string;

  /** Display name shown in the sidebar. */
  name: string;

  /** Optional icon for leaf items (Ant Design icon or custom React node). */
  icon?: ReactNode;

  /**
   * Child routes, used to define groups / sections.
   * Group routes typically omit `path` and only provide `name` + `views`.
   */
  views?: Route[];

  // ---------------------------------------------------------------------------
  // Optional metadata (used primarily by Kontrol & admin features)
  // ---------------------------------------------------------------------------

  /**
   * Scope of this route:
   * - 'platform' → platform-wide governance / analytics (Kontrol, reports, etc.)
   * - 'module'   → specific to a single module (Ethikos, Konnected, Teambuilder…)
   */
  scope?: RouteScope;

  /**
   * When `scope === 'module'`, indicates which module this route is about.
   * Also useful for cross-module entry points (e.g. Ekoh → Konsensus).
   */
  moduleKey?: ModuleKey;

  /**
   * Marks routes that are admin / governance only.
   * Menu can use this to hide admin items for non-admin users.
   */
  isAdmin?: boolean;

  /**
   * Marks routes that conceptually jump into another module.
   * Example: a Konnected menu item that opens Teambuilder or Konsensus.
   */
  isCrossModule?: boolean;

  /**
   * Optional explicit ordering hint if you ever need to override default order.
   * Lower numbers should appear earlier.
   */
  order?: number;
}
