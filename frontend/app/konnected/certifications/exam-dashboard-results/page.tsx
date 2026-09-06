// FILE: frontend/app/konnected/certifications/exam-dashboard-results/page.tsx
// app/konnected/certifications/exam-dashboard-results/page.tsx
'use client'

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FilePdfOutlined,
  ReloadOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useRequest } from 'ahooks'
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  List,
  message,
  Result,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useMemo, useState } from 'react'

import KonnectedPageShell from '@/app/konnected/KonnectedPageShell'
import api from '@/services/_request'

const { Title, Text, Paragraph } = Typography

// NOTE: These thresholds mirror the global params from the CertifiKation spec.
// Keep in sync with backend/global-params.
const CERT_PASS_PERCENT = 80
const EXAM_RETRY_COOLDOWN_MIN = 30

// -----------------------------------------------------------------------------
// Domain types (aligned with Evaluation / CertificationPath / Portfolio models)
// -----------------------------------------------------------------------------

export type EvaluationStatus =
  | 'passed'
  | 'failed'
  | 'pending_peer'
  | 'under_review'
  | 'scheduled'
  | 'in_progress'

export interface ExamAttempt {
  id: string
  certificationPathId: string
  certificationPathName: string
  attemptNumber: number
  takenAt: string // ISO date
  deliveryMode: 'online' | 'offline' | 'blended'
  proctored: boolean
  scorePercent: number | null
  maxScore: number | null
  status: EvaluationStatus

  // Peer validation / review
  peerValidationRequired: boolean
  peerValidationStatus?: 'approved' | 'rejected' | 'pending'
  appealStatus?: 'none' | 'open' | 'resolved' | 'rejected'

  // Portfolio / certificate linkage
  certificateId?: string
  certificateUrl?: string
  portfolioItemId?: string
  portfolioUrl?: string

  // Retry & cooldown metadata
  canRetry: boolean
  nextRetryAt?: string // ISO date if blocked by cooldown
}

interface ExamAttemptsResponse {
  attempts: ExamAttempt[]
}

// -----------------------------------------------------------------------------
// API endpoint helpers
// -----------------------------------------------------------------------------
//
// IMPORTANT:
// - we use *relative* URLs WITHOUT a leading "/" so that axios baseURL
//   (NEXT_PUBLIC_API_BASE or "/api") is correctly applied.
// - On the wire this becomes:  /api/konnected/certifications/...
//

const EXAM_ATTEMPTS_ENDPOINT = 'konnected/certifications/exam-attempts/me'
const EXAM_ATTEMPT_DETAIL_ENDPOINT = (attemptId: string) =>
  `konnected/certifications/exam-attempts/${attemptId}`
const EXAM_APPEAL_ENDPOINT = (attemptId: string) =>
  `konnected/certifications/exam-attempts/${attemptId}/appeal`
const EXAM_RETRY_ENDPOINT = (attemptId: string) =>
  `konnected/certifications/exam-attempts/${attemptId}/retry`

async function fetchExamAttempts(): Promise<ExamAttemptsResponse> {
  return api.get<ExamAttemptsResponse>(EXAM_ATTEMPTS_ENDPOINT)
}

// -----------------------------------------------------------------------------
// Utility helpers
// -----------------------------------------------------------------------------

const formatDateTime = (iso: string | undefined) => {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString()
}

const getStatusTag = (attempt: ExamAttempt) => {
  if (attempt.status === 'scheduled') {
    return (
      <Tag icon={<ClockCircleOutlined />} color="default">
        Scheduled
      </Tag>
    )
  }

  if (attempt.status === 'in_progress') {
    return (
      <Tag icon={<ClockCircleOutlined />} color="processing">
        In progress
      </Tag>
    )
  }

  if (attempt.status === 'passed') {
    if (attempt.peerValidationRequired && attempt.peerValidationStatus !== 'approved') {
      // Passed automated evaluation but still waiting on peers
      return (
        <Tag icon={<ClockCircleOutlined />} color="processing">
          Pending peer validation
        </Tag>
      )
    }
    return (
      <Tag icon={<CheckCircleOutlined />} color="success">
        Passed
      </Tag>
    )
  }

  if (attempt.status === 'failed') {
    return (
      <Tag icon={<ExclamationCircleOutlined />} color="error">
        Not passed
      </Tag>
    )
  }

  if (attempt.status === 'pending_peer') {
    return (
      <Tag icon={<ClockCircleOutlined />} color="processing">
        Pending peer validation
      </Tag>
    )
  }

  if (attempt.status === 'under_review') {
    return (
      <Tag icon={<ClockCircleOutlined />} color="warning">
        Under review
      </Tag>
    )
  }

  return <Tag>Unknown</Tag>
}

