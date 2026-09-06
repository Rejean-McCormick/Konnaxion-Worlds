// FILE: frontend/components/layout-components/LogoTitle.tsx
'use client'

import { DownOutlined } from '@ant-design/icons'
import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styled from 'styled-components'

import { getWorldKeyFromPathname, withWorldPath } from '@/lib/worlds'

/* ------------ module keys & mappings ------------ */

const SUITE_KEYS = [
  'ekoh',
  'ethikos',
  'keenkonnect',
  'konnected',
  'kreative',
  'kontrol',
  'teambuilder',
] as const

type SuiteKey = (typeof SUITE_KEYS)[number]

const TITLE_BY_SUITE: Record<SuiteKey, string> = {
  ekoh: 'EkoH',
  ethikos: 'EthiKos',
  keenkonnect: 'keenKonnect',
  konnected: 'KonnectED',
  kreative: 'Kreative',
  kontrol: 'KonTrol',
  teambuilder: 'Team Builder',
}

const DEFAULT_ENTRY: Record<SuiteKey, string> = {
  ekoh: '/ekoh/dashboard',
  ethikos: '/ethikos/insights',
  keenkonnect: '/keenkonnect/dashboard',
  konnected: '/konnected/dashboard',
  kreative: '/kreative/dashboard',
  kontrol: '/kontrol/dashboard',
  teambuilder: '/teambuilder',
}

/* ------------ styled ------------ */

const TitleWrapper = styled.div<{ $variant: 'sider' | 'header' }>`
  position: relative;
  display: flex;
  align-items: center;
  height: 64px;
  padding-left: ${({ $variant }) => ($variant === 'sider' ? '24px' : '16px')};
  padding-right: 16px;
  gap: 12px;
  overflow: hidden;
  background: var(--ant-color-bg-container);
  transition: background 0.3s ease;
`

const Logo = styled.img`
  display: block;
  height: 32px;
  width: auto;
`

const ModuleToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--ant-color-text);
  font-weight: 600;
  font-size: 18px;
  cursor: pointer;

  &:hover {
    background: var(--ant-color-fill-secondary);
  }
`

/* ------------ types ------------ */

interface LogoTitleProps {
  onSidebarChange: (key: SuiteKey) => void
  selectedSidebar?: string | SuiteKey
  variant?: 'sider' | 'header'
  className?: string
}

/* ------------ helpers ------------ */

// Dropdown menu with separators:
// ekoh
// ---
// ethikos, keenkonnect, konnected, kreative
// ---
// kontrol, teambuilder
const menuItems: MenuProps['items'] = [
  { key: 'ekoh', label: TITLE_BY_SUITE.ekoh },
  { type: 'divider' },
  { key: 'ethikos', label: TITLE_BY_SUITE.ethikos },
  { key: 'keenkonnect', label: TITLE_BY_SUITE.keenkonnect },
  { key: 'konnected', label: TITLE_BY_SUITE.konnected },
  { key: 'kreative', label: TITLE_BY_SUITE.kreative },
  { type: 'divider' },
  { key: 'kontrol', label: TITLE_BY_SUITE.kontrol },
  { key: 'teambuilder', label: TITLE_BY_SUITE.teambuilder },
]

function normalizeSuite(raw: string | SuiteKey | null | undefined): SuiteKey {
  if (!raw) return 'ekoh'
  const lower = String(raw).toLowerCase()
  if ((SUITE_KEYS as readonly string[]).includes(lower as SuiteKey)) {
    return lower as SuiteKey
  }
  return 'ekoh'
}

/* ------------ component ------------ */

export default function LogoTitle({
  onSidebarChange,
  selectedSidebar,
  variant = 'sider',
  className,
}: LogoTitleProps) {
  const pathname = usePathname() ?? '/'
  const suite = normalizeSuite(selectedSidebar)
  const label = TITLE_BY_SUITE[suite]
  const homeHref = withWorldPath(DEFAULT_ENTRY[suite], getWorldKeyFromPathname(pathname))

  const handleMenuClick: MenuProps['onClick'] = info => {
    const key = String(info.key) as SuiteKey
    if ((SUITE_KEYS as readonly string[]).includes(key)) {
      onSidebarChange(key)
    }
  }

  return (
    <TitleWrapper $variant={variant} className={className}>
      {/* Brand logo → navigates to the current module dashboard */}
      <Link
        href={{ pathname: homeHref, query: { sidebar: suite } }}
        aria-label="Go to module dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          textDecoration: 'none',
        }}
      >
        <Logo src="/LogoK.svg" alt="Konnaxion logo" />
      </Link>

      {/* Module switcher dropdown */}
      <Dropdown
        trigger={['click']}
        menu={{
          items: menuItems,
          onClick: handleMenuClick,
          style: {
            background: 'var(--ant-color-bg-container)',
            boxShadow: 'var(--ant-box-shadow-secondary)',
          },
        }}
      >
        <ModuleToggle type="button">
          <span>{label ?? 'Konnaxion'}</span>
          <DownOutlined />
        </ModuleToggle>
      </Dropdown>
    </TitleWrapper>
  )
}
