// FILE: frontend/components/layout-components/Menu.tsx
'use client';

import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import React from 'react';

import { getWorldKeyFromPathname, stripWorldPrefix, withWorldPath } from '@/lib/worlds';

import './Menu.css';

export interface Route {
  path?: string;
  name: string;
  icon?: ReactNode;
  views?: Route[];

  /**
   * Optional scope metadata, mainly used in Kontrol to distinguish
   * platform-wide vs module-specific vs org-level sections.
   *
   * Example values:
   *  - 'platform' → affects the whole Konnaxion platform
   *  - 'module'   → governance / admin for a single module
   *  - 'org'      → organisation / workspace-level
   */
  scope?: 'platform' | 'module' | 'org';

  /**
   * Optional module identifier when scope === 'module'.
   * Example: 'ethikos', 'konnected', 'keenkonnect', 'teambuilder', etc.
   * Used only for labelling / CSS, not for routing logic.
   */
  moduleKey?: string;

  /**
   * Marks routes that are part of governance / admin (typically under Kontrol).
   * Filtering of these routes by user role should happen upstream, not here.
   */
  isAdmin?: boolean;

  /**
   * Marks routes that jump into another module (e.g. Ekoh → Konsensus,
   * Konnected → Teambuilder). Can be used for analytics or special styling.
   */
  isCrossModule?: boolean;

  /**
   * Optional ordering hint if you ever want to override the natural array order.
   * If omitted, items are rendered in the order they appear in the routes array.
   */
  order?: number;
}

export interface MenuComponentProps {
  routes: Route[];
  style?: CSSProperties;
  closeDrawer: () => void;
  selectedSidebar: string;
}

type MenuItem = Required<MenuProps>['items'][number];

const flattenRoutes = (routes: Route[]): Route[] =>
  routes.flatMap((route) =>
    route.views && route.views.length > 0 ? flattenRoutes(route.views) : [route],
  );

/**
 * Build AntD Menu items.
 * - Simple routes -> normal clickable items
 * - Group routes (with views) -> non-clickable header row
 *   + child items rendered as first-level clickable entries.
 *
 * For Kontrol, optional `scope` / `moduleKey` on group routes can be used
 * to style or annotate section headers (via CSS classes). `isAdmin` and
 * `isCrossModule` are metadata flags consumed upstream or in CSS; the menu
 * itself stays generic.
 */
const toMenuItems = (
  routes: Route[],
  selectedSidebar: string,
  closeDrawer: () => void,
  worldKey: string | null,
): MenuItem[] => {
  const items: MenuItem[] = [];
  const usedKeys = new Set<string>();

  const pushUnique = (key: string, item: MenuItem) => {
    // Ant Design Menu forwards item keys to React. Duplicate route paths create
    // duplicate React keys and unstable menu identity, so keep the first
    // declaration and ignore later aliases to the exact same destination.
    if (usedKeys.has(key)) return;
    usedKeys.add(key);
    items.push(item);
  };

  routes.forEach((route, routeIndex) => {
    // Group / section
    if (route.views && route.views.length > 0) {
      const sectionKey = `section-${routeIndex}-${route.name}`;

      // Non-clickable section header (optional icon + scope metadata)
      items.push({
        key: sectionKey,
        disabled: true,
        label: (
          <div className="k-sidebar-section-header">
            {/* Design rule: groups can have an icon, but leaves are primary visual anchors */}
            {route.icon && (
              <span className="k-sidebar-section-header-icon">
                {route.icon}
              </span>
            )}
            <span className="k-sidebar-section-header-text">
              {route.name}
            </span>
            {route.scope && (
              <span
                className={`k-sidebar-section-scope k-sidebar-section-scope-${route.scope}`}
              >
                {route.scope === 'platform'
                  ? 'Platform'
                  : route.scope === 'module'
                  ? 'Module'
                  : 'Org'}
              </span>
            )}
            {route.moduleKey && (
              <span className="k-sidebar-section-module">
                {route.moduleKey}
              </span>
            )}
          </div>
        ),
        className: 'k-sidebar-section-header',
      } as MenuItem);

      // Child items rendered as regular first-level entries
      route.views.forEach((child) => {
        if (!child.path) return;

        pushUnique(
          child.path,
          {
            key: child.path,
            icon: child.icon,
            className: 'k-sidebar-section-item',
            label: (
              <Link
                href={{
                  pathname: withWorldPath(child.path, worldKey),
                  query: { sidebar: selectedSidebar },
                }}
                onClick={closeDrawer}
              >
                {child.name}
              </Link>
            ),
          } as MenuItem,
        );
      });

      return;
    }

    // Simple route
    if (!route.path) return;

    pushUnique(
      route.path,
      {
        key: route.path,
        icon: route.icon,
        label: (
          <Link
            href={{ pathname: withWorldPath(route.path, worldKey), query: { sidebar: selectedSidebar } }}
            onClick={closeDrawer}
          >
            {route.name}
          </Link>
        ),
      } as MenuItem,
    );
  });

  return items;
};

const MenuComponent: React.FC<MenuComponentProps> = ({
  routes,
  style,
  closeDrawer,
  selectedSidebar,
}) => {
  const pathname = usePathname() ?? '/';
  const worldKey = getWorldKeyFromPathname(pathname);
  const appPath = stripWorldPrefix(pathname);

  const flat = React.useMemo(() => flattenRoutes(routes), [routes]);

  const selectedKey = React.useMemo(() => {
    const matches = flat.filter(
      (route) => route.path && appPath.startsWith(route.path),
    );

    if (!matches.length) {
      return undefined;
    }

    // Choose the most specific match (longest path)
    const best = matches.reduce((currentBest, route) => {
      if (!currentBest.path) return route;
      if (!route.path) return currentBest;
      return route.path.length > currentBest.path.length ? route : currentBest;
    });

    return best.path;
  }, [flat, appPath]);

  const items = React.useMemo(
    () => toMenuItems(routes, selectedSidebar, closeDrawer, worldKey),
    [routes, selectedSidebar, closeDrawer, worldKey],
  );

  return (
    <Menu
      mode="inline"
      selectedKeys={selectedKey ? [selectedKey] : []}
      items={items}
      style={{
        background: 'var(--ant-color-bg-container)',
        color: 'var(--ant-color-text)',
        padding: '16px 0',
        ...style,
      }}
    />
  );
};

export default MenuComponent;
