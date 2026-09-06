// FILE: frontend/app/ethikos/trust/credentials/page.tsx
// app/ethikos/trust/credentials/page.tsx
'use client';

/**
 * Sources used to build this implementation:
 * - Baseline page from the app dump (existing upload flow, alert, steps content).
 * - Trust services showing `uploadCredential` helper (currently a stub without a real backend).
 */

import {
  ClockCircleOutlined,
  EyeInvisibleOutlined,
  FileTextOutlined,
  InboxOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProCard,
  type ProColumns,
  ProDescriptions,
  type ProDescriptionsItemProps,
  ProTable,
} from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import {
  Alert,
  message as antdMessage,
  Button,
  Divider,
  Drawer,
  List,
  Popconfirm,
  Result,
  Space,
  Steps,
  Tag,
  Tooltip,
  Typography,
  Upload,
  type UploadProps,
} from 'antd';
import dayjs from 'dayjs';
import Link from 'next/link';
import { type ReactNode, useMemo, useState } from 'react';

import EthikosPageShell from '@/app/ethikos/EthikosPageShell';
import { type Credential, uploadCredential } from '@/services/trust';

/* ---------------------------------------------
 * Types & local helpers
 * ------------------------------------------- */

type CredentialStatus = 'Verified' | 'Pending' | 'Rejected';

type CredentialRow = Credential & {
  status: CredentialStatus;
  notes?: string;
};

const statusColor: Record<CredentialStatus, string> = {
  Verified: 'green',
  Pending: 'gold',
  Rejected: 'red',
};

function toTitleFromFilename(name?: string): string {
  if (!name) return 'Untitled credential';
  return name.replace(/\.[a-zA-Z0-9]+$/, '').replace(/[_\-]+/g, ' ').trim();
}

/* ---------------------------------------------
 * Data fetching (no backend yet → returns mock)
 * When backend is ready, replace the body with a GET
 * using the shared axios helper, e.g.:
 *   const { items } = await get<{items: CredentialRow[]}>('trust/credentials')
 * ------------------------------------------- */
async function fetchUserCredentials(): Promise<CredentialRow[]> {
  // Mocked examples to drive the UI until the real endpoint exists.
  return [
    {
      id: 'cred-001',
      title: 'MSc Climate Policy',
      issuer: 'London School of Economics',
      issuedAt: '2022-09-01T00:00:00.000Z',
      url: 'https://example.org/lse-msc.pdf',
      status: 'Verified',
      notes: 'Verified by steward #42',
    },
    {
      id: 'cred-002',
      title: 'Professional Engineer (P.Eng.)',
      issuer: 'PEO',
      issuedAt: '2021-03-15T00:00:00.000Z',
      status: 'Pending',
      notes: 'Queued for human review',
    },
    {
      id: 'cred-003',
      title: 'Research Fellow – Energy Policy',
      issuer: 'Policy Institute',
      issuedAt: '2020-01-10T00:00:00.000Z',
      status: 'Rejected',
      notes: 'Insufficient documentation',
    },
  ];
}

/* ---------------------------------------------
 * Component
 * ------------------------------------------- */

const { Text, Paragraph } = Typography;

