'use client';

import { Space, Typography } from 'antd';
import React, { ReactNode, useEffect } from 'react';

const { Title, Paragraph } = Typography;

export type ReportsPageShellProps = {
  /** Main page title */
  title: string;
  /** Optional helper text under the title */
  subtitle?: ReactNode;
  /** Optional browser tab title */
  metaTitle?: string;
  /** Main call-to-action on the right */
  primaryAction?: ReactNode;
  /** Extra actions / filters on the right */
  secondaryActions?: ReactNode;
  /** Main page content */
  children: ReactNode;
  /** Optional max content width */
  maxWidth?: number | string;
};

export default function ReportsPageShell({
  title,
  subtitle,
  metaTitle,
  primaryAction,
  secondaryActions,
  children,
  maxWidth = 1200,
}: ReportsPageShellProps): JSX.Element {
  useEffect(() => {
    if (!metaTitle) return;
    document.title = metaTitle;
  }, [metaTitle]);

  const hasActions = Boolean(primaryAction || secondaryActions);

  return (
    <div className="container mx-auto p-5" style={{ maxWidth }}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <Title level={2} className="!mb-1">
            {title}
          </Title>

          {subtitle ? (
            <Paragraph type="secondary" className="!mb-0">
              {subtitle}
            </Paragraph>
          ) : null}
        </div>

        {hasActions ? (
          <Space wrap>
            {secondaryActions}
            {primaryAction}
          </Space>
        ) : null}
      </div>

      {children}
    </div>
  );
}