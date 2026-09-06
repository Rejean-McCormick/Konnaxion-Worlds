'use client'

import { useRequest } from 'ahooks'
import { App } from 'antd'
import type { SegmentedValue } from 'antd/es/segmented'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import type { ArgumentTreeItem } from '@/modules/ethikos/components/ArgumentTree'
import { get } from '@/services/_request'
import {
  fetchTopicDetail,
  fetchTopicStances,
  submitTopicArgument,
  submitTopicStance,
} from '@/services/deliberate'
import type {
  TopicDetailResponse,
  TopicStance,
  TopicStanceValue,
} from '@/services/deliberate'
import { fetchDiscussionParticipantRoles } from '@/services/ethikos'
import type { ArgumentSide, DiscussionParticipantRoleApi } from '@/services/ethikos'

import {
  clampStance,
  computeStanceStats,
  isMine,
  toArgumentItems,
  toTopicParam,
} from '../_lib/topicThreadUtils'
import type { StanceStats, UserMeApi } from '../_lib/topicThreadUtils'

export interface TopicThreadController {
  topicId?: string
  pageData?: TopicDetailResponse
  pageError?: Error
  loading: boolean
  loadingPageData: boolean
  loadingParticipantRoles: boolean
  stats: StanceStats
  stanceValue: TopicStanceValue
  newArgument: string
  newArgumentSide: ArgumentSide
  replyTarget: ArgumentTreeItem | null
  selectedArgument: ArgumentTreeItem | null
  selectedArgumentId: string | null
  savingStance: boolean
  savingArgument: boolean
  argumentItems: ArgumentTreeItem[]
  participantRoles: DiscussionParticipantRoleApi[]
  korumRefreshKey: number
  setStanceValue: (value: TopicStanceValue) => void
  setNewArgument: (value: string) => void
  setReplyTarget: (argument: ArgumentTreeItem | null) => void
  setSelectedArgument: (argument: ArgumentTreeItem | null) => void
  refreshPageData: () => void
  refreshParticipantRoles: () => void
  handleKorumMutation: () => void
  handleSaveStance: () => Promise<void>
  handlePostArgument: () => Promise<void>
  handleSideChange: (value: SegmentedValue) => void
  handleReply: (argument: ArgumentTreeItem) => void
}

async function fetchOptionalMe(): Promise<UserMeApi | undefined> {
  try {
    return await get<UserMeApi>('users/me/')
  } catch {
    return undefined
  }
}

export function useTopicThreadController(): TopicThreadController {
  const { message } = App.useApp()

  const params = useParams<{ topic: string | string[] }>()
  const topicId = useMemo(() => toTopicParam(params?.topic), [params])

  const {
    data: pageData,
    loading: loadingPageData,
    refresh: refreshPageData,
    error: pageError,
  } = useRequest<TopicDetailResponse, []>(() => fetchTopicDetail(topicId!), {
    ready: Boolean(topicId),
    refreshDeps: [topicId],
  })

  const {
    data: stances,
    loading: loadingStances,
    refresh: refreshStances,
  } = useRequest<TopicStance[], []>(() => fetchTopicStances(topicId!), {
    ready: Boolean(topicId),
    refreshDeps: [topicId],
  })

  const {
    data: participantRoles,
    loading: loadingParticipantRoles,
    refresh: refreshParticipantRoles,
  } = useRequest<DiscussionParticipantRoleApi[], []>(
    () => fetchDiscussionParticipantRoles(topicId!),
    {
      ready: Boolean(topicId),
      refreshDeps: [topicId],
    },
  )

  const { data: me } = useRequest<UserMeApi | undefined, []>(fetchOptionalMe, {
    ready: Boolean(topicId),
    refreshDeps: [topicId],
  })

  const [stanceValue, setStanceValue] = useState<TopicStanceValue>(0)
  const [hydratedTopicId, setHydratedTopicId] = useState<string | null>(null)
  const [savingStance, setSavingStance] = useState(false)

  const [newArgument, setNewArgument] = useState('')
  const [newArgumentSide, setNewArgumentSide] = useState<ArgumentSide>('pro')
  const [replyTarget, setReplyTarget] = useState<ArgumentTreeItem | null>(null)
  const [selectedArgument, setSelectedArgument] =
    useState<ArgumentTreeItem | null>(null)
  const [savingArgument, setSavingArgument] = useState(false)
  const [korumRefreshKey, setKorumRefreshKey] = useState(0)

  const argumentItems = useMemo(() => toArgumentItems(pageData), [pageData])
  const selectedArgumentId = selectedArgument?.id ?? null

  useEffect(() => {
    setHydratedTopicId(null)
    setStanceValue(0)
    setNewArgument('')
    setReplyTarget(null)
    setSelectedArgument(null)
    setKorumRefreshKey((value) => value + 1)
  }, [topicId])

  useEffect(() => {
    if (!topicId || hydratedTopicId === topicId || !stances) return

    const mine = me ? stances.find((stance) => isMine(stance, me)) : undefined

    setStanceValue(mine ? clampStance(mine.value) : 0)
    setHydratedTopicId(topicId)
  }, [topicId, hydratedTopicId, me, stances])

  const stats = useMemo<StanceStats>(
    () => computeStanceStats(stances ?? []),
    [stances],
  )

  const loading = loadingPageData || loadingStances

  function handleKorumMutation(): void {
    setKorumRefreshKey((value) => value + 1)
    void refreshPageData()
  }

  const handleSaveStance = async (): Promise<void> => {
    if (!topicId) return

    setSavingStance(true)
    try {
      await submitTopicStance({
        topicId,
        value: stanceValue,
      })
      await refreshStances()
      message.success('Your stance has been recorded.')
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : 'Unable to save your stance right now.',
      )
    } finally {
      setSavingStance(false)
    }
  }

  const handlePostArgument = async (): Promise<void> => {
    if (!topicId) return

    const trimmed = newArgument.trim()
    if (!trimmed) {
      message.warning('Please enter an argument before posting.')
      return
    }

    setSavingArgument(true)
    try {
      await submitTopicArgument({
        topicId,
        body: trimmed,
        side: newArgumentSide,
        parentId: replyTarget?.id ?? null,
      })
      setNewArgument('')
      setReplyTarget(null)
      await refreshPageData()
      message.success(
        replyTarget
          ? 'Your reply has been added.'
          : 'Your argument has been added.',
      )
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : 'Unable to post your argument right now.',
      )
    } finally {
      setSavingArgument(false)
    }
  }

  const handleSideChange = (value: SegmentedValue): void => {
    setNewArgumentSide(value === 'con' ? 'con' : 'pro')
  }

  const handleReply = (argument: ArgumentTreeItem): void => {
    setReplyTarget(argument)
    setSelectedArgument(argument)
  }

  return {
    topicId,
    pageData,
    pageError: pageError instanceof Error ? pageError : undefined,
    loading,
    loadingPageData,
    loadingParticipantRoles,
    stats,
    stanceValue,
    newArgument,
    newArgumentSide,
    replyTarget,
    selectedArgument,
    selectedArgumentId,
    savingStance,
    savingArgument,
    argumentItems,
    participantRoles: participantRoles ?? [],
    korumRefreshKey,
    setStanceValue,
    setNewArgument,
    setReplyTarget,
    setSelectedArgument,
    refreshPageData,
    refreshParticipantRoles,
    handleKorumMutation,
    handleSaveStance,
    handlePostArgument,
    handleSideChange,
    handleReply,
  }
}