'use client'

import { ProCard } from '@ant-design/pro-components'
import { Card, Col, Row, Space, Typography } from 'antd'

import ArgumentSourcesPanel from '@/modules/ethikos/components/ArgumentSourcesPanel'
import type { ArgumentTreeItem } from '@/modules/ethikos/components/ArgumentTree'
import DiscussionVisibilityPanel from '@/modules/ethikos/components/DiscussionVisibilityPanel'
import ImpactVoteControl from '@/modules/ethikos/components/ImpactVoteControl'
import SuggestionQueue from '@/modules/ethikos/components/SuggestionQueue'
import type {
  DiscussionParticipantRoleApi,
  EthikosId,
} from '@/services/ethikos'

import EmptySelectionCard from './EmptySelectionCard'
import ParticipantRolesPanel from './ParticipantRolesPanel'

import { toSuggestionSide } from '../_lib/topicThreadUtils'

const { Text } = Typography

export default function KorumPanelsGrid({
  topicId,
  selectedArgument,
  selectedArgumentId,
  participantRoles,
  loadingParticipantRoles,
  refreshKey,
  onMutation,
  onRefreshParticipantRoles,
}: {
  topicId: EthikosId
  selectedArgument: ArgumentTreeItem | null
  selectedArgumentId: string | null
  participantRoles: DiscussionParticipantRoleApi[]
  loadingParticipantRoles: boolean
  refreshKey: number
  onMutation: () => void
  onRefreshParticipantRoles: () => void
}): JSX.Element {
  return (
    <ProCard
      title="Argument details and follow-up"
      subTitle="Select an argument to attach sources, record impact signals, or suggest a refinement."
      ghost
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12} xl={6}>
          {selectedArgumentId ? (
            <ArgumentSourcesPanel
              argumentId={selectedArgumentId}
              compact
              refreshKey={refreshKey}
              onCreated={onMutation}
            />
          ) : (
            <EmptySelectionCard
              title="Sources"
              description="Select an argument to add references, citations, or supporting context."
            />
          )}
        </Col>

        <Col xs={24} lg={12} xl={6}>
          {selectedArgumentId ? (
            <Card size="small" title="Impact signal">
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Text type="secondary">
                  Rate the practical importance of the selected argument.
                </Text>

                <ImpactVoteControl
                  argumentId={selectedArgumentId}
                  onChange={onMutation}
                />

                <Text type="secondary">
                  This signal applies to the argument only. Your topic stance is
                  recorded separately.
                </Text>
              </Space>
            </Card>
          ) : (
            <EmptySelectionCard
              title="Impact signal"
              description="Select an argument to rate its practical importance."
            />
          )}
        </Col>

        <Col xs={24} lg={12} xl={6}>
          <SuggestionQueue
            topicId={topicId}
            parentId={selectedArgumentId}
            side={toSuggestionSide(selectedArgument?.side)}
            title="Suggested improvement"
            description={
              selectedArgument
                ? 'Suggest a reply, refinement, or missing nuance for the selected argument.'
                : 'Suggest a new top-level argument for review.'
            }
            onSubmitted={onMutation}
          />
        </Col>

        <Col xs={24} lg={12} xl={6}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <DiscussionVisibilityPanel
              topicId={topicId}
              editable
              compact
              onChange={onMutation}
            />

            <ParticipantRolesPanel
              roles={participantRoles}
              loading={loadingParticipantRoles}
              onRefresh={onRefreshParticipantRoles}
            />
          </Space>
        </Col>
      </Row>
    </ProCard>
  )
}