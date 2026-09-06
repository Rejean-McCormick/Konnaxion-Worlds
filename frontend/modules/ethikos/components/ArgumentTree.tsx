// FILE: frontend/modules/ethikos/components/ArgumentTree.tsx
'use client'

import {
  BranchesOutlined,
  DownOutlined,
  MessageOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Empty,
  Skeleton,
  Space,
  Tag,
  Tooltip,
} from 'antd'
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react'

import type { ArgumentSide, EthikosArgumentApi } from '@/services/ethikos'

export type ArgumentTreeSide = ArgumentSide | 'neutral' | null

export type ArgumentTreeItem = {
  id: string
  body: string
  author?: string | number | null
  side?: ArgumentTreeSide
  parent?: string | number | null
  createdAt?: string | null
  updatedAt?: string | null
  isHidden?: boolean

  sourceCount?: number | string | null
  impactVoteCount?: number | string | null
  suggestionCount?: number | string | null

  raw?: unknown
}

export type ArgumentTreeNode = Omit<
  ArgumentTreeItem,
  'author' | 'parent' | 'sourceCount' | 'impactVoteCount' | 'suggestionCount'
> & {
  author: string
  parent: string | null
  side: ArgumentTreeSide
  sourceCount?: number
  impactVoteCount?: number
  suggestionCount?: number
  children: ArgumentTreeNode[]
  depth: number
}

export type ArgumentTreeProps = {
  items?: ArgumentTreeItem[]
  arguments?: EthikosArgumentApi[]

  loading?: boolean
  emptyText?: ReactNode
  selectedId?: string | number | null
  defaultCollapsedIds?: Array<string | number>
  hideHidden?: boolean
  maxDepth?: number
  showMeta?: boolean
  showCounts?: boolean

  onSelect?: (item: ArgumentTreeNode) => void
  onReply?: (item: ArgumentTreeNode) => void

  renderActions?: (item: ArgumentTreeNode) => ReactNode
  renderMeta?: (item: ArgumentTreeNode) => ReactNode
  renderAuthor?: (item: ArgumentTreeNode) => ReactNode
  renderBody?: (item: ArgumentTreeNode) => ReactNode
}

type CountableArgumentApi = EthikosArgumentApi & {
  body?: string | null
  author?: string | number | null
  parent_id?: number | string | null
  user_display?: string | null
  source_count?: number | string | null
  impact_vote_count?: number | string | null
  suggestion_count?: number | string | null
}

const DEFAULT_MAX_DEPTH = 8
const EMPTY_COLLAPSED_IDS: Array<string | number> = []
const secondaryTextStyle = { color: '#8c8c8c' } as const
const strongTextStyle = { fontWeight: 600 } as const

function stringId(value: string | number | null | undefined): string | null {
  if (value == null || value === '') {
    return null
  }

  return String(value)
}

function normalizeText(value: unknown, fallback = ''): string {
  if (value == null) {
    return fallback
  }

  return String(value)
}

