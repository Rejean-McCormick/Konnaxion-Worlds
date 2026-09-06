// FILE: frontend/app/ethikos/learn/guides/page.tsx
'use client'

import { LinkOutlined, ReadOutlined, SyncOutlined } from '@ant-design/icons'
import { Pie } from '@ant-design/plots'
import {
  PageContainer,
  ProCard,
  StatisticCard,
} from '@ant-design/pro-components'
import { useRequest } from 'ahooks'
import {
  Anchor,
  Button,
  Empty,
  FloatButton,
  Input,
  message,
  Space,
  Tag,
  Typography,
} from 'antd'
import { useMemo, useState } from 'react'

import EthikosPageShell from '@/app/ethikos/EthikosPageShell'
import { fetchGuides, type GuideSection } from '@/services/learn'

type GuidesPayload = {
  sections: GuideSection[]
}

type EnrichedGuideSection = GuideSection & {
  wc: number
  minutes: number
}

type PieDatum = {
  type: string
  value: number
}

function wordsOf(text: string): number {
  if (!text) {
    return 0
  }

  const matches = text.trim().match(/\S+/g)

  return matches ? matches.length : 0
}

async function copySectionLink(id: string): Promise<void> {
  const hash = `#${id}`
  const absoluteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}${hash}`
      : hash

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(absoluteUrl)
      message.success('Section link copied')
      return
    }

    message.info('Clipboard is not available in this browser context')
  } catch {
    message.error('Unable to copy the section link')
  }
}

export default function Guides(): JSX.Element {
  const [query, setQuery] = useState('')

  const { data, loading, error, refresh } = useRequest<GuidesPayload, []>(
    fetchGuides,
  )

  const sections = data?.sections ?? []

  const computed = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const enriched: EnrichedGuideSection[] = sections.map((section) => {
      const wc = wordsOf(section.content)
      const minutes = Math.max(1, Math.round(wc / 220))

      return {
        ...section,
        wc,
        minutes,
      }
    })

    const filtered = normalizedQuery
      ? enriched.filter((section) => {
          const title = section.title.toLowerCase()
          const content = section.content.toLowerCase()

          return (
            title.includes(normalizedQuery) ||
            content.includes(normalizedQuery)
          )
        })
      : enriched

    const totals = filtered.reduce(
      (acc, section) => {
        acc.words += section.wc
        acc.minutes += section.minutes
        return acc
      },
      { words: 0, minutes: 0 },
    )

    const pieData: PieDatum[] = filtered.map((section) => ({
      type: section.title,
      value: section.wc || 1,
    }))

    const anchorItems = filtered.map((section) => ({
      key: section.id,
      href: `#${section.id}`,
      title: section.title,
    }))

    return {
      filtered,
      totals,
      pieData,
      anchorItems,
    }
  }, [sections, query])

  const pieConfig = useMemo(
    () => ({
      data: computed.pieData,
      angleField: 'value',
      colorField: 'type',
      radius: 0.8,
      label: {
        text: 'type',
        position: 'outside' as const,
      },
      legend: {
        color: {
          position: 'bottom' as const,
        },
      },
    }),
    [computed.pieData],
  )

  const shellProps = {
    title: 'Guides',
    sectionLabel: 'Learn',
    subtitle:
      'Practical walkthroughs for using ethiKos: when to launch a debate, choosing Elite vs Public, and how outcomes flow into impact.',
  } as const

  if (error) {
    return (
      <EthikosPageShell {...shellProps}>
        <PageContainer ghost>
          <Empty
            description="Failed to load guides"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={() => refresh()}
            >
              Retry
            </Button>
          </Empty>
        </PageContainer>
      </EthikosPageShell>
    )
  }

  const headerStats = (
    <Space wrap>
      <Tag icon={<ReadOutlined />}>{sections.length} sections</Tag>
      <Tag>{computed.totals.words} words</Tag>
      <Tag>{computed.totals.minutes} min reading</Tag>
    </Space>
  )

  return (
    <EthikosPageShell {...shellProps} secondaryActions={headerStats}>
      <PageContainer ghost loading={loading}>
        <ProCard gutter={16} wrap>
          <ProCard
            colSpan={{ xs: 24, sm: 24, md: 7, lg: 6, xl: 6 }}
            title="Navigate guides"
          >
            <Input.Search
              placeholder="Filter guides…"
              allowClear
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              style={{ marginBottom: 16 }}
            />

            <Anchor
              affix={false}
              items={computed.anchorItems}
              style={{ maxHeight: 360, overflow: 'auto' }}
            />

            <Typography.Paragraph
              type="secondary"
              style={{ marginTop: 16, marginBottom: 0 }}
            >
              {computed.filtered.length} guide
              {computed.filtered.length === 1 ? '' : 's'} match your filter.
            </Typography.Paragraph>
          </ProCard>

          <ProCard
            colSpan={{ xs: 24, sm: 24, md: 17, lg: 18, xl: 18 }}
            title="Guided flows"
          >
            <StatisticCard.Group style={{ marginBottom: 16 }}>
              <StatisticCard
                statistic={{
                  title: 'Sections',
                  value: computed.filtered.length,
                }}
              />
              <StatisticCard
                statistic={{
                  title: 'Words',
                  value: computed.totals.words,
                }}
              />
              <StatisticCard
                statistic={{
                  title: 'Estimated reading time',
                  value: computed.totals.minutes,
                  suffix: 'min',
                }}
              />
            </StatisticCard.Group>

            {sections.length === 0 && !loading ? (
              <Empty description="No guides available yet." />
            ) : computed.filtered.length === 0 ? (
              <Empty description="No guides match your query." />
            ) : (
              <>
                <ProCard
                  ghost
                  style={{ marginBottom: 16 }}
                  title="Guide size breakdown"
                >
                  <Pie {...pieConfig} />
                </ProCard>

                {computed.filtered.map((section) => (
                  <section
                    key={section.id}
                    id={section.id}
                    style={{ marginBottom: 32 }}
                  >
                    <Space align="baseline" size="middle" wrap>
                      <Typography.Title level={3} style={{ marginTop: 0 }}>
                        {section.title}
                      </Typography.Title>

                      <Tag>{section.minutes} min</Tag>

                      <Button
                        type="text"
                        size="small"
                        icon={<LinkOutlined />}
                        onClick={() => void copySectionLink(section.id)}
                      >
                        Copy link
                      </Button>
                    </Space>

                    <Typography.Paragraph style={{ whiteSpace: 'pre-line' }}>
                      {section.content}
                    </Typography.Paragraph>
                  </section>
                ))}
              </>
            )}
          </ProCard>
        </ProCard>

        <FloatButton.BackTop visibilityHeight={240} />
      </PageContainer>
    </EthikosPageShell>
  )
}