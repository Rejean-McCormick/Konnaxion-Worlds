// FILE: frontend/app/ethikos/EthikosPageShell.tsx
// app/ethikos/EthikosPageShell.tsx
'use client';

import { Grid, Space, Typography } from 'antd';
import Head from 'next/head';
import { usePathname } from 'next/navigation';
import React, { type ReactNode } from 'react';

import usePageTitle from '@/hooks/usePageTitle';

const { Title, Paragraph } = Typography;
const { useBreakpoint } = Grid;

export type EthikosPageShellProps = {
  /** Main page title (H1-equivalent) */
  title: string;
  /** Optional subtitle / helper text under the title */
  subtitle?: ReactNode;
  /**
   * Optional browser <title>.
   * If omitted, the shell generates:
   *  - "EthiKos · {sectionLabel} · {title}" when sectionLabel is set
   *  - "EthiKos · {title}" otherwise
   */
  metaTitle?: string;
  /**
   * Optional section label for meta-title only.
   * Examples: "Decide", "Deliberate", "Pulse", "Trust", "Impact", "Admin", "Learn"
   *
   * If omitted, the shell will try to infer it from the current /ethikos/* route.
   */
  sectionLabel?: string;
  /** Main CTA on the right (e.g. primary button) */
  primaryAction?: ReactNode;
  /** Secondary actions on the right (e.g. ghost buttons, filters) */
  secondaryActions?: ReactNode;
  /** Main page content */
  children: ReactNode;
  /** Max width for the central content container (like KeenPageShell) */
  maxWidth?: number | string;
};

/**
 * Best-effort inference of the Ethikos section label from the current pathname.
 * This is now used only for the <title>, not for any visible breadcrumb/badge.
 */
function inferSectionLabel(pathname: string | null | undefined): string | undefined {
  if (!pathname) return undefined;

  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== 'ethikos') return undefined;

  const section = segments[1];

  switch (section) {
    case 'decide':
      return 'Decide';
    case 'deliberate':
      return 'Deliberate';
    case 'pulse':
      return 'Pulse';
    case 'trust':
      return 'Trust';
    case 'impact':
      return 'Impact';
    case 'learn':
      return 'Learn';
    case 'admin':
      return 'Admin';
    case 'insights':
      return 'Opinion Analytics';
    default:
      return undefined;
  }
}

/**
 * Central layout wrapper for EthiKos pages.
 */
function EthikosPageShell({
  title,
  subtitle,
  metaTitle,
  sectionLabel,
  primaryAction,
  secondaryActions,
  children,
  maxWidth = 1200,
}: EthikosPageShellProps): JSX.Element {
  const pathname = usePathname();
  const screens = useBreakpoint();

  const inferredSectionLabel = inferSectionLabel(pathname);
  const effectiveSectionLabel = sectionLabel ?? inferredSectionLabel;

  const hasActions = Boolean(primaryAction || secondaryActions);

  const finalMetaTitle =
    metaTitle ??
    (effectiveSectionLabel
      ? `EthiKos · ${effectiveSectionLabel} · ${title}`
      : `EthiKos · ${title}`);

  // Keep browser/tab title in sync with the shell meta title
  usePageTitle(finalMetaTitle);

  const isMobile = !screens.md;

  return (
    <>
      <Head>
        <title>{finalMetaTitle}</title>
      </Head>

      <div className="container mx-auto p-5" style={{ maxWidth }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Space
            direction={isMobile ? 'vertical' : 'horizontal'}
            align={isMobile ? 'start' : 'center'}
            size={isMobile ? 12 : 16}
            style={{ width: '100%', justifyContent: 'space-between' }}
          >
            <Space direction="vertical" size={4} style={{ flex: 1, minWidth: 0 }}>
              <Title
                level={2}
                style={{
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                {title}
              </Title>

              {subtitle && (
                <Paragraph
                  type="secondary"
                  style={{
                    margin: 0,
                    maxWidth: 720,
                  }}
                >
                  {subtitle}
                </Paragraph>
              )}
            </Space>

            {hasActions && (
              <Space
                align="start"
                size="middle"
                wrap
                style={{
                  justifyContent: isMobile ? 'flex-start' : 'flex-end',
                  marginLeft: isMobile ? 0 : 'auto',
                  minWidth: isMobile ? 'auto' : 0,
                }}
              >
                {secondaryActions}
                {primaryAction}
              </Space>
            )}
          </Space>
        </div>

        {/* Main content */}
        <div>{children}</div>
      </div>
    </>
  );
}

export default EthikosPageShell;
