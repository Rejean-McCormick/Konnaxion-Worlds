// FILE: frontend/components/layout-components/Header.tsx
'use client'

import {
  LoginOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Breadcrumb, Dropdown, Layout } from 'antd'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'

import api from '@/api'
import type { Route } from '@/components/layout-components/Menu'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { GlobalSearchBar } from '@/global/components'
import ActiveHeaderWidget from '@/widgets/header/ActiveHeaderWidget'
import WorldSwitcher from '@/components/worlds/WorldSwitcher'
import WorldViewAsSwitcher from '@/components/worlds/WorldViewAsSwitcher'
import { getWorldKeyFromPathname, stripWorldPrefix, withWorldPath } from '@/lib/worlds'

const { Header } = Layout

// --- Backend URL helpers (Django + Allauth) ------------------------------

const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ''

// If NEXT_PUBLIC_API_BASE is e.g. "http://localhost:8000/api",
// this yields "http://localhost:8000"
const BACKEND_ROOT =
  RAW_API_BASE.replace(/\/+$/, '').replace(/\/api$/, '') || ''

function backendUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  // Fallback: same origin as the frontend (e.g. when Django and Next are
  // served on the same host behind a reverse proxy)
  if (!BACKEND_ROOT) {
    return normalizedPath
  }

  return `${BACKEND_ROOT}${normalizedPath}`
}

/* -------- styled -------- */
const NavBar = styled.div`
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 16px;
  gap: 16px;
`

const Crumb = styled(Breadcrumb)`
  margin-left: 4px;
  color: var(--ant-color-text);

  .ant-breadcrumb-link,
  .ant-breadcrumb-separator {
    color: var(--ant-color-text-secondary);
    font-size: 13px;
  }
`

const HeaderBlock = styled.div`
  padding: 0 12px;
  height: 32px;
  display: flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid var(--ant-color-border);
  background: var(--ant-color-bg-elevated);
  cursor: pointer;
  font-size: 13px;
  color: var(--ant-color-text);
  transition:
    background 0.3s ease,
    box-shadow 0.3s ease;

  &:hover {
    background: var(--ant-color-fill-secondary);
    box-shadow: 0 0 0 1px var(--ant-color-border-secondary);
  }
`

const CenterRegion = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 16px;
`

const SearchWrapper = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: center;
`

