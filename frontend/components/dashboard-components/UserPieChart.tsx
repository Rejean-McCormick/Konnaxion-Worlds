// FILE: frontend/components/dashboard-components/UserPieChart.tsx
// C:\MyCode\Konnaxionv14\frontend\components\dashboard-components\UserPieChart.tsx
'use client';

import React from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { CardStyled } from './style';

export interface UserPieChartUser {
  userId: string;
}

export interface UserSegment {
  key?: string;
  label: string;
  value: number;
  color?: string;
}

export interface UserPieChartProps {
  /**
   * Raw users; used to derive provider-based segments if `segments` is not provided.
   */
  users?: UserPieChartUser[];
  /**
   * Explicit segments (e.g. by expertise, activity); takes precedence over `users` if non-empty.
   */
  segments?: UserSegment[];
  /**
   * Card title.
   */
  title?: string;
  /**
   * Inner chart container height in pixels.
   */
  height?: number;
  /**
   * Optional legend label formatter.
   */
  legendFormatter?: (label: string) => string;
}

type PieDatum = {
  name: string;
  value: number;
  color?: string;
};

const DEFAULT_COLORS = [
  '#A97BE9',
  '#EA4335',
  '#1890FF',
  '#13C2C2',
  '#FAAD14',
] as const;

const buildProviderSegments = (users: UserPieChartUser[]): UserSegment[] => {
  let email = 0;
  let google = 0;
  let facebook = 0;

  for (const u of users) {
    const id = u.userId || '';
    if (id.includes('auth0')) email += 1;
    else if (id.includes('google')) google += 1;
    else if (id.includes('facebook')) facebook += 1;
    else email += 1; // Fallback: treat unknown provider as "Email / other"
  }

  return [
    { key: 'email', label: 'Email', value: email, color: DEFAULT_COLORS[0] },
    { key: 'google', label: 'Google', value: google, color: DEFAULT_COLORS[1] },
    {
      key: 'facebook',
      label: 'Facebook',
      value: facebook,
      color: DEFAULT_COLORS[2],
    },
  ];
};

const toPieData = (segments: UserSegment[]): PieDatum[] =>
  segments.map((s) => ({
    name: s.label,
    value: typeof s.value === 'number' ? s.value : 0,
    color: s.color,
  }));

const UserPieChart: React.FC<UserPieChartProps> = ({
  users,
  segments,
  title = 'Proportion of Users',
  height = 294,
  legendFormatter,
}) => {
  const effectiveSegments: UserSegment[] =
    Array.isArray(segments) && segments.length > 0
      ? segments
      : Array.isArray(users) && users.length > 0
      ? buildProviderSegments(users)
      : [];

  const data: PieDatum[] = toPieData(effectiveSegments);
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);

  const legendFormatterImpl =
    legendFormatter &&
    ((value: string) => legendFormatter(value) as React.ReactNode);

  return (
    <CardStyled title={title}>
      {total === 0 ? (
        <div
          style={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(0,0,0,0.45)',
            fontSize: 14,
          }}
        >
          No user data available yet.
        </div>
      ) : (
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={
                      entry.color ??
                      DEFAULT_COLORS[index % DEFAULT_COLORS.length] ??
                      '#8884d8'
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend formatter={legendFormatterImpl ?? undefined} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </CardStyled>
  );
};

export default UserPieChart;
