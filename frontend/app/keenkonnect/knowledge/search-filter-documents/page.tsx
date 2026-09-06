// FILE: frontend/app/keenkonnect/knowledge/search-filter-documents/page.tsx
'use client'

import type { ProColumns } from '@ant-design/pro-components'
import {
  ProFormDateRangePicker,
  ProFormSelect,
  ProFormText,
  ProTable,
  QueryFilter,
} from '@ant-design/pro-components'
import { Alert, Card, Pagination, Tag } from 'antd'
import type { PaginationProps } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import React, { useMemo, useState } from 'react'

import KeenPage from '@/app/keenkonnect/KeenPageShell'

interface DocumentResource {
  key: string
  title: string
  snippet: string
  author: string
  tags: string[]
  language: string
  version: string
  lastUpdated: string // ISO date
  relevanceScore: number
}

type DateRangeValue = [Dayjs, Dayjs] | undefined
type SortOption = 'relevance' | 'date' | 'popularity'

interface FilterState {
  keyword?: string
  authors?: string[]
  tags?: string[]
  language?: string
  dateRange?: DateRangeValue
  sort: SortOption
}

// Declared preview dataset: no general knowledge-document search contract exists.
const PREVIEW_DOCUMENTS: DocumentResource[] = [
  {
    key: '1',
    title: 'Robotics Blueprint',
    snippet: 'Detailed blueprint for advanced robotics design.',
    author: 'Alice',
    tags: ['Robotics', 'Engineering'],
    language: 'English',
    version: '1.0',
    lastUpdated: '2023-09-01',
    relevanceScore: 95,
  },
  {
    key: '2',
    title: 'AI Ethics Guidelines',
    snippet: 'Comprehensive guidelines for ethical AI development.',
    author: 'Bob',
    tags: ['AI', 'Ethics'],
    language: 'English',
    version: '2.0',
    lastUpdated: '2023-08-15',
    relevanceScore: 90,
  },
  {
    key: '3',
    title: 'Healthcare Innovation Report',
    snippet: 'Annual report on innovation in healthcare technologies.',
    author: 'Charlie',
    tags: ['Healthcare', 'Innovation'],
    language: 'French',
    version: '1.2',
    lastUpdated: '2023-07-20',
    relevanceScore: 88,
  },
  {
    key: '4',
    title: 'Environmental Impact Study',
    snippet: 'Study on environmental impact of industrial activities.',
    author: 'Diana',
    tags: ['Environment', 'Sustainability'],
    language: 'English',
    version: '1.3',
    lastUpdated: '2023-06-10',
    relevanceScore: 85,
  },
  {
    key: '5',
    title: 'Quantum Computing Overview',
    snippet: 'Introduction to quantum computing concepts and applications.',
    author: 'Alice',
    tags: ['Quantum', 'Computing'],
    language: 'English',
    version: '1.1',
    lastUpdated: '2023-05-05',
    relevanceScore: 92,
  },
]

const allAuthors = Array.from(new Set(PREVIEW_DOCUMENTS.map((d) => d.author))).sort()
const allTags = Array.from(new Set(PREVIEW_DOCUMENTS.flatMap((d) => d.tags))).sort()
const allLanguages = Array.from(new Set(PREVIEW_DOCUMENTS.map((d) => d.language))).sort()

const DEFAULT_SORT: SortOption = 'relevance'

