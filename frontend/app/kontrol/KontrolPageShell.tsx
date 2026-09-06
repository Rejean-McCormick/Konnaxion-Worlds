// app/kontrol/KontrolPageShell.tsx
'use client';

import { Grid, Space, Tag, Typography } from 'antd';
import Head from 'next/head';
import React, { type ReactNode } from 'react';

import usePageTitle from '@/hooks/usePageTitle';

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

// Match main suite keys so we can label module-specific dashboards
export type ModuleKey =
  | 'ekoh'
  | 'ethikos'
  | 'keenkonnect'
  | 'konnected'
  | 'kontrol'
  | 'kreative'
  | 'teambuilder';

export type KontrolScope = 'platform' | 'module';

const MODULE_LABELS: Record<ModuleKey, string> = {
  ekoh: 'EkoH',
  ethikos: 'EthiKos',
  keenkonnect: 'keenKonnect',
  konnected: 'KonnectED',
  kontrol: 'KonTrol',
  kreative: 'Kreative',
  teambuilder: 'TeamBuilder',
};

export type KontrolPageShellProps = {
  /** Main page title (big, H1-equivalent) */
  title: string;
  /** Optional subtitle / helper text under the title */
  subtitle?: ReactNode;

  /**
   * Optional browser <title>.
   * If omitted, the shell generates:
   *  - "Kontrol · Platform · {title}" when scope === 'platform'
   *  - "Kontrol · {ModuleLabel} · {title}" when scope === 'module' and moduleKey is set
   *  - "Kontrol · {title}" otherwise
   */
  metaTitle?: string;

  /**
   * Scope of this Kontrol page:
   *  - 'platform' → platform-wide / cross-module controls
   *  - 'module'   → admin / analytics scoped to a single module
   */
  scope?: KontrolScope;

  /**
   * When scope === 'module', indicates which module this page is about.
   * Used only for labelling / meta-title, not for logic.
   */
  moduleKey?: ModuleKey;

  /** Main CTA on the right (e.g. primary button) */
  primaryAction?: ReactNode;
  /** Secondary actions on the right (e.g. ghost buttons, filters) */
  secondaryActions?: ReactNode;

  /** Main page content */
  children: ReactNode;

  /** Max width for the central content container */
  maxWidth?: number | string;
};

/**
 * Central layout wrapper for Kontrol (admin/platform control) pages.
 *
 * Rules:
 * - Do not render another top-level <h1> / Typography.Title outside this shell.
 * - Do not render breadcrumbs here (those belong to the global/MainLayout shell).
 * - All /kontrol/* pages should use this for consistent padding, header and <title>.
 */
function KontrolPageShell({
  title,
  subtitle,
  metaTitle,
  scope,
  moduleKey,
  primaryAction,
  secondaryActions,
  children,
  maxWidth = 1200,
}: KontrolPageShellProps): JSX.Element {
  const screens = useBreakpoint();
  const hasActions = Boolean(primaryAction || secondaryActions);

  // Compute default <title> if not explicitly provided
  const moduleLabel =
    moduleKey != null ? MODULE_LABELS[moduleKey as ModuleKey] : undefined;

  const defaultMetaTitle =
    scope === 'platform'
      ? `Kontrol · Platform · ${title}`
      : scope === 'module' && moduleLabel
      ? `Kontrol · ${moduleLabel} · ${title}`
      : `Kontrol · ${title}`;

  const finalMetaTitle = metaTitle ?? defaultMetaTitle;

  // Synchronise browser/tab title
  usePageTitle(finalMetaTitle);

  const isMobile = !screens.md;

  const renderScopeBadges = () => {
    const tags: ReactNode[] = [];

    if (scope === 'platform') {
      tags.push(
        <Tag key="scope-platform" color="blue">
          Platform-wide
        </Tag>,
      );
    } else if (scope === 'module') {
      tags.push(
        <Tag key="scope-module" color="purple">
          Module-specific
        </Tag>,
      );
    }

    if (moduleLabel) {
      tags.push(
        <Tag key="module-label" color="geekblue">
          <Text strong>Module:</Text> {moduleLabel}
        </Tag>,
      );
    }

    if (!tags.length) return null;

    return (
      <Space size="small" wrap className="mt-1">
        {tags}
      </Space>
    );
  };

  return (
    <>
      <Head>
        <title>{finalMetaTitle}</title>
      </Head>

      <div
        className="container mx-auto p-5"
        style={{ maxWidth }}
      >
        {/* Header: title + subtitle + scope badges + actions */}
        <div
          className={`mb-6 flex flex-wrap items-start justify-between gap-3 ${
            isMobile ? 'flex-col' : ''
          }`}
        >
          <div className="min-w-0 flex-1">
            <Title level={2} className="!mb-1">
              {title}
            </Title>

            {subtitle && (
              <Paragraph type="secondary" className="!mb-1">
                {subtitle}
              </Paragraph>
            )}

            {renderScopeBadges()}
          </div>

          {hasActions && (
            <Space wrap align="start">
              {secondaryActions}
              {primaryAction}
            </Space>
          )}
        </div>

        {/* Main content */}
        {children}
      </div>
    </>
  );
}

export default KontrolPageShell;
