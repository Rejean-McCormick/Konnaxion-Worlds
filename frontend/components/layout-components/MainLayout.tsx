// FILE: frontend/components/layout-components/MainLayout.tsx
// C:\MyCode\Konnaxionv14\frontend\components\layout-components\MainLayout.tsx
'use client';

import { Layout } from 'antd';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import DrawerComponent from '@/components/layout-components/Drawer';
import HeaderComponent from '@/components/layout-components/Header';
import LogoTitle from '@/components/layout-components/LogoTitle';
import Main from '@/components/layout-components/Main';
import MenuComponent from '@/components/layout-components/Menu';
import type { Route } from '@/components/layout-components/Menu';
import { getWorldKeyFromPathname, stripWorldPrefix, withWorldPath } from '@/lib/worlds';
import FixedSider from '@/components/layout-components/Sider';

const { Content } = Layout;

/**
 * Add "teambuilder" as a first-class suite, just like ekoh, ethikos, …
 */
interface RoutesConfig {
  ekoh: Route[];
  ethikos: Route[];
  keenkonnect: Route[];
  konnected: Route[];
  kreative: Route[];
  kontrol: Route[];
  teambuilder: Route[];   // <-- NEW
}

type SuiteKey = keyof RoutesConfig;

/**
 * Order of modules in the main shell
 *
 * ekoh
 * ---
 * ethikos, keenkonnect, konnected, kreative
 * ---
 * kontrol, teambuilder
 */
const SUITES: SuiteKey[] = [
  'ekoh',
  'ethikos',
  'keenkonnect',
  'konnected',
  'kreative',
  'kontrol',
  'teambuilder',          // <-- NEW
];

/**
 * Default landing route per suite
 */
const DEFAULT_ENTRY: Record<SuiteKey, string> = {
  ekoh: '/ekoh/dashboard',
  ethikos: '/ethikos/insights',
  keenkonnect: '/keenkonnect/dashboard',
  konnected: '/konnected/dashboard',
  kreative: '/kreative/dashboard',
  kontrol: '/kontrol/dashboard',
  teambuilder: '/teambuilder',   // <-- NEW (root of the Team Builder app)
};

const isSuiteKey = (val: string | null): val is SuiteKey =>
  typeof val === 'string' && SUITES.includes(val as SuiteKey);

/**
 * Determine active module from pathname + optional ?sidebar
 *
 * ?sidebar wins when it matches a known suite.
 * Otherwise infer from the first path segment.
 * /konsensus is mapped to the Kollective Intelligence suite (ekoh).
 */
const detectSuite = (pathname: string, sidebarParam: string | null): SuiteKey => {
  if (isSuiteKey(sidebarParam)) return sidebarParam;

  const safePath = stripWorldPrefix(pathname || '/');
  const segments = safePath.split('/');
  const first = (segments[1] ?? '').toLowerCase();

  if (first === 'konsensus') {
    // Konsensus Center lives under the Kollective Intelligence umbrella
    return 'ekoh';
  }

  if (isSuiteKey(first)) return first;

  return 'ekoh';
};

type MainLayoutProps = React.PropsWithChildren<{
  collapsed?: boolean;
}>;

export default function MainLayout({
  collapsed: initialCollapsed = false,
  children,
}: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const sidebarParam = searchParams.get('sidebar');

  const [collapsed, setCollapsed] = useState<boolean>(initialCollapsed);
  const [drawerVisible, setDrawer] = useState<boolean>(false);

  const [routes, setRoutes] = useState<RoutesConfig>({
    ekoh: [],
    ethikos: [],
    keenkonnect: [],
    konnected: [],
    kreative: [],
    kontrol: [],
    teambuilder: [],         // <-- NEW
  });

  // Current suite
  const [suite, setSuite] = useState<SuiteKey>(() =>
    detectSuite(pathname, sidebarParam),
  );

  // Dynamically load sidebar routes for each suite
  useEffect(() => {
    let isMounted = true;

    Promise.all([
      import('@/routes/routesEkoh'),
      import('@/routes/routesEthikos'),
      import('@/routes/routesKeenkonnect'),
      import('@/routes/routesKonnected'),
      import('@/routes/routesKreative'),
      import('@/routes/routesKontrol'),
      import('@/routes/routesTeambuilder'),   // <-- NEW
    ])
      .then(
        ([
          { default: ekoh },
          { default: ethikos },
          { default: keen },
          { default: konnected },
          { default: kreative },
          { default: kontrol },
          { default: teambuilder },           // <-- NEW
        ]) => {
          if (!isMounted) return;
          setRoutes({
            ekoh,
            ethikos,
            keenkonnect: keen,
            konnected,
            kreative,
            kontrol,
            teambuilder,                       // <-- NEW
          });
        },
      )
       
      .catch((err) => console.error('Erreur chargement routes :', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Resync suite when URL changes (back/forward or internal navigation)
  useEffect(() => {
    const next = detectSuite(pathname, sidebarParam);
    if (next !== suite) {
      setSuite(next);
    }
  }, [pathname, sidebarParam, suite]);

  const changeSuite = (rawKey: string) => {
    if (!isSuiteKey(rawKey)) return;
    const key: SuiteKey = rawKey;

    setSuite(key);

    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set('sidebar', key);

    const basePath = withWorldPath(DEFAULT_ENTRY[key], getWorldKeyFromPathname(pathname));
    const query = params.toString();
    const target = query ? `${basePath}?${query}` : basePath;

    router.push(target);
  };

  const toggle = () => {
    // Guard for environments where window might not exist (tests, SSR edge cases)
    if (typeof window === 'undefined') {
      setCollapsed((prev) => !prev);
      return;
    }

    if (window.innerWidth >= 576) {
      // Desktop: toggle sider collapse
      setCollapsed((prev) => !prev);
    } else {
      // Mobile: open/close drawer instead of touching sider
      setDrawer((prev) => !prev);
    }
  };

  const suiteRoutes = routes[suite] ?? [];

  return (
    <Layout
      style={{
        minHeight: '100vh',
        background: 'var(--ant-layout-color-bg-layout)',
      }}
    >
      {/* SIDEBAR – desktop */}
      <FixedSider collapsed={collapsed} setCollapsed={setCollapsed}>
        <LogoTitle onSidebarChange={changeSuite} selectedSidebar={suite} />
        <MenuComponent
          routes={suiteRoutes}
          closeDrawer={() => setDrawer(false)}
          selectedSidebar={suite}
        />
      </FixedSider>

      {/* MAIN + HEADER */}
      <Main collapsed={collapsed}>
        <HeaderComponent
          collapsed={collapsed}
          handleToggle={toggle}
          routes={suiteRoutes}
          selectedSidebar={suite}
        />
        <Content
          style={{
            margin: '20px 16px 15px 16px',
            background: 'var(--ant-color-bg-container)',
            borderRadius: 8,
          }}
        >
          {children}
        </Content>
      </Main>

      {/* DRAWER – mobile */}
      <DrawerComponent
        drawerVisible={drawerVisible}
        closeDrawer={() => setDrawer(false)}
      >
        <LogoTitle onSidebarChange={changeSuite} selectedSidebar={suite} />
        <MenuComponent
          routes={suiteRoutes}
          style={{ minHeight: '100vh' }}
          closeDrawer={() => setDrawer(false)}
          selectedSidebar={suite}
        />
      </DrawerComponent>
    </Layout>
  );
}
