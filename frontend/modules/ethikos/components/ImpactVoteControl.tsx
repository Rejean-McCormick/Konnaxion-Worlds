// FILE: frontend/modules/ethikos/components/ImpactVoteControl.tsx
'use client'

import { Button, message, Space, Tooltip, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  fetchArgumentImpactVotes,
  submitArgumentImpactVote,
} from '@/services/ethikos'
import type {
  ArgumentImpactValue,
  ArgumentImpactVoteApi,
  EthikosId,
} from '@/services/ethikos'

const { Text } = Typography

const IMPACT_VALUES: ArgumentImpactValue[] = [0, 1, 2, 3, 4]

const IMPACT_LABELS: Record<ArgumentImpactValue, string> = {
  0: 'No impact',
  1: 'Low impact',
  2: 'Moderate impact',
  3: 'High impact',
  4: 'Very high impact',
}

export type ImpactVoteControlProps = {
  argumentId: EthikosId
  currentUserId?: EthikosId | null
  disabled?: boolean
  compact?: boolean
  showSummary?: boolean
  className?: string
  initialValue?: ArgumentImpactValue | null
  initialVotes?: ArgumentImpactVoteApi[]
  onChange?: (vote: ArgumentImpactVoteApi) => void
  onVotesLoaded?: (votes: ArgumentImpactVoteApi[]) => void
}

function hasArgumentId(argumentId: EthikosId): boolean {
  return argumentId != null && String(argumentId).trim() !== ''
}

function isImpactValue(value: number): value is ArgumentImpactValue {
  return Number.isInteger(value) && value >= 0 && value <= 4
}

function toImpactValue(value: unknown): ArgumentImpactValue | null {
  const numericValue = Number(value)
  return isImpactValue(numericValue) ? numericValue : null
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Unable to update impact vote.'
}

function userKey(value: EthikosId | string | number | null | undefined): string | null {
  if (value == null) {
    return null
  }

  const normalized = String(value).trim()
  return normalized.length > 0 ? normalized : null
}

function voteUserKey(vote: ArgumentImpactVoteApi): string | null {
  return userKey(vote.user_id ?? vote.user)
}

function findUserVote(
  votes: ArgumentImpactVoteApi[],
  currentUserId?: EthikosId | null,
): ArgumentImpactVoteApi | null {
  const currentUserKey = userKey(currentUserId)

  if (!currentUserKey) {
    return null
  }

  return votes.find((vote) => voteUserKey(vote) === currentUserKey) ?? null
}

function mergeSubmittedVote(
  votes: ArgumentImpactVoteApi[],
  submitted: ArgumentImpactVoteApi,
): ArgumentImpactVoteApi[] {
  const submittedUserKey = voteUserKey(submitted)

  if (!submittedUserKey) {
    return [submitted, ...votes]
  }

  let replaced = false

  const nextVotes = votes.map((vote) => {
    if (voteUserKey(vote) === submittedUserKey) {
      replaced = true
      return submitted
    }

    return vote
  })

  return replaced ? nextVotes : [submitted, ...nextVotes]
}

