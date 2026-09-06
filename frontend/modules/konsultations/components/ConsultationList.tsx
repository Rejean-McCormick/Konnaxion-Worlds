// FILE: frontend/modules/konsultations/components/ConsultationList.tsx
'use client';

import { Alert, List, Spin, Tag } from 'antd';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { fetchEthikosTopics } from '@/services/ethikos';

interface Consultation {
  id: number | string;
  title: string;
  open_date?: string;
  close_date?: string;
  status: string;
}

export default function ConsultationList(): JSX.Element {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchConsultations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Standalone /api/konsultations/* routes are forbidden in the current
        // API contract. Konsultations reads canonical ethiKos topics instead.
        const topics = await fetchEthikosTopics();
        const list: Consultation[] = topics.map((topic) => ({
          id: topic.id,
          title: topic.title,
          open_date: topic.created_at,
          close_date: topic.last_activity ?? topic.updated_at ?? undefined,
          status: topic.status,
        }));

        if (isMounted) setConsultations(list);
      } catch (err) {
        console.error('Error loading consultations:', err);
        if (isMounted) {
          setError('Unable to load consultations from the server.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchConsultations();
    return () => {
      isMounted = false;
    };
  }, []);

  const openConsultations = consultations.filter(
    (consultation) => consultation.status.toLowerCase() === 'open',
  );
  const closedConsultations = consultations.filter(
    (consultation) => consultation.status.toLowerCase() !== 'open',
  );

  const formatDate = (isoDate?: string): string => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return isoDate;
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      {error && (
        <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />
      )}

      {openConsultations.length > 0 && (
        <List
          header={<h3 style={{ marginBottom: 8 }}>Open Consultations</h3>}
          itemLayout="vertical"
          dataSource={openConsultations}
          renderItem={(item) => {
            const statusLabel =
              item.status.charAt(0).toUpperCase() + item.status.slice(1);
            const closeDate = formatDate(item.close_date);
            return (
              <List.Item
                actions={[
                  <Link
                    key="participate"
                    href={{
                      pathname: '/konsultations/suggestion',
                      query: { consultationId: String(item.id) },
                    }}
                  >
                    Participate
                  </Link>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <span>
                      {item.title} <Tag color="green">{statusLabel}</Tag>
                    </span>
                  }
                  description={closeDate ? `Closes on ${closeDate}` : undefined}
                />
              </List.Item>
            );
          }}
        />
      )}

      {closedConsultations.length > 0 && (
        <List
          header={<h3 style={{ marginTop: 24, marginBottom: 8 }}>Closed Consultations</h3>}
          itemLayout="vertical"
          dataSource={closedConsultations}
          renderItem={(item) => {
            const statusLabel =
              item.status.charAt(0).toUpperCase() + item.status.slice(1);
            const closeDate = formatDate(item.close_date);
            return (
              <List.Item
                actions={[
                  <Link
                    key="results"
                    href={{
                      pathname: '/konsultations/results',
                      query: { consultationId: String(item.id) },
                    }}
                  >
                    View Results
                  </Link>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <span>
                      {item.title} <Tag color="blue">{statusLabel}</Tag>
                    </span>
                  }
                  description={closeDate ? `Closed on ${closeDate}` : undefined}
                />
              </List.Item>
            );
          }}
        />
      )}
    </>
  );
}