const getAppealTag = (attempt: ExamAttempt) => {
  if (!attempt.appealStatus || attempt.appealStatus === 'none') {
    return null
  }

  if (attempt.appealStatus === 'open') {
    return (
      <Tag color="processing" icon={<ClockCircleOutlined />}>
        Appeal open
      </Tag>
    )
  }

  if (attempt.appealStatus === 'resolved') {
    return (
      <Tag color="success" icon={<CheckCircleOutlined />}>
        Appeal resolved
      </Tag>
    )
  }

  if (attempt.appealStatus === 'rejected') {
    return (
      <Tag color="error" icon={<ExclamationCircleOutlined />}>
        Appeal rejected
      </Tag>
    )
  }

  return null
}

type ScoreColor = 'success' | 'warning' | 'danger' | undefined

const getScoreColor = (percent: number | null): ScoreColor => {
  if (percent == null) return undefined
  if (percent >= CERT_PASS_PERCENT) return 'success'
  if (percent >= CERT_PASS_PERCENT - 10) return 'warning'
  return 'danger'
}

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------

const ExamDashboardResultsPage: React.FC = () => {
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttempt | null>(null)
  const [appealLoadingId, setAppealLoadingId] = useState<string | null>(null)
  const [retryLoadingId, setRetryLoadingId] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const pathIdFromQuery = searchParams.get('pathId')

  const {
    data,
    loading,
    error,
    refresh: refreshAttempts,
  } = useRequest(fetchExamAttempts, {
    retryCount: 1,
  })

  const allAttempts = data?.attempts ?? []

  // If pathId is present, filter attempts to that certification path
  const attempts = useMemo(
    () =>
      pathIdFromQuery
        ? allAttempts.filter((a) => a.certificationPathId === pathIdFromQuery)
        : allAttempts,
    [allAttempts, pathIdFromQuery],
  )

  const stats = useMemo(() => {
    if (!attempts.length) {
      return {
        totalAttempts: 0,
        passedCount: 0,
        passRate: 0,
        avgScore: 0,
        uniqueCerts: 0,
      }
    }

    const totalAttempts = attempts.length
    const scoredAttempts = attempts.filter(
      (a) => typeof a.scorePercent === 'number',
    ) as Array<ExamAttempt & { scorePercent: number }>
    const passedCount = scoredAttempts.filter((a) => a.scorePercent >= CERT_PASS_PERCENT).length
    const passRate = scoredAttempts.length
      ? Math.round((passedCount / scoredAttempts.length) * 100)
      : 0
    const avgScore = scoredAttempts.length
      ? Math.round(
          scoredAttempts.reduce((sum, a) => sum + (a.scorePercent ?? 0), 0) /
            scoredAttempts.length,
        )
      : 0
    const uniqueCerts = new Set(
      attempts.map((a) => a.certificationPathId || a.certificationPathName),
    ).size

    return { totalAttempts, passedCount, passRate, avgScore, uniqueCerts }
  }, [attempts])

  const handleOpenDetails = async (attempt: ExamAttempt) => {
    try {
      const detail = await api.get<ExamAttempt>(EXAM_ATTEMPT_DETAIL_ENDPOINT(attempt.id))
      setSelectedAttempt(detail)
    } catch {
      // Fallback to row data if detail endpoint is not yet wired.
      setSelectedAttempt(attempt)
    }
  }

  const handleCloseDetails = () => {
    setSelectedAttempt(null)
  }

  const handleOpenCertificate = (attempt: ExamAttempt) => {
    if (attempt.certificateUrl) {
      window.open(attempt.certificateUrl, '_blank', 'noopener,noreferrer')
    } else {
      message.info('Certificate is not yet available for this attempt.')
    }
  }

  const handleOpenPortfolio = (attempt: ExamAttempt) => {
    if (attempt.portfolioUrl) {
      window.open(attempt.portfolioUrl, '_blank', 'noopener,noreferrer')
    } else {
      message.info('This attempt is not yet linked to your portfolio.')
    }
  }

  const handleOpenAppeal = async (attempt: ExamAttempt) => {
    setAppealLoadingId(attempt.id)
    try {
      const updated = await api.post<ExamAttempt>(EXAM_APPEAL_ENDPOINT(attempt.id))
      setSelectedAttempt((prev) => (prev && prev.id === attempt.id ? updated : prev))
      refreshAttempts()
      message.success('Appeal request submitted. You will be notified when it is reviewed.')
    } catch {
      message.error('Unable to submit appeal. Please try again or contact support.')
    } finally {
      setAppealLoadingId(null)
    }
  }

  const handleRetry = async (attempt: ExamAttempt) => {
    setRetryLoadingId(attempt.id)
    try {
      const newAttempt = await api.post<ExamAttempt>(EXAM_RETRY_ENDPOINT(attempt.id))
      refreshAttempts()
      message.success('New attempt scheduled successfully.')

      // Redirect into the certification flow for this path
      if (newAttempt.certificationPathId) {
        router.push(
          `/konnected/certifications/exam-preparation?pathId=${newAttempt.certificationPathId}`,
        )
      } else if (attempt.certificationPathId) {
        router.push(
          `/konnected/certifications/exam-preparation?pathId=${attempt.certificationPathId}`,
        )
      }
    } catch (err: unknown) {
      let detail: string | null = null
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: unknown }).response
        if (response && typeof response === 'object' && 'data' in response) {
          const data = (response as { data?: unknown }).data
          if (data && typeof data === 'object' && 'detail' in data) {
            const value = (data as { detail?: unknown }).detail
            detail = typeof value === 'string' ? value : null
          }
        }
      }

      if (detail) {
        // e.g. "Retry cooldown is still active for this exam."
        message.error(detail)
      } else {
        message.error('Unable to start a new attempt. Please try again or contact support.')
      }
    } finally {
      setRetryLoadingId(null)
    }
  }

  const columns: ColumnsType<ExamAttempt> = [
    {
      title: 'Certification path',
      dataIndex: 'certificationPathName',
      key: 'certificationPathName',
      render: (text: string, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Attempt #{record.attemptNumber}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Passed', value: 'passed' },
        { text: 'Not passed', value: 'failed' },
        { text: 'Pending peer validation', value: 'pending_peer' },
        { text: 'Under review', value: 'under_review' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (_value, record) => (
        <Space direction="vertical" size={2}>
          {getStatusTag(record)}
          {getAppealTag(record)}
        </Space>
      ),
    },
    {
      title: 'Score',
      dataIndex: 'scorePercent',
      key: 'scorePercent',
      render: (value: number | null) => {
        if (value == null) {
          return <Text type="secondary">Pending</Text>
        }
        const color = getScoreColor(value)
        return (
          <Space direction="vertical" size={0}>
            <Text
              strong
              type={
                color === 'success'
                  ? 'success'
                  : color === 'danger'
                  ? 'danger'
                  : color === 'warning'
                  ? 'warning'
                  : undefined
              }
            >
              {value}%
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Pass threshold: {CERT_PASS_PERCENT}%
            </Text>
          </Space>
        )
      },
    },
    {
      title: 'Date',
      dataIndex: 'takenAt',
      key: 'takenAt',
      render: (value: string) => <Text>{formatDateTime(value)}</Text>,
      sorter: (a, b) => {
        const aTime = new Date(a.takenAt).getTime()
        const bTime = new Date(b.takenAt).getTime()
        return aTime - bTime
      },
      defaultSortOrder: 'descend',
    },
    {
      title: 'Delivery',
      dataIndex: 'deliveryMode',
      key: 'deliveryMode',
      render: (_value, record) => (
        <Space direction="vertical" size={0}>
          <Text>{record.deliveryMode === 'online' ? 'Online' : record.deliveryMode}</Text>
          {record.proctored && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Proctored
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Validation',
      key: 'validation',
      render: (_value, record) => {
        if (!record.peerValidationRequired) {
          return <Text type="secondary">Not required</Text>
        }
        if (!record.peerValidationStatus || record.peerValidationStatus === 'pending') {
          return (
            <Tag icon={<ClockCircleOutlined />} color="processing">
              Waiting for peers
            </Tag>
          )
        }
        if (record.peerValidationStatus === 'approved') {
          return (
            <Tag icon={<CheckCircleOutlined />} color="success">
              Peer-approved
            </Tag>
          )
        }
        if (record.peerValidationStatus === 'rejected') {
          return (
            <Tag icon={<ExclamationCircleOutlined />} color="error">
              Peer-rejected
            </Tag>
          )
        }
        return <Text type="secondary">—</Text>
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_value, record) => (
        <Space>
          <Tooltip title="View attempt details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleOpenDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Open certificate (if available)">
            <Button
              size="small"
              icon={<FilePdfOutlined />}
              onClick={() => handleOpenCertificate(record)}
              disabled={!record.certificateUrl}
            />
          </Tooltip>
          <Tooltip title="Open portfolio entry (if available)">
            <Button
              size="small"
              onClick={() => handleOpenPortfolio(record)}
              disabled={!record.portfolioUrl}
            >
              Portfolio
            </Button>
          </Tooltip>
          <Tooltip title="Request a manual review of this attempt">
            <Button
              size="small"
              type="default"
              icon={<WarningOutlined />}
              loading={appealLoadingId === record.id}
              onClick={() => handleOpenAppeal(record)}
              disabled={record.appealStatus === 'open'}
            >
              Appeal
            </Button>
          </Tooltip>
          <Tooltip title="Start a new attempt (if allowed)">
            <Button
              size="small"
              type="primary"
              icon={<ReloadOutlined />}
              loading={retryLoadingId === record.id}
              onClick={() => handleRetry(record)}
              disabled={!record.canRetry}
            >
              Retry
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ]

  // ---------------------------------------------------------------------------
  // Derived blocks
  // ---------------------------------------------------------------------------

  const kpiCards = (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic title="Total attempts" value={stats.totalAttempts} />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Paths passed"
            value={stats.passedCount}
            suffix={`/ ${stats.uniqueCerts || stats.totalAttempts || 0}`}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic title="Pass rate" value={stats.passRate} suffix="%" />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic title="Average score" value={stats.avgScore} suffix="%" />
        </Card>
      </Col>
    </Row>
  )

  const cooldownAlerts = (() => {
    const blockedAttempts = attempts.filter(
      (a) => !a.canRetry && a.nextRetryAt && a.status === 'failed',
    )
    if (!blockedAttempts.length) return null

    return (
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Retry cooldown in effect"
        description={
          <Space direction="vertical">
            <Text>
              Some attempts are temporarily blocked from retries to prevent burnout and
              encourage reflection.
            </Text>
            <List
              size="small"
              dataSource={blockedAttempts}
              renderItem={(a) => (
                <List.Item>
                  <Space direction="vertical" size={0}>
                    <Text strong>{a.certificationPathName}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Next retry available: {formatDateTime(a.nextRetryAt)}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
            <Text type="secondary">
              Global policy: {EXAM_RETRY_COOLDOWN_MIN} minutes minimum between failed attempts
              on the same path (configurable per tenant).
            </Text>
          </Space>
        }
      />
    )
  })()

  // ---------------------------------------------------------------------------
  // Global loading / error / empty handling
  // ---------------------------------------------------------------------------

  if (loading && !data) {
    return (
      <KonnectedPageShell
        title="Exam Dashboard & Results"
        subtitle="Track your certification exam attempts, scores, and outcomes."
      >
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      </KonnectedPageShell>
    )
  }

  if (error) {
    return (
      <KonnectedPageShell
        title="Exam Dashboard & Results"
        subtitle="Track your certification exam attempts, scores, and outcomes."
      >
        <div style={{ padding: 24 }}>
          <Result
            status="error"
            title="We could not load your exam results."
            subTitle="There was a problem contacting the CertifiKation service. Please try again in a few seconds."
            extra={
              <Button type="primary" onClick={() => refreshAttempts()}>
                Retry loading
              </Button>
            }
          />
        </div>
      </KonnectedPageShell>
    )
  }

  // No attempts at all for this user (global empty state)
  if (!allAttempts.length) {
    return (
      <KonnectedPageShell
        title="Exam Dashboard & Results"
        subtitle="Track your certification exam attempts, scores, and outcomes."
      >
        <Row gutter={24}>
          <Col xs={24} md={16}>
            <Card>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical">
                    <Text>You have not attempted any certification exams yet.</Text>
                    <Text type="secondary">
                      Once you complete an exam in the CertifiKation module, it will appear
                      here with your score, status, and certificate links.
                    </Text>
                  </Space>
                }
              >
                <Button
                  type="primary"
                  href="/konnected/certifications/exam-registration"
                >
                  Browse certification exams
                </Button>
              </Empty>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="How this dashboard works">
              <Space direction="vertical">
                <Text>
                  This dashboard consolidates all your exam attempts from the CertifiKation
                  module.
                </Text>
                <List
                  size="small"
                  dataSource={[
                    'Each attempt shows your score, pass/fail status, and validation state.',
                    'If peer validation is required, you will see when it is pending or approved.',
                    'Once a certification is granted, you can open the official certificate and any portfolio entry.',
                  ]}
                  renderItem={(item) => (
                    <List.Item>
                      <Text type="secondary">{item}</Text>
                    </List.Item>
                  )}
                />
              </Space>
            </Card>
          </Col>
        </Row>
      </KonnectedPageShell>
    )
  }

  // There are attempts overall, but none for the current path filter
  if (!attempts.length) {
    return (
      <KonnectedPageShell
        title="Exam Dashboard & Results"
        subtitle="Track your certification exam attempts, scores, and outcomes."
      >
        <Row gutter={24}>
          <Col xs={24} md={16}>
            <Card>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical">
                    <Text>No attempts yet for this certification.</Text>
                    <Text type="secondary">
                      You can register for an exam session from the Exam Registration page.
                    </Text>
                  </Space>
                }
              >
                <Button
                  type="primary"
                  href="/konnected/certifications/exam-registration"
                >
                  Go to exam registration
                </Button>
              </Empty>
            </Card>
          </Col>
        </Row>
      </KonnectedPageShell>
    )
  }

  // ---------------------------------------------------------------------------
  // Main content (normal case with attempts)
  // ---------------------------------------------------------------------------

  return (
    <KonnectedPageShell
      title="Exam Dashboard & Results"
      subtitle="Track your certification exam attempts, scores, and outcomes."
    >
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        {cooldownAlerts}

        {kpiCards}

        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Card
              title="Recent exam attempts"
              extra={
                <Space>
                  <Badge color="success" text="Passed" />
                  <Badge color="error" text="Not passed" />
                  <Badge color="processing" text="Pending / In progress" />
                </Space>
              }
            >
              <Table<ExamAttempt>
                rowKey="id"
                columns={columns}
                dataSource={attempts}
                loading={loading}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                onRow={(record) => ({
                  onClick: () => handleOpenDetails(record),
                })}
              />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Card title="Certification outcomes">
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Paragraph>
                    When you pass a CertifiKation path (and, if required, peer validation is
                    approved), your certification is:
                  </Paragraph>
                  <List
                    size="small"
                    dataSource={[
                      'Recorded in the Evaluation & CertificationPath tables.',
                      'Linked to your Portfolio as a verifiable achievement.',
                      'Exposed as a downloadable/shareable certificate.',
                    ]}
                    renderItem={(item) => (
                      <List.Item>
                        <Text type="secondary">{item}</Text>
                      </List.Item>
                    )}
                  />
                </Space>
              </Card>

              <Card title="Tips for improving your score">
                <List
                  size="small"
                  dataSource={[
                    'Review the learning path content linked to this certification.',
                    'Use the Exam Preparation page to practice with sample questions.',
                    'Respect cooldowns between attempts to avoid rushed retries.',
                  ]}
                  renderItem={(item) => (
                    <List.Item>
                      <Text type="secondary">{item}</Text>
                    </List.Item>
                  )}
                />
              </Card>
            </Space>
          </Col>
        </Row>

        {/* Details drawer */}
        <Drawer
          title="Exam attempt details"
          width={520}
          open={!!selectedAttempt}
          onClose={handleCloseDetails}
          destroyOnClose
        >
          {selectedAttempt ? (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div>
                <Title level={4}>{selectedAttempt.certificationPathName}</Title>
                <Text type="secondary">
                  Attempt #{selectedAttempt.attemptNumber} ·{' '}
                  {formatDateTime(selectedAttempt.takenAt)}
                </Text>
              </div>

              <Space size={16}>
                <Statistic
                  title="Score"
                  value={selectedAttempt.scorePercent ?? 0}
                  suffix="%"
                />
                <Statistic
                  title="Pass threshold"
                  value={CERT_PASS_PERCENT}
                  suffix="%"
                />
              </Space>

              <Space direction="vertical" size={8}>
                <Text strong>Status</Text>
                {getStatusTag(selectedAttempt)}
                {getAppealTag(selectedAttempt)}
              </Space>

              <Space direction="vertical" size={8}>
                <Text strong>Validation & review</Text>
                <Space direction="vertical" size={4}>
                  <Text>
                    Peer validation required:{' '}
                    {selectedAttempt.peerValidationRequired ? 'Yes' : 'No'}
                  </Text>
                  <Text>
                    Peer validation status:{' '}
                    {selectedAttempt.peerValidationStatus ?? '—'}
                  </Text>
                  <Text>Appeal status: {selectedAttempt.appealStatus ?? 'none'}</Text>
                </Space>
              </Space>

              <Space direction="vertical" size={8}>
                <Text strong>Delivery & conditions</Text>
                <Space direction="vertical" size={4}>
                  <Text>Mode: {selectedAttempt.deliveryMode}</Text>
                  <Text>Proctored: {selectedAttempt.proctored ? 'Yes' : 'No'}</Text>
                </Space>
              </Space>

              <Space direction="vertical" size={8}>
                <Text strong>Linked assets</Text>
                <Space>
                  <Button
                    icon={<FilePdfOutlined />}
                    onClick={() => handleOpenCertificate(selectedAttempt)}
                    disabled={!selectedAttempt.certificateUrl}
                  >
                    Open certificate
                  </Button>
                  <Button
                    onClick={() => handleOpenPortfolio(selectedAttempt)}
                    disabled={!selectedAttempt.portfolioUrl}
                  >
                    View portfolio entry
                  </Button>
                </Space>
              </Space>

              {selectedAttempt.nextRetryAt && (
                <Alert
                  type={selectedAttempt.canRetry ? 'success' : 'info'}
                  showIcon
                  message={
                    selectedAttempt.canRetry
                      ? 'You can start a new attempt now.'
                      : 'Retry cooldown in effect for this path.'
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      <Text>
                        Next retry available: {formatDateTime(selectedAttempt.nextRetryAt)}
                      </Text>
                      <Text type="secondary">
                        Global cooldown: {EXAM_RETRY_COOLDOWN_MIN} minutes between attempts
                        on the same path.
                      </Text>
                    </Space>
                  }
                />
              )}

              <Space>
                <Button
                  type="default"
                  icon={<WarningOutlined />}
                  loading={appealLoadingId === selectedAttempt.id}
                  onClick={() => handleOpenAppeal(selectedAttempt)}
                  disabled={selectedAttempt.appealStatus === 'open'}
                >
                  Open appeal
                </Button>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  loading={retryLoadingId === selectedAttempt.id}
                  onClick={() => handleRetry(selectedAttempt)}
                  disabled={!selectedAttempt.canRetry}
                >
                  Start new attempt
                </Button>
              </Space>
            </Space>
          ) : (
            <Spin />
          )}
        </Drawer>
      </Space>
    </KonnectedPageShell>
  )
}

export default ExamDashboardResultsPage