export default function Credentials() {
  const [done, setDone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lastFileName, setLastFileName] = useState<string | undefined>();
  const [detail, setDetail] = useState<CredentialRow | null>(null);

  // Existing stepper UX: 0=Upload, 1=Review, 2=Outcome
  const currentStep = done ? 2 : uploading ? 1 : 0;

  // List of existing credentials (mocked for now; see fetcher above).
  const { data, loading, refresh, mutate } = useRequest<CredentialRow[], []>(
    fetchUserCredentials,
  );

  const rows = data ?? [];

  // Quick counters
  const counters = useMemo(() => {
    const verified = rows.filter((r) => r.status === 'Verified').length;
    const pending = rows.filter((r) => r.status === 'Pending').length;
    const rejected = rows.filter((r) => r.status === 'Rejected').length;
    return { verified, pending, rejected, total: rows.length };
  }, [rows]);

  const summaryTags = (
    <Space wrap>
      <Tag key="total">Total: {counters.total}</Tag>
      <Tag color="green" key="v">
        Verified: {counters.verified}
      </Tag>
      <Tag color="gold" key="p">
        Pending: {counters.pending}
      </Tag>
      <Tag color="red" key="r">
        Rejected: {counters.rejected}
      </Tag>
    </Space>
  );

  // Upload handler, wired to services/trust::uploadCredential
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    maxCount: 1,
    accept: '.pdf,.jpg,.jpeg,.png',
    beforeUpload: (file) => {
      const isAllowedType =
        file.type === 'application/pdf' ||
        file.type === 'image/jpeg' ||
        file.type === 'image/png';

      if (!isAllowedType) {
        antdMessage.error('Only PDF, JPG or PNG files are allowed.');
        return Upload.LIST_IGNORE;
      }

      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        antdMessage.error('File must be smaller than 5 MB.');
        return Upload.LIST_IGNORE;
      }

      return true;
    },
    // Match Ant Design's expected `(options) => void` signature
    customRequest: (options) => {
      const { file, onSuccess, onError } = options;
      const uploadFile = file as File;

      setUploading(true);
      setLastFileName(uploadFile.name);

      uploadCredential(uploadFile)
        .then(() => {
          onSuccess?.('ok');

          // Optimistic insert into the table list as "Pending"
          const optimistic: CredentialRow = {
            id: `tmp-${Date.now()}`,
            title: toTitleFromFilename(uploadFile.name),
            issuer: '—',
            issuedAt: new Date().toISOString(),
            status: 'Pending',
            notes: 'Awaiting manual verification',
          };
          mutate([optimistic, ...rows]);
          setDone(true);
          antdMessage.success(
            'Credential uploaded. It will be reviewed shortly.',
          );
        })
        .catch((error: unknown) => {
          const uploadError =
            error instanceof Error ? error : new Error('Credential upload failed');
          onError?.(uploadError);
          antdMessage.error('Upload failed. Please try again.');
        })
        .finally(() => {
          setUploading(false);
        });
    },
  };

  // Table columns
  const columns: ProColumns<CredentialRow>[] = [
    {
      title: 'Title',
      dataIndex: 'title',
      ellipsis: true,
      render: (_, row: CredentialRow) => (
        <Space size={6}>
          <FileTextOutlined />
          {row.url ? (
            <a href={row.url} target="_blank" rel="noreferrer">
              {row.title}
            </a>
          ) : (
            <span>{row.title}</span>
          )}
        </Space>
      ),
    },
    { title: 'Issuer', dataIndex: 'issuer', width: 220, ellipsis: true },
    {
      title: 'Issued',
      dataIndex: 'issuedAt',
      width: 140,
      valueType: 'date',
      renderText: (v) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      valueEnum: {
        Verified: { text: 'Verified', status: 'Success' },
        Pending: { text: 'Pending', status: 'Processing' },
        Rejected: { text: 'Rejected', status: 'Error' },
      },
      render: (_, row: CredentialRow) => (
        <Tag color={statusColor[row.status]}>{row.status}</Tag>
      ),
    },
    {
      title: 'Actions',
      width: 260,
      valueType: 'option',
      render: (_, row: CredentialRow) => {
        const canDownload = !!row.url;
        return [
          <Button size="small" key="view" onClick={() => setDetail(row)}>
            View
          </Button>,
          <Button
            size="small"
            key="download"
            disabled={!canDownload}
            href={row.url}
            target="_blank"
            rel="noreferrer"
          >
            Download
          </Button>,
          row.status !== 'Rejected' ? (
            <Popconfirm
              key="remove"
              title="Request removal?"
              description="A steward will review and remove this credential from your profile."
              onConfirm={() => {
                antdMessage.success('Removal request submitted.');
              }}
            >
              <Button size="small" danger>
                Request removal
              </Button>
            </Popconfirm>
          ) : (
            <Tooltip
              key="resubmit"
              title="Attach additional documents and re-submit"
            >
              <Button
                size="small"
                type="dashed"
                onClick={() => {
                  antdMessage.info(
                    'Re-submit by uploading an updated document below.',
                  );
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Re-submit
              </Button>
            </Tooltip>
          ),
        ];
      },
    },
  ];

  const pageBody = (
    <PageContainer ghost>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
        message={
          <Space>
            <SafetyCertificateOutlined />
            <span>Optional but powerful trust signal</span>
            <Tag color="blue">Beta</Tag>
          </Space>
        }
        description={
          <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
            Upload real-world credentials (certifications, professional
            memberships, academic records) that help stewards understand why
            your voice carries expertise in certain debates. These documents are
            reviewed manually and do not replace community-based reputation.
          </Paragraph>
        }
      />

      <ProCard gutter={16} wrap>
        <ProCard
          colSpan={{ xs: 24, lg: 14 }}
          title="Upload a new credential"
          bordered
          extra={<Tag color="default">Private review only</Tag>}
        >
          {done ? (
            <Result
              status="success"
              title="Credential received"
              subTitle={
                <>
                  {lastFileName && (
                    <div>
                      <Text strong>{lastFileName}</Text>
                      <br />
                    </div>
                  )}
                  <Text>
                    Your document is now queued for human review. If accepted,
                    it will appear as a verified note in your Ethikos trust
                    profile.
                  </Text>
                </>
              }
              extra={
                <Space wrap>
                  <Button type="primary" onClick={() => setDone(false)}>
                    Upload another
                  </Button>
                  <Link href="/ethikos/trust/profile">
                    <Button>View my trust profile</Button>
                  </Link>
                  <Link href="/ethikos/trust/badges">
                    <Button type="text">See my badges</Button>
                  </Link>
                </Space>
              }
            />
          ) : (
            <>
              <Upload.Dragger {...uploadProps} disabled={uploading}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  Click or drag a credential file to this area to upload
                </p>
                <p className="ant-upload-hint">
                  Supported formats: PDF, JPG, PNG · Max 5 MB · One document at
                  a time.
                </p>
              </Upload.Dragger>

              <Divider />

              <Space
                direction="vertical"
                size="small"
                style={{ width: '100%' }}
              >
                <Text type="secondary">
                  Tip: upload focused evidence rather than full CVs. For
                  example, a single certification for climate policy is more
                  helpful than a long résumé.
                </Text>
                <Text type="secondary">
                  You can always complement these documents with activity-based
                  reputation earned through debates, voting and impact work.
                </Text>
              </Space>
            </>
          )}
        </ProCard>

        <ProCard
          colSpan={{ xs: 24, lg: 10 }}
          title="How credentials fit into Ethikos trust"
          bordered
        >
          <Steps
            direction="vertical"
            size="small"
            current={currentStep}
            items={[
              {
                title: 'Upload',
                description:
                  'You submit a credential associated with your real-world expertise.',
              },
              {
                title: 'Review',
                description:
                  'Stewards or administrators verify authenticity and relevance for debate topics.',
                icon: <ClockCircleOutlined />,
              },
              {
                title: 'Outcome',
                description:
                  'If accepted, a note is added to your profile and may influence role assignments.',
              },
            ]}
          />

          <Divider />

          <List
            size="small"
            header="Examples of accepted credentials"
            dataSource={[
              'Professional licensure (e.g. bar membership, medical board certification).',
              'Academic degrees in fields relevant to debates you join.',
              'Official appointments or advisory roles in public institutions.',
              'Peer-reviewed publications or major reports where you are a named author.',
            ]}
            renderItem={(item) => (
              <List.Item>
                <Text>{item}</Text>
              </List.Item>
            )}
          />

          <Divider />

          <List
            size="small"
            header={
              <Space>
                <EyeInvisibleOutlined />
                <span>Privacy and scope</span>
              </Space>
            }
            dataSource={[
              'Uploaded documents are only visible to designated reviewers, not to the general public.',
              'Metadata (type of credential, issuing body, year) may be surfaced in your profile once verified.',
              'You can request removal of a credential at any time once backend support exists.',
            ]}
            renderItem={(item) => (
              <List.Item>
                <Text type="secondary">{item}</Text>
              </List.Item>
            )}
          />
        </ProCard>

        <ProCard colSpan={24} title="My credentials" ghost>
          <ProTable<CredentialRow>
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={rows}
            pagination={{ pageSize: 5, showSizeChanger: true }}
            search={false}
            toolBarRender={() => [
              <Tooltip key="refresh" title="Refresh">
                <Button onClick={() => refresh()}>Refresh</Button>
              </Tooltip>,
            ]}
          />
        </ProCard>
      </ProCard>

      <Drawer
        open={!!detail}
        width={520}
        title="Credential details"
        onClose={() => setDetail(null)}
      >
        {detail && (
          <ProDescriptions<CredentialRow>
            column={1}
            dataSource={detail}
            columns={
              [
                { title: 'Title', dataIndex: 'title' },
                { title: 'Issuer', dataIndex: 'issuer' },
                {
                  title: 'Issued',
                  dataIndex: 'issuedAt',
                  render: (_: ReactNode, row: CredentialRow) =>
                    dayjs(row.issuedAt).format('YYYY-MM-DD'),
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  render: (_: ReactNode, row: CredentialRow) => (
                    <Tag color={statusColor[row.status]}>{row.status}</Tag>
                  ),
                },
                detail.url
                  ? {
                      title: 'Document',
                      dataIndex: 'url',
                      render: (_: ReactNode, row: CredentialRow) => (
                        <a href={row.url} target="_blank" rel="noreferrer">
                          Open document
                        </a>
                      ),
                    }
                  : undefined,
                detail.notes
                  ? {
                      title: 'Notes',
                      dataIndex: 'notes',
                    }
                  : undefined,
              ].filter(Boolean) as ProDescriptionsItemProps<CredentialRow>[]
            }
          />
        )}
      </Drawer>
    </PageContainer>
  );

  return (
    <EthikosPageShell
      title="Credentials"
      sectionLabel="Trust"
      subtitle="Upload and manage real-world credentials that help stewards understand your expertise in Ethikos debates."
      secondaryActions={summaryTags}
    >
      {pageBody}
    </EthikosPageShell>
  );
}