function numericCount(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

function normalizeSide(value: unknown): ArgumentTreeSide {
  if (value === 'pro' || value === 'con' || value === 'neutral') {
    return value
  }

  return null
}

function normalizeAuthor(
  value: string | number | null | undefined,
  fallback?: string | number | null,
): string {
  if (value != null && value !== '') {
    return String(value)
  }

  if (fallback != null && fallback !== '') {
    return String(fallback)
  }

  return 'Anonymous'
}

function normalizeApiArgument(arg: CountableArgumentApi): ArgumentTreeNode {
  const parent = arg.parent != null ? arg.parent : arg.parent_id
  const body = arg.content ?? arg.body ?? ''

  return {
    id: String(arg.id),
    body: normalizeText(body),
    author: normalizeAuthor(arg.user_display ?? null, arg.user ?? arg.author),
    side: normalizeSide(arg.side),
    parent: stringId(parent),
    createdAt: arg.created_at ?? null,
    updatedAt: arg.updated_at ?? null,
    isHidden: Boolean(arg.is_hidden),
    sourceCount: numericCount(arg.source_count),
    impactVoteCount: numericCount(arg.impact_vote_count),
    suggestionCount: numericCount(arg.suggestion_count),
    raw: arg,
    children: [],
    depth: 0,
  }
}

function normalizeItem(item: ArgumentTreeItem): ArgumentTreeNode {
  return {
    ...item,
    id: String(item.id),
    body: normalizeText(item.body),
    author: normalizeAuthor(item.author),
    parent: stringId(item.parent),
    side: normalizeSide(item.side),
    isHidden: Boolean(item.isHidden),
    sourceCount: numericCount(item.sourceCount),
    impactVoteCount: numericCount(item.impactVoteCount),
    suggestionCount: numericCount(item.suggestionCount),
    children: [],
    depth: 0,
  }
}

function normalizeTreeItems(
  items?: ArgumentTreeItem[],
  apiArguments?: EthikosArgumentApi[],
): ArgumentTreeNode[] {
  if (items) {
    return items.map(normalizeItem)
  }

  return (apiArguments ?? []).map((arg) =>
    normalizeApiArgument(arg as CountableArgumentApi),
  )
}

function compareByDate(a: ArgumentTreeNode, b: ArgumentTreeNode): number {
  const left = a.createdAt ? Date.parse(a.createdAt) : 0
  const right = b.createdAt ? Date.parse(b.createdAt) : 0

  if (left !== right) {
    return left - right
  }

  return a.id.localeCompare(b.id)
}

function buildTree(
  flatItems: ArgumentTreeNode[],
  options: {
    hideHidden: boolean
    maxDepth: number
  },
): ArgumentTreeNode[] {
  const visibleItems = options.hideHidden
    ? flatItems.filter((item) => !item.isHidden)
    : flatItems

  const nodeById = new Map<string, ArgumentTreeNode>()
  const roots: ArgumentTreeNode[] = []

  for (const item of visibleItems) {
    nodeById.set(item.id, {
      ...item,
      children: [],
      depth: 0,
    })
  }

  for (const node of Array.from(nodeById.values())) {
    const parentId = node.parent

    if (!parentId || parentId === node.id) {
      roots.push(node)
      continue
    }

    const parent = nodeById.get(parentId)

    if (!parent) {
      roots.push(node)
      continue
    }

    parent.children.push(node)
  }

  function assignDepth(
    nodes: ArgumentTreeNode[],
    depth: number,
    seen: Set<string>,
  ): ArgumentTreeNode[] {
    return [...nodes]
      .sort(compareByDate)
      .map((node) => {
        const nextDepth = Math.min(depth, options.maxDepth)

        if (seen.has(node.id)) {
          return {
            ...node,
            depth: nextDepth,
            children: [],
          }
        }

        const nextSeen = new Set(seen)
        nextSeen.add(node.id)

        return {
          ...node,
          depth: nextDepth,
          children:
            depth >= options.maxDepth
              ? []
              : assignDepth(node.children, depth + 1, nextSeen),
        }
      })
  }

  return assignDepth(roots, 0, new Set())
}

function formatDate(value?: string | null): string | null {
  if (!value) return null

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null

  return parsed.toLocaleString()
}

function sideTag(side: ArgumentTreeSide): ReactNode {
  if (side === 'pro') {
    return <Tag color="green">Pro</Tag>
  }

  if (side === 'con') {
    return <Tag color="red">Con</Tag>
  }

  if (side === 'neutral') {
    return <Tag>Neutral</Tag>
  }

  return <Tag>Argument</Tag>
}

function collectExpandableIds(nodes: ArgumentTreeNode[]): string[] {
  const ids: string[] = []

  function visit(node: ArgumentTreeNode) {
    if (node.children.length > 0) {
      ids.push(node.id)
    }

    node.children.forEach(visit)
  }

  nodes.forEach(visit)
  return ids
}

function countHidden(items: ArgumentTreeNode[]): number {
  return items.filter((item) => item.isHidden).length
}

function hasPositiveCount(value?: number): boolean {
  return typeof value === 'number' && value > 0
}

function CountMeta({ node }: { node: ArgumentTreeNode }) {
  const hasSources = hasPositiveCount(node.sourceCount)
  const hasVotes = hasPositiveCount(node.impactVoteCount)
  const hasSuggestions = hasPositiveCount(node.suggestionCount)

  if (!hasSources && !hasVotes && !hasSuggestions) {
    return null
  }

  return (
    <>
      {hasSources && <Tag>{node.sourceCount} sources</Tag>}
      {hasVotes && <Tag>{node.impactVoteCount} impact votes</Tag>}
      {hasSuggestions && <Tag>{node.suggestionCount} suggestions</Tag>}
    </>
  )
}

function collapsedIdSet(ids: Array<string | number>): Set<string> {
  return new Set(ids.map(String))
}

export default function ArgumentTree({
  items,
  arguments: apiArguments,
  loading = false,
  emptyText = 'No arguments yet.',
  selectedId = null,
  defaultCollapsedIds = EMPTY_COLLAPSED_IDS,
  hideHidden = true,
  maxDepth = DEFAULT_MAX_DEPTH,
  showMeta = true,
  showCounts = true,
  onSelect,
  onReply,
  renderActions,
  renderMeta,
  renderAuthor,
  renderBody,
}: ArgumentTreeProps) {
  const selectedKey = selectedId == null ? null : String(selectedId)
  const safeMaxDepth = Math.max(0, Math.floor(maxDepth))

  const flatItems = useMemo(
    () => normalizeTreeItems(items, apiArguments),
    [items, apiArguments],
  )

  const hiddenCount = useMemo(() => countHidden(flatItems), [flatItems])

  const tree = useMemo(
    () =>
      buildTree(flatItems, {
        hideHidden,
        maxDepth: safeMaxDepth,
      }),
    [flatItems, hideHidden, safeMaxDepth],
  )

  const expandableIds = useMemo(() => collectExpandableIds(tree), [tree])

  const collapsedIdsKey = useMemo(
    () => defaultCollapsedIds.map(String).join('|'),
    [defaultCollapsedIds],
  )

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() =>
    collapsedIdSet(defaultCollapsedIds),
  )

  useEffect(() => {
    setCollapsedIds(collapsedIdSet(defaultCollapsedIds))
  }, [collapsedIdsKey, defaultCollapsedIds])

  const hasArguments = tree.length > 0

  function toggleCollapsed(id: string) {
    setCollapsedIds((current) => {
      if (current.has(id)) {
        return new Set(Array.from(current).filter((currentId) => currentId !== id))
      }

      const next = new Set(current)
      next.add(id)
      return next
    })
  }

  function expandAll() {
    setCollapsedIds(new Set())
  }

  function collapseAll() {
    setCollapsedIds(new Set(expandableIds))
  }

  if (loading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 5 }} />
      </Card>
    )
  }

  if (!hasArguments) {
    return (
      <Card>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
      </Card>
    )
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Space size={8} wrap>
          <BranchesOutlined />
          <span style={strongTextStyle}>Argument tree</span>
          <span style={secondaryTextStyle}>({tree.length} roots)</span>
          <span style={secondaryTextStyle}>({flatItems.length} total)</span>
          {hideHidden && hiddenCount > 0 && (
            <Tooltip title="Hidden arguments are excluded from this tree.">
              <Tag>{hiddenCount} hidden</Tag>
            </Tooltip>
          )}
        </Space>

        {expandableIds.length > 0 && (
          <Space size={8}>
            <Button size="small" onClick={expandAll}>
              Expand all
            </Button>
            <Button size="small" onClick={collapseAll}>
              Collapse all
            </Button>
          </Space>
        )}
      </div>

      <div role="tree" aria-label="Argument tree">
        {tree.map((node) => (
          <ArgumentTreeRow
            key={node.id}
            node={node}
            selectedId={selectedKey}
            collapsedIds={collapsedIds}
            showMeta={showMeta}
            showCounts={showCounts}
            onToggleCollapsed={toggleCollapsed}
            onSelect={onSelect}
            onReply={onReply}
            renderActions={renderActions}
            renderMeta={renderMeta}
            renderAuthor={renderAuthor}
            renderBody={renderBody}
          />
        ))}
      </div>
    </div>
  )
}