export default function ImpactVoteControl({
  argumentId,
  currentUserId = null,
  disabled = false,
  compact = false,
  showSummary = true,
  className,
  initialValue = null,
  initialVotes,
  onChange,
  onVotesLoaded,
}: ImpactVoteControlProps) {
  const [votes, setVotes] = useState<ArgumentImpactVoteApi[]>(
    () => initialVotes ?? [],
  )
  const [selectedValue, setSelectedValue] =
    useState<ArgumentImpactValue | null>(initialValue)
  const [loading, setLoading] = useState(false)
  const [submittingValue, setSubmittingValue] =
    useState<ArgumentImpactValue | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const mountedRef = useRef(false)
  const requestIdRef = useRef(0)
  const onChangeRef = useRef(onChange)
  const onVotesLoadedRef = useRef(onVotesLoaded)

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onVotesLoadedRef.current = onVotesLoaded
  }, [onVotesLoaded])

  const applyLoadedVotes = useCallback(
    (loadedVotes: ArgumentImpactVoteApi[]) => {
      setVotes(loadedVotes)

      const currentUserVote = findUserVote(loadedVotes, currentUserId)
      const currentUserValue = currentUserVote
        ? toImpactValue(currentUserVote.value)
        : null

      if (currentUserValue !== null) {
        setSelectedValue(currentUserValue)
      }

      onVotesLoadedRef.current?.(loadedVotes)
    },
    [currentUserId],
  )

  const loadVotes = useCallback(async () => {
    if (!hasArgumentId(argumentId)) {
      setVotes([])
      setLoadError(null)
      return
    }

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    setLoading(true)
    setLoadError(null)

    try {
      const loadedVotes = await fetchArgumentImpactVotes(argumentId)

      if (!mountedRef.current || requestIdRef.current !== requestId) {
        return
      }

      applyLoadedVotes(loadedVotes)
    } catch (error) {
      if (!mountedRef.current || requestIdRef.current !== requestId) {
        return
      }

      setLoadError(errorMessage(error))
    } finally {
      if (mountedRef.current && requestIdRef.current === requestId) {
        setLoading(false)
      }
    }
  }, [argumentId, applyLoadedVotes])

  useEffect(() => {
    void loadVotes()
  }, [loadVotes])

  useEffect(() => {
    setSelectedValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    if (initialVotes === undefined) {
      return
    }

    setVotes(initialVotes)

    const currentUserVote = findUserVote(initialVotes, currentUserId)
    const currentUserValue = currentUserVote
      ? toImpactValue(currentUserVote.value)
      : null

    if (currentUserValue !== null) {
      setSelectedValue(currentUserValue)
    }
  }, [currentUserId, initialVotes])

  const summary = useMemo(() => {
    const validVotes = votes
      .map((vote) => toImpactValue(vote.value))
      .filter((value): value is ArgumentImpactValue => value !== null)

    const count = validVotes.length

    if (count === 0) {
      return {
        count: 0,
        average: null as number | null,
        label: 'No impact votes yet',
      }
    }

    const total = validVotes.reduce<number>((sum, value) => sum + value, 0)
    const average = total / count
    const rounded = Math.round(average)
    const roundedLabelValue = isImpactValue(rounded) ? rounded : 0

    return {
      count,
      average,
      label: `${average.toFixed(1)} / 4 · ${count} vote${
        count === 1 ? '' : 's'
      } · ${IMPACT_LABELS[roundedLabelValue]}`,
    }
  }, [votes])

  const handleVote = useCallback(
    async (value: ArgumentImpactValue) => {
      if (disabled || submittingValue !== null || !hasArgumentId(argumentId)) {
        return
      }

      setSubmittingValue(value)

      try {
        const submitted = await submitArgumentImpactVote(argumentId, value)

        if (!mountedRef.current) {
          return
        }

        setSelectedValue(value)
        setVotes((currentVotes) => mergeSubmittedVote(currentVotes, submitted))
        onChangeRef.current?.(submitted)

        message.success('Impact vote saved.')
      } catch (error) {
        if (mountedRef.current) {
          message.error(errorMessage(error))
        }
      } finally {
        if (mountedRef.current) {
          setSubmittingValue(null)
        }
      }
    },
    [argumentId, disabled, submittingValue],
  )

  return (
    <div className={className}>
      <Space direction="vertical" size={compact ? 4 : 8}>
        <Space size={compact ? 4 : 8} wrap>
          {IMPACT_VALUES.map((value) => {
            const selected = selectedValue === value
            const isSubmitting = submittingValue === value

            return (
              <Tooltip title={IMPACT_LABELS[value]} key={value}>
                <Button
                  size={compact ? 'small' : 'middle'}
                  type={selected ? 'primary' : 'default'}
                  loading={isSubmitting}
                  disabled={disabled || loading || submittingValue !== null}
                  aria-pressed={selected}
                  aria-label={`Set argument impact vote to ${value}: ${IMPACT_LABELS[value]}`}
                  onClick={() => void handleVote(value)}
                >
                  {value}
                </Button>
              </Tooltip>
            )
          })}
        </Space>

        {showSummary ? (
          <Text type={loadError ? 'danger' : 'secondary'}>
            {loadError ?? summary.label}
          </Text>
        ) : null}
      </Space>
    </div>
  )
}