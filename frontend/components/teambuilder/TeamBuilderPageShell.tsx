// FILE: frontend/components/teambuilder/TeamBuilderPageShell.tsx
'use client';

import { Grid, Space, Typography } from 'antd';
import Head from 'next/head';
import { useSearchParams } from 'next/navigation';
import React, { type ReactNode } from 'react';

import usePageTitle from '@/hooks/usePageTitle';

const { Title, Paragraph } = Typography;
const { useBreakpoint } = Grid;

export type TeamBuilderPageShellProps = {
  /** Main page title (H1-equivalent) */
  title: string;
  /** Optional subtitle / helper text under the title */
  subtitle?: ReactNode;
  /**
   * Optional browser <title>.
   * If omitted, the shell generates:
   *  - "Team Builder · {sectionLabel} · {title}" when sectionLabel is set
   *  - "Team Builder · {title}" otherwise
   */
  metaTitle?: string;
  /**
   * Optional section label for meta-title only.
   * Examples: "All Sessions", "Project Teams", "Debate Panels", "Art Collectives"
   *
   * If omitted, the shell will try to infer it from the current ?context=… query param.
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
 * Best-effort inference of the Team Builder section label
 * from the current ?context=… query parameter.
 */
function inferSectionLabelFromQuery(
  searchParams: ReturnType<typeof useSearchParams> | null,
): string | undefined {
  const ctx = searchParams?.get('context');

  switch (ctx) {
    case 'keenkonnect':
      return 'Project Teams';
    case 'ethikos':
      return 'Debate Panels';
    case 'kreative':
      return 'Art Collectives';
    default:
      return undefined;
  }
}

/**
 * Central layout wrapper for Team Builder pages.
 */
function TeamBuilderPageShell({
  title,
  subtitle,
  metaTitle,
  sectionLabel,
  primaryAction,
  secondaryActions,
  children,
  maxWidth = 1200,
}: TeamBuilderPageShellProps): JSX.Element {
  const searchParams = useSearchParams();
  const screens = useBreakpoint();

  const inferredSectionLabel = inferSectionLabelFromQuery(searchParams);
  const effectiveSectionLabel = sectionLabel ?? inferredSectionLabel;

  const hasActions = Boolean(primaryAction || secondaryActions);

  const finalMetaTitle =
    metaTitle ??
    (effectiveSectionLabel
      ? `Team Builder · ${effectiveSectionLabel} · ${title}`
      : `Team Builder · ${title}`);

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

export default TeamBuilderPageShell;