export default function SearchFilterDocumentsPage(): JSX.Element {
  const [filters, setFilters] = useState<FilterState>({
    sort: DEFAULT_SORT,
  })
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(5)

  const handleFilterFinish = async (values: unknown) => {
    const formValues =
      values && typeof values === 'object'
        ? (values as {
            keyword?: string;
            authors?: string[];
            tags?: string[];
            language?: string;
            dateRange?: DateRangeValue;
            sort?: SortOption;
          })
        : {};

    const nextFilters: FilterState = {
      keyword: formValues.keyword?.trim() || undefined,
      authors: formValues.authors ?? [],
      tags: formValues.tags ?? [],
      language: formValues.language || undefined,
      dateRange: formValues.dateRange,
      sort: formValues.sort ?? DEFAULT_SORT,
    }

    setFilters(nextFilters)
    setCurrentPage(1)

    // ProForm expects a boolean from onFinish
    return true
  }

  const handleFilterReset = () => {
    setFilters({ sort: DEFAULT_SORT })
    setCurrentPage(1)
  }

  const filteredDocuments = useMemo(() => {
    const { keyword, authors, tags, language, dateRange } = filters

    return PREVIEW_DOCUMENTS.filter((doc) => {
      const matchesKeyword =
        !keyword ||
        doc.title.toLowerCase().includes(keyword.toLowerCase()) ||
        doc.snippet.toLowerCase().includes(keyword.toLowerCase())

      const matchesAuthor =
        !authors || authors.length === 0 || authors.includes(doc.author)

      const matchesTags =
        !tags || tags.length === 0 || tags.every((t) => doc.tags.includes(t))

      const matchesLanguage = !language || doc.language === language

      let matchesDate = true
      if (dateRange && dateRange[0] && dateRange[1]) {
        const [start, end] = dateRange
        const docDate = dayjs(doc.lastUpdated)

        if (start) {
          matchesDate =
            docDate.isSame(start, 'day') || docDate.isAfter(start, 'day')
        }
        if (matchesDate && end) {
          matchesDate =
            docDate.isSame(end, 'day') || docDate.isBefore(end, 'day')
        }
      }

      return (
        matchesKeyword &&
        matchesAuthor &&
        matchesTags &&
        matchesLanguage &&
        matchesDate
      )
    })
  }, [filters])

  const sortedDocuments = useMemo(() => {
    const docs = [...filteredDocuments]
    const sort = filters.sort

    switch (sort) {
      case 'date':
        docs.sort(
          (a, b) =>
            new Date(b.lastUpdated).getTime() -
            new Date(a.lastUpdated).getTime(),
        )
        break
      case 'popularity':
        // Placeholder: reuse relevance score
        docs.sort((a, b) => b.relevanceScore - a.relevanceScore)
        break
      case 'relevance':
      default:
        docs.sort((a, b) => b.relevanceScore - a.relevanceScore)
        break
    }

    return docs
  }, [filteredDocuments, filters.sort])

  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return sortedDocuments.slice(start, end)
  }, [sortedDocuments, currentPage, pageSize])

  const total = sortedDocuments.length

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.keyword && filters.keyword.trim()) count++
    if (filters.authors && filters.authors.length > 0) count++
    if (filters.tags && filters.tags.length > 0) count++
    if (filters.language) count++
    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      count++
    }
    return count
  }, [filters])

  const columns: ProColumns<DocumentResource>[] = [
    {
      title: 'Title & Snippet',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.title}</div>
          <div
            style={{
              fontSize: 12,
              color: 'rgba(0,0,0,0.45)',
              marginTop: 4,
            }}
          >
            {record.snippet}
          </div>
        </div>
      ),
    },
    {
      title: 'Author',
      dataIndex: 'author',
      key: 'author',
      width: 140,
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      width: 220,
      render: (_, record) => (
        <>
          {record.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </>
      ),
    },
    {
      title: 'Language',
      dataIndex: 'language',
      key: 'language',
      width: 110,
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      width: 90,
    },
    {
      title: 'Last Updated',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      width: 140,
    },
    {
      title: 'Relevance',
      dataIndex: 'relevanceScore',
      key: 'relevanceScore',
      width: 120,
      sorter: (a, b) => a.relevanceScore - b.relevanceScore,
    },
  ]

  const paginationProps: PaginationProps = {
    current: currentPage,
    pageSize,
    total,
    showSizeChanger: true,
    pageSizeOptions: ['5', '10', '20'],
    showTotal: (totalItems, range) =>
      `${range[0]}-${range[1]} of ${totalItems} document${
        totalItems > 1 ? 's' : ''
      }`,
    onChange: (page, size) => {
      setCurrentPage(page)
      setPageSize(size || pageSize)
    },
  }

  const sortLabel = filters.sort
    .toString()
    .replace(/^\w/, (c) => c.toUpperCase())

  return (
    <KeenPage
      title="Search & Filter Documents"
      description="Advanced search and filtering for knowledge documents in KeenKonnect."
    >
      {/* Advanced filters (QueryFilter) */}
      <Card className="mb-4">
        <QueryFilter
          onFinish={handleFilterFinish}
          onReset={handleFilterReset}
          labelWidth="auto"
          defaultCollapsed={false}
          span={8}
          initialValues={{ sort: DEFAULT_SORT }}
        >
          <ProFormText
            name="keyword"
            label="Keywords"
            placeholder="Search by title or content"
          />

          <ProFormSelect
            name="authors"
            label="Authors"
            placeholder="Select authors"
            mode="multiple"
            options={allAuthors.map((a) => ({
              label: a,
              value: a,
            }))}
          />

          <ProFormSelect
            name="tags"
            label="Tags"
            placeholder="Select tags"
            mode="multiple"
            options={allTags.map((t) => ({
              label: t,
              value: t,
            }))}
          />

          <ProFormSelect
            name="language"
            label="Language"
            placeholder="All languages"
            allowClear
            options={allLanguages.map((lang) => ({
              label: lang,
              value: lang,
            }))}
          />

          <ProFormDateRangePicker
            name="dateRange"
            label="Last Updated"
            placeholder={['From', 'To']}
          />

          <ProFormSelect
            name="sort"
            label="Sort By"
            options={[
              { label: 'Relevance', value: 'relevance' },
              { label: 'Date', value: 'date' },
              { label: 'Popularity', value: 'popularity' },
            ]}
          />
        </QueryFilter>
      </Card>

      {/* Summary of results / filters */}
      <Alert
        type={total === 0 ? 'warning' : 'info'}
        showIcon
        className="mb-4"
        message={
          total === 0
            ? 'No documents match your criteria.'
            : `${total} document${total > 1 ? 's' : ''} match your criteria.`
        }
        description={
          <div style={{ fontSize: 12 }}>
            <div>
              Sort: <strong>{sortLabel}</strong>
            </div>
            <div>
              Active filters: <strong>{activeFilterCount}</strong>
            </div>
          </div>
        }
      />

      {/* Main table + external pagination */}
      <Card>
        <ProTable<DocumentResource>
          rowKey="key"
          columns={columns}
          dataSource={paginatedDocuments}
          search={false}
          options={false}
          pagination={false}
          rowSelection={false}
          toolBarRender={false}
        />

        {total > 0 && (
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Pagination {...paginationProps} />
          </div>
        )}
      </Card>
    </KeenPage>
  )
}