// Fixed-width widget slot (~14 characters)
const WidgetSlot = styled.div`
  flex: 0 0 auto;
  width: 14ch;
  max-width: 14ch;
  min-width: 14ch;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 12px;
  font-size: 12px;
  color: var(--ant-color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

/* ------------ mapping du label par sidebar (aligné sur LogoTitle) ------------ */
const SUITE_LABELS: Record<string, string> = {
  ekoh: 'EkoH',
  ethikos: 'EthiKos',
  keenkonnect: 'keenKonnect',
  konnected: 'KonnectED',
  kreative: 'Kreative',
}

/* -------- types & helpers -------- */
type CurrentUser = {
  username: string
  name: string | null
}

type AccountMenuClickEvent = Parameters<NonNullable<MenuProps['onClick']>>[0]

const trail = (rs: Route[], cur: string): Route[] => {
  for (const r of rs) {
    if (r.views?.length) {
      const sub = trail(r.views, cur)
      if (sub.length) return [r, ...sub]
    }

    if (r.path && (cur === r.path || cur.startsWith(r.path))) {
      return [r]
    }
  }

  return []
}

const normalizeBreadcrumbPath = (path?: string): string | undefined => {
  if (!path) return undefined

  if (path === '/') {
    return '/'
  }

  return path.replace(/\/+$/, '')
}

/* -------- component -------- */
interface Props {
  collapsed: boolean
  handleToggle: () => void
  routes?: Route[]
  selectedSidebar?: string
}

export default function HeaderBar({
  collapsed,
  handleToggle,
  routes = [],
  selectedSidebar = '',
}: Props) {
  const router = useRouter()
  const pathname = usePathname() ?? '/'
  const cur = stripWorldPrefix(pathname)
  const worldKey = getWorldKeyFromPathname(pathname)

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    let canceled = false

    const load = async () => {
      try {
        const data = await api.get<CurrentUser>('users/me/')

        if (!canceled) {
          setCurrentUser(data)
        }
      } catch {
        if (!canceled) {
          setCurrentUser(null)
        }
      } finally {
        if (!canceled) {
          setLoadingUser(false)
        }
      }
    }

    void load()

    return () => {
      canceled = true
    }
  }, [])

  const accountMenuItems = useMemo<MenuProps['items']>(() => {
    if (currentUser) {
      return [
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: 'My profile',
        },
        { type: 'divider' as const },
        {
          key: 'logout',
          icon: <LogoutOutlined />,
          label: 'Sign out',
        },
      ]
    }

    return [
      {
        key: 'signin',
        icon: <LoginOutlined />,
        label: 'Sign in',
      },
    ]
  }, [currentUser])

  const handleAccountMenuClick: MenuProps['onClick'] = useCallback(
    ({ key }: AccountMenuClickEvent) => {
      if (key === 'profile') {
        // App Router's useRouter().push expects a string or URL, not an object
        router.push('/reputation?sidebar=ethikos')
        return
      }

      if (key === 'logout') {
        window.location.href = backendUrl('/accounts/logout/')
        return
      }

      if (key === 'signin') {
        window.location.href = backendUrl('/accounts/login/')
      }
    },
    [router],
  )

  const breadcrumbItems = useMemo(() => {
    const br = trail(routes, cur)
    const normalizedSidebar = selectedSidebar?.toLowerCase() ?? ''

    const rootName =
      SUITE_LABELS[normalizedSidebar] ??
      (normalizedSidebar
        ? normalizedSidebar.charAt(0).toUpperCase() + normalizedSidebar.slice(1)
        : 'Home')

    const rootPath =
      normalizedSidebar === 'ethikos'
        ? '/ethikos/insights'
        : normalizedSidebar
          ? `/${normalizedSidebar}`
          : '/'

    const root = {
      name: rootName,
      path: rootPath,
    }

    const crumbs = br.length ? [root, ...br] : [root]

    /*
     * A route should appear only once in the breadcrumb.
     *
     * Example:
     *
     *   EthiKos  -> /ethikos/insights
     *   Overview -> /ethikos/insights
     *
     * becomes:
     *
     *   Overview
     *
     * When the same destination appears more than once, keep the last
     * occurrence because it represents the most specific route label.
     */
    const dedupedCrumbs = crumbs.filter((crumb, index, items) => {
      const path = normalizeBreadcrumbPath(crumb.path)

      if (!path) {
        return true
      }

      return !items
        .slice(index + 1)
        .some(
          candidate =>
            normalizeBreadcrumbPath(candidate.path) === path,
        )
    })

    return dedupedCrumbs.map(c => ({
      key: c.path ?? c.name,
      title: c.path ? (
        <Link
          href={{
            pathname: withWorldPath(c.path, worldKey),
            query: { sidebar: selectedSidebar },
          }}
          style={{ color: 'var(--ant-color-text)' }}
        >
          {c.name}
        </Link>
      ) : (
        <span style={{ color: 'var(--ant-color-text)' }}>
          {c.name}
        </span>
      ),
    }))
  }, [routes, cur, selectedSidebar, worldKey])

  const displayName = useMemo(
    () =>
      (currentUser?.name && currentUser.name.trim()) ||
      currentUser?.username ||
      'Account',
    [currentUser],
  )

  return (
    <Header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'var(--ant-color-bg-container)',
        padding: 0,
        boxShadow: 'var(--ant-box-shadow-secondary)',
      }}
    >
      <NavBar>
        {/* Toggle sidebar */}
        <div
          onClick={handleToggle}
          style={{ cursor: 'pointer', marginRight: 4 }}
        >
          {collapsed ? (
            <MenuUnfoldOutlined
              style={{
                fontSize: 20,
                color: 'var(--ant-color-text)',
              }}
            />
          ) : (
            <MenuFoldOutlined
              style={{
                fontSize: 20,
                color: 'var(--ant-color-text)',
              }}
            />
          )}
        </div>

        {/* Breadcrumb (left) */}
        <Crumb items={breadcrumbItems} />

        {/* Center: search + pluggable widget slot */}
        <CenterRegion>
          <SearchWrapper>
            <GlobalSearchBar />
          </SearchWrapper>

          <WidgetSlot aria-label="Header widget">
            <ActiveHeaderWidget />
          </WidgetSlot>
        </CenterRegion>

        {/* Right side: theme + account */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <WorldSwitcher />
          <WorldViewAsSwitcher />
          <ThemeSwitcher />

          <Dropdown
            placement="bottomRight"
            menu={{
              items: accountMenuItems,
              onClick: handleAccountMenuClick,
            }}
          >
            <HeaderBlock>
              <UserOutlined
                style={{
                  marginRight: 8,
                  color: 'var(--ant-color-text)',
                }}
              />
              {loadingUser ? 'Loading…' : displayName}
            </HeaderBlock>
          </Dropdown>
        </div>
      </NavBar>
    </Header>
  )
}