type ArgumentTreeRowProps = {
  node: ArgumentTreeNode
  selectedId?: string | null
  collapsedIds: Set<string>
  showMeta: boolean
  showCounts: boolean
  onToggleCollapsed: (id: string) => void
  onSelect?: (item: ArgumentTreeNode) => void
  onReply?: (item: ArgumentTreeNode) => void
  renderActions?: (item: ArgumentTreeNode) => ReactNode
  renderMeta?: (item: ArgumentTreeNode) => ReactNode
  renderAuthor?: (item: ArgumentTreeNode) => ReactNode
  renderBody?: (item: ArgumentTreeNode) => ReactNode
}

function ArgumentTreeRow({
  node,
  selectedId,
  collapsedIds,
  showMeta,
  showCounts,
  onToggleCollapsed,
  onSelect,
  onReply,
  renderActions,
  renderMeta,
  renderAuthor,
  renderBody,
}: ArgumentTreeRowProps) {
  const isCollapsed = collapsedIds.has(node.id)
  const isSelected = selectedId === node.id
  const hasChildren = node.children.length > 0
  const createdAt = formatDate(node.createdAt)

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!onSelect) {
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(node)
    }
  }

  return (
    <div
      role="treeitem"
      aria-expanded={hasChildren ? !isCollapsed : undefined}
      aria-selected={isSelected}
      tabIndex={onSelect ? 0 : -1}
      onKeyDown={handleKeyDown}
      style={{
        marginLeft: node.depth > 0 ? 20 : 0,
        marginTop: 8,
      }}
    >
      <Card
        size="small"
        hoverable={Boolean(onSelect)}
        onClick={() => onSelect?.(node)}
        style={{
          borderLeft:
            node.side === 'pro'
              ? '4px solid #52c41a'
              : node.side === 'con'
                ? '4px solid #ff4d4f'
                : '4px solid #d9d9d9',
          background: isSelected ? '#f0f7ff' : undefined,
          opacity: node.isHidden ? 0.72 : 1,
        }}
        styles={{
          body: {
            padding: 12,
          },
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
          }}
        >
          <div style={{ width: 24, paddingTop: 2 }}>
            {hasChildren ? (
              <Tooltip title={isCollapsed ? 'Expand replies' : 'Collapse replies'}>
                <Button
                  type="text"
                  size="small"
                  icon={isCollapsed ? <RightOutlined /> : <DownOutlined />}
                  aria-label={isCollapsed ? 'Expand replies' : 'Collapse replies'}
                  onClick={(event) => {
                    event.stopPropagation()
                    onToggleCollapsed(node.id)
                  }}
                />
              </Tooltip>
            ) : (
              <MessageOutlined style={secondaryTextStyle} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <Space
              size={8}
              wrap
              style={{
                marginBottom: 6,
              }}
            >
              {sideTag(node.side)}
              {node.isHidden && <Tag color="default">Hidden</Tag>}
              {renderAuthor ? (
                renderAuthor(node)
              ) : (
                <span style={strongTextStyle}>{node.author}</span>
              )}
              {showMeta && createdAt && (
                <span style={secondaryTextStyle}>{createdAt}</span>
              )}
              {showMeta && renderMeta?.(node)}
              {showCounts && <CountMeta node={node} />}
            </Space>

            {renderBody ? (
              renderBody(node)
            ) : (
              <p
                style={{
                  marginTop: 0,
                  marginBottom: 8,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {node.body}
              </p>
            )}

            <Space
              size={8}
              wrap
              onClick={(event) => {
                event.stopPropagation()
              }}
            >
              {onReply && (
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    onReply(node)
                  }}
                >
                  Reply
                </Button>
              )}

              {hasChildren && (
                <span style={secondaryTextStyle}>
                  {node.children.length}{' '}
                  {node.children.length === 1 ? 'reply' : 'replies'}
                </span>
              )}

              {renderActions?.(node)}
            </Space>
          </div>
        </div>
      </Card>

      {hasChildren && !isCollapsed && (
        <div role="group">
          {node.children.map((child) => (
            <ArgumentTreeRow
              key={child.id}
              node={child}
              selectedId={selectedId}
              collapsedIds={collapsedIds}
              showMeta={showMeta}
              showCounts={showCounts}
              onToggleCollapsed={onToggleCollapsed}
              onSelect={onSelect}
              onReply={onReply}
              renderActions={renderActions}
              renderMeta={renderMeta}
              renderAuthor={renderAuthor}
              renderBody={renderBody}
            />
          ))}
        </div>
      )}
    </div>
  )
}