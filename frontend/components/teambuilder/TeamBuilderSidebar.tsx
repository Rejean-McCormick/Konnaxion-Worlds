// FILE: frontend/components/teambuilder/TeamBuilderSidebar.tsx
'use client';

import {
  AppstoreOutlined,
  HighlightOutlined,
  ProjectOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import React from 'react';

const NavItem = ({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}) => (
  <Link
    href={href}
    className={`
      flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
      ${active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
    `}
  >
    <span
      className={`flex-shrink-0 text-lg ${
        active ? 'text-indigo-600' : 'text-gray-400'
      }`}
    >
      {icon}
    </span>
    {label}
  </Link>
);

export const TeamBuilderSidebar: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const context = searchParams.get('context');
  const isOverview = pathname === '/teambuilder' && !context;

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 min-h-screen py-6 px-4 hidden lg:block">
      <div className="mb-8 px-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Team Builder
        </h2>
      </div>

      <nav className="space-y-1">
        <NavItem
          href="/teambuilder"
          label="All Sessions"
          active={isOverview}
          icon={<AppstoreOutlined />}
        />

        <div className="pt-4 pb-2 px-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Contexts
          </h3>
        </div>

        <NavItem
          href="/teambuilder?context=keenkonnect"
          label="Project Teams"
          active={context === 'keenkonnect'}
          icon={<ProjectOutlined />}
        />

        <NavItem
          href="/teambuilder?context=ethikos"
          label="Debate Panels"
          active={context === 'ethikos'}
          icon={<SafetyCertificateOutlined />}
        />

        <NavItem
          href="/teambuilder?context=kreative"
          label="Art Collectives"
          active={context === 'kreative'}
          icon={<HighlightOutlined />}
        />
      </nav>

      <div className="mt-auto pt-8 px-2">
        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
          <h4 className="text-sm font-bold text-indigo-800 mb-1">Need help?</h4>
          <p className="text-xs text-indigo-600 mb-3">
            Learn how the matching algorithm balances skills and personalities.
          </p>
          <Link
            href="/docs/teambuilder"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline"
          >
            <ReadOutlined />
            <span>Read Documentation</span>
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default TeamBuilderSidebar;
