// FILE: frontend/app/konnected/KonnectedPageShell.tsx
// app/konnected/KonnectedPageShell.tsx
'use client';

import { Space, Typography } from 'antd';
import React, { ReactNode } from 'react';

const { Title, Paragraph } = Typography;

export type KonnectedPageShellProps = {
  /** Main page title (big, H1-equivalent) */
  title: string;
  /** Optional subtitle / helper text under the title */
  subtitle?: ReactNode;
  /** Main CTA on the right (e.g. primary button) */
  primaryAction?: ReactNode;
  /** Secondary actions on the right (e.g. ghost buttons, filters) */
  secondaryActions?: ReactNode;
  /** Main page content */
  children: ReactNode;
};

/**
 * Central layout wrapper for KonnectED pages (Konnected segment).
 *
 * Usage rules:
 * - Do not render another top-level <h1> / Typography.Title outside this shell.
 * - Do not render breadcrumbs here (those belong to the global/MainLayout shell).
 * - All /konnected/* pages should use this for consistent padding & header.
 */
export default function KonnectedPageShell({
  title,
  subtitle,
  primaryAction,
  secondaryActions,
  children,
}: KonnectedPageShellProps): JSX.Element {
  const hasActions = Boolean(primaryAction || secondaryActions);

  return (
    <div className="container mx-auto p-5">
      {/* Header: title + subtitle + actions */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Title level={2} className="!mb-1">
            {title}
          </Title>
          {subtitle && (
            <Paragraph type="secondary" className="!mb-0">
              {subtitle}
            </Paragraph>
          )}
        </div>

        {hasActions && (
          <Space wrap>
            {secondaryActions}
            {primaryAction}
          </Space>
        )}
      </div>

      {/* Main content */}
      {children}
    </div>
  );
}
