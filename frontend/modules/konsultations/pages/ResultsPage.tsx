// FILE: frontend/modules/konsultations/pages/ResultsPage.tsx
﻿'use client';

import { Alert, Spin } from 'antd';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import EkohPageShell from '@/app/ekoh/EkohPageShell';

interface ConsultationResponse {
  title?: string | null;
  // Extend with more fields if you need them later
  [key: string]: unknown;
}

interface ResultResponse {
  yes?: number;
  no?: number;
  approve?: number;
  reject?: number;
  up?: number;
  down?: number;
  // Extend with more fields if you need them later
  [key: string]: unknown;
}

interface ResultsData {
  yes: number;
  no: number;
  total: number;
  supportPercent: number;
}

export default function ConsultationResultsPage(): JSX.Element {
  const router = useRouter();
  const { consultationId } = router.query;

  const [consultationTitle, setConsultationTitle] = useState<string>('');
  const [results, setResults] = useState<ResultsData>({
    yes: 0,
    no: 0,
    total: 0,
    supportPercent: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!consultationId) {
      return;
    }

    const id =
      Array.isArray(consultationId) ? consultationId[0] : consultationId;

    if (!id) {
      return;
    }

    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);

        const [res1, res2] = await Promise.all([
          fetch(`/api/konsultations/consultations/${id}`),
          fetch(`/api/konsultations/consultations/${id}/results`),
        ]);

        if (!res1.ok || !res2.ok) {
          throw new Error(
            `Failed to load results (status ${res1.status} / ${res2.status})`,
          );
        }

        const consultation = (await res1.json()) as ConsultationResponse;
        const resultData = (await res2.json()) as ResultResponse;

        // Determine title and voting outcomes
        setConsultationTitle(consultation.title ?? 'Consultation');

        const yesCount: number =
          resultData.yes ?? resultData.approve ?? resultData.up ?? 0;
        const noCount: number =
          resultData.no ?? resultData.reject ?? resultData.down ?? 0;

        const totalVotes = yesCount + noCount;
        const supportPct =
          totalVotes > 0 ? Math.round((yesCount / totalVotes) * 100) : 0;

        setResults({
          yes: yesCount,
          no: noCount,
          total: totalVotes,
          supportPercent: supportPct,
        });
      } catch (err) {
        console.error('Error loading consultation results:', err);
        setError('Unable to load consultation results.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [consultationId]);

  const chartData = useMemo(
    () => [
      { name: 'Yes', value: results.yes },
      { name: 'No', value: results.no },
    ],
    [results.yes, results.no],
  );

  const COLORS = ['#52c41a', '#ff4d4f']; // green for Yes, red for No

  return (
    <EkohPageShell
      title="Consultation Results"
      subtitle={consultationTitle || undefined}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <Alert message={error} type="error" showIcon />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-baseline gap-4">
            <span>Yes: {results.yes}</span>
            <span>No: {results.no}</span>
            <span>Total: {results.total}</span>
            <span>Support: {results.supportPercent}%</span>
          </div>

          <div className="mb-6 max-w-md">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </EkohPageShell>
  );
}
