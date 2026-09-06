// FILE: frontend/app/kreative/kreativePageShell.tsx
'use client';

import { Space, Typography } from 'antd';
import React, { ReactNode } from 'react';

const { Title, Paragraph } = Typography;

type KreativePageShellProps = {
  /** Main page title (no extra <h1> in the page) */
  title: string;
  /** Optional subtitle / helper text under the title */
  subtitle?: string;
  /** Primary action on the right (e.g. main CTA button) */
  primaryAction?: ReactNode;
  /** Secondary actions on the right (e.g. ghost buttons, filters) */
  secondaryActions?: ReactNode;
  /** Main page content */
  children: ReactNode;
};

/**
 * Central layout wrapper for Kreative pages.
 *
 * Usage rules:
 * - Pas de gros <h1> / Title supplémentaire dans les pages elles‑mêmes.
 * - Pas de fil d’Ariane ici (utiliser celui du layout global si besoin).
 * - Toutes les pages Kreative devraient utiliser ce shell pour garder
 *   le même padding, la même hiérarchie de titres, etc.
 */
export default function KreativePageShell({
  title,
  subtitle,
  primaryAction,
  secondaryActions,
  children,
}: KreativePageShellProps): JSX.Element {
  const hasActions = Boolean(primaryAction || secondaryActions);

  return (
    <div className="container mx-auto p-5">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Title level={2} style={{ marginBottom: subtitle ? 4 : 0 }}>
            {title}
          </Title>
          {subtitle && (
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
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
      <div>{children}</div>
    </div>
  );
}
