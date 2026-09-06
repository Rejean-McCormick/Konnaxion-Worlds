// FILE: frontend/app/konnected/teams-collaboration/my-teams/page.tsx
﻿// app/konnected/teams-collaboration/my-teams/page.tsx
'use client';

import {
  CalendarOutlined,
  DownOutlined,
  PlusOutlined,
  ProjectOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Avatar,
  Button,
  Col,
  Dropdown,
  Empty,
  Input,
  List,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { MenuProps, TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import { apiFetch } from '@/api';
import KonnectedPageShell from '@/app/konnected/KonnectedPageShell';

const { Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

type TeamRole = 'owner' | 'admin' | 'member' | 'observer';
type MembershipStatus = 'active' | 'invited' | 'request_pending';

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

// Aligned with backend MyTeams API contract (v14 spec)
interface MyTeamsApiTeam {
  id: string;
  name: string;
  project_title?: string | null;
  membership_role: TeamRole;
  membership_status?: MembershipStatus;
  members_count?: number;
  is_restricted?: boolean;
  recent_activity?: string[];
  members_preview?: TeamMember[];
}

interface TeamRow {
  key: string;
  teamId: string;
  teamName: string;
  projectName: string;
  userRole: TeamRole;
  membershipStatus: MembershipStatus;
  membersCount: number;
  isRestricted: boolean;
  roster: TeamMember[];
  recentActivity: string[];
}

// Backend endpoints as per v14 spec
const MY_TEAMS_ENDPOINT = '/api/keenkonnect/teams/my-teams/';
const LEAVE_TEAM_ENDPOINT = (teamId: string) =>
  `/api/keenkonnect/teams/${encodeURIComponent(teamId)}/leave/`;

/**
 * Normalizes API payload (array or { items }) into table rows.
 */
function mapToRows(payload: unknown): TeamRow[] {
  const rawItems: MyTeamsApiTeam[] = Array.isArray(payload)
    ? (payload as MyTeamsApiTeam[])
    : (payload as { items?: MyTeamsApiTeam[] })?.items ?? [];

  return rawItems.map((t) => {
    const roster = t.members_preview ?? ([] as TeamMember[]);

    return {
      key: t.id,
      teamId: t.id,
      teamName: t.name,
      projectName: t.project_title ?? '—',
      userRole: t.membership_role,
      membershipStatus: t.membership_status ?? 'active',
      membersCount: t.members_count ?? roster.length,
      isRestricted: Boolean(t.is_restricted),
      roster,
      recentActivity: t.recent_activity ?? [],
    };
  });
}

export default function MyTeamsPage(): JSX.Element {
  const router = useRouter();
  const { message } = App.useApp();

  const [loading, setLoading] = useState<boolean>(true);
  const [reloadFlag, setReloadFlag] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const [selectedTeamKeys, setSelectedTeamKeys] = useState<React.Key[]>([]);
  const [data, setData] = useState<TeamRow[]>([]);

  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | TeamRole>('all');
  const [statusFilter, setStatusFilter] =
    useState<'all' | MembershipStatus>('all');
  const [restrictedOnly, setRestrictedOnly] = useState(false);

  const [leavingTeamId, setLeavingTeamId] = useState<string | null>(null);

  // --- Load teams from backend ------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function loadTeams() {
      setLoading(true);
      setError(null);

      try {
        const res = await apiFetch(MY_TEAMS_ENDPOINT, {
          credentials: 'include',
          cache: 'no-store',
        });

        // Treat a 404 as "endpoint not wired yet / no teams" and degrade gracefully
        if (res.status === 404) {
          if (!cancelled) {
            setData([]);
          }
          return;
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }

        const json = await res.json();
        if (!cancelled) {
          const rows = mapToRows(json);
          setData(rows);
        }
      } catch (err) {
        if (!cancelled) {
           
          console.error('Failed to load teams', err);
          setError('Unable to load your teams right now. Please try again later.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTeams();

    return () => {
      cancelled = true;
    };
  }, [reloadFlag]);

  // --- Actions ----------------------------------------------------------------

  const handleLeaveTeam = async (team: TeamRow) => {
    if (team.userRole === 'owner') {
      message.warning(
        'You are the owner of this team. Transfer ownership before leaving.',
      );
      return;
    }

    setLeavingTeamId(team.teamId);
    try {
      const res = await apiFetch(LEAVE_TEAM_ENDPOINT(team.teamId), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      message.success(`You left ${team.teamName}.`);
      setData((prev) => prev.filter((row) => row.teamId !== team.teamId));
      setSelectedTeamKeys((prev) => prev.filter((key) => key !== team.key));
    } catch (err) {
       
      console.error('Failed to leave team', err);
      message.error('Could not leave the team. Please try again.');
    } finally {
      setLeavingTeamId(null);
    }
  };

  const handleViewTeam = (team: TeamRow) => {
    router.push(
      `/konnected/teams-collaboration/my-teams/${encodeURIComponent(
        team.teamId,
      )}`,
    );
  };

  const handleInviteMembers = (team: TeamRow) => {
    router.push(
      `/konnected/teams-collaboration/team-builder?teamId=${encodeURIComponent(
        team.teamId,
      )}&mode=invite`,
    );
  };

  // --- Filters & derived data -------------------------------------------------

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (searchText) {
        const q = searchText.toLowerCase();
        const matchesName =
          row.teamName.toLowerCase().includes(q) ||
          row.projectName.toLowerCase().includes(q);
        if (!matchesName) return false;
      }

      if (roleFilter !== 'all' && row.userRole !== roleFilter) {
        return false;
      }

      if (statusFilter !== 'all' && row.membershipStatus !== statusFilter) {
        return false;
      }

      if (restrictedOnly && !row.isRestricted) {
        return false;
      }

      return true;
    });
  }, [data, searchText, roleFilter, statusFilter, restrictedOnly]);

  const sortedData = useMemo(
    () => [...filteredData].sort((a, b) => a.teamName.localeCompare(b.teamName)),
    [filteredData],
  );

  const totalTeams = data.length;
  const ownerAdminCount = data.filter(
    (t) => t.userRole === 'owner' || t.userRole === 'admin',
  ).length;
  const restrictedCount = data.filter((t) => t.isRestricted).length;

  const rowSelection: TableProps<TeamRow>['rowSelection'] = {
    selectedRowKeys: selectedTeamKeys,
    onChange: (keys) => setSelectedTeamKeys(keys as React.Key[]),
  };

  const columns: ColumnsType<TeamRow> = [
    {
      title: 'Team',
      dataIndex: 'teamName',
      key: 'teamName',
      render: (value: string, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{value}</Text>
          <Text type="secondary">ID: {record.teamId}</Text>
        </Space>
      ),
    },
    {
      title: 'Project',
      dataIndex: 'projectName',
      key: 'projectName',
      ellipsis: true,
      render: (value: string) => <Text>{value}</Text>,
    },
    {
      title: 'My role',
      dataIndex: 'userRole',
      key: 'userRole',
      width: 140,
      render: (role: TeamRole) => {
        let color: string | undefined;
        switch (role) {
          case 'owner':
            color = 'gold';
            break;
          case 'admin':
            color = 'blue';
            break;
          case 'member':
            color = 'green';
            break;
          case 'observer':
            color = 'default';
            break;
          default:
            color = 'default';
        }
        return <Tag color={color}>{role}</Tag>;
      },
    },
    {
      title: 'Members',
      dataIndex: 'roster',
      key: 'roster',
      width: 260,
      render: (_: TeamMember[], record) => {
        const preview = record.roster.slice(0, 3);
        return preview.length ? (
          <List
            dataSource={preview}
            renderItem={(m: TeamMember) => (
              <List.Item style={{ paddingInline: 0 }} key={m.id}>
                <List.Item.Meta
                  avatar={<Avatar>{m.name.charAt(0)}</Avatar>}
                  title={<Text>{m.name}</Text>}
                  description={<Text type="secondary">{m.role}</Text>}
                />
              </List.Item>
            )}
          />
        ) : (
          <Text type="secondary">Members not loaded</Text>
        );
      },
    },
    {
      title: 'Recent activity',
      dataIndex: 'recentActivity',
      key: 'recentActivity',
      width: 260,
      render: (activities: string[]) =>
        activities.length ? (
          <List
            size="small"
            dataSource={activities.slice(0, 3)}
            renderItem={(msg) => (
              <List.Item style={{ paddingInline: 0 }}>{msg}</List.Item>
            )}
          />
        ) : (
          <Text type="secondary">No recent activity</Text>
        ),
      responsive: ['lg'],
    },
    {
      title: 'Status',
      dataIndex: 'membershipStatus',
      key: 'membershipStatus',
      width: 140,
      render: (status: MembershipStatus) => {
        switch (status) {
          case 'active':
            return <Tag color="green">Active</Tag>;
          case 'invited':
            return <Tag color="blue">Invitation</Tag>;
          case 'request_pending':
            return <Tag color="orange">Request pending</Tag>;
          default:
            return <Tag>Unknown</Tag>;
        }
      },
    },
    {
      title: 'Access',
      dataIndex: 'isRestricted',
      key: 'isRestricted',
      width: 120,
      render: (isRestricted: boolean) =>
        isRestricted ? (
          <Tag color="volcano">Restricted</Tag>
        ) : (
          <Tag color="default">Open</Tag>
        ),
      responsive: ['md'],
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 160,
      render: (_: unknown, record) => {
        const items: MenuProps['items'] = [
          { key: 'view', label: 'Open team' },
          { key: 'invite', label: 'Invite members' },
          { type: 'divider' },
          {
            key: 'leave',
            danger: true,
            label: 'Leave team',
          },
        ];

        const onMenuClick: MenuProps['onClick'] = ({ key }) => {
          switch (key) {
            case 'view':
              handleViewTeam(record);
              break;
            case 'invite':
              handleInviteMembers(record);
              break;
            case 'leave':
              void handleLeaveTeam(record);
              break;
            default:
              break;
          }
        };

        const isLeaving = leavingTeamId === record.teamId;

        return (
          <Dropdown
            menu={{ items, onClick: onMenuClick }}
            trigger={['click']}
            disabled={isLeaving}
          >
            <Button loading={isLeaving}>
              Actions <DownOutlined />
            </Button>
          </Dropdown>
        );
      },
    },
  ];

  const headerSecondaryActions = (
    <Space>
      <Button
        icon={<ProjectOutlined />}
        onClick={() =>
          router.push('/konnected/teams-collaboration/project-workspaces')
        }
      >
        Project workspaces
      </Button>
      <Button
        icon={<CalendarOutlined />}
        onClick={() =>
          router.push('/konnected/teams-collaboration/activity-planner')
        }
      >
        Activity planner
      </Button>
    </Space>
  );

  const headerPrimaryAction = (
    <Button
      type="primary"
      icon={<PlusOutlined />}
      onClick={() =>
        router.push('/konnected/teams-collaboration/team-builder')
      }
    >
      Create or join a team
    </Button>
  );

  const hasRows = sortedData.length > 0;

  return (
    <KonnectedPageShell
      title="My Teams"
      subtitle={
        <span>
          Manage the collaboration teams you are part of in KonnectED. View
          membership, recent activity, and jump into workspaces.
        </span>
      }
      primaryAction={headerPrimaryAction}
      secondaryActions={headerSecondaryActions}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Space direction="vertical" size={0}>
            <Text type="secondary">Total teams</Text>
            <Text strong>
              <TeamOutlined style={{ marginRight: 4 }} />
              {totalTeams}
            </Text>
          </Space>
        </Col>
        <Col xs={24} sm={8}>
          <Space direction="vertical" size={0}>
            <Text type="secondary">Teams you own/admin</Text>
            <Text strong>{ownerAdminCount}</Text>
          </Space>
        </Col>
        <Col xs={24} sm={8}>
          <Space direction="vertical" size={0}>
            <Text type="secondary">Restricted teams</Text>
            <Text strong>{restrictedCount}</Text>
          </Space>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={10}>
          <Search
            placeholder="Search by team or project name"
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={(value) => setSearchText(value)}
          />
        </Col>
        <Col xs={12} md={6}>
          <Select<'all' | TeamRole>
            style={{ width: '100%' }}
            value={roleFilter}
            onChange={(val) => setRoleFilter(val)}
          >
            <Option value="all">All roles</Option>
            <Option value="owner">Owner</Option>
            <Option value="admin">Admin</Option>
            <Option value="member">Member</Option>
            <Option value="observer">Observer</Option>
          </Select>
        </Col>
        <Col xs={12} md={6}>
          <Select<'all' | MembershipStatus>
            style={{ width: '100%' }}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
          >
            <Option value="all">All membership states</Option>
            <Option value="active">Active</Option>
            <Option value="invited">Invitations</Option>
            <Option value="request_pending">Requests pending</Option>
          </Select>
        </Col>
        <Col xs={24} md={2}>
          <Space>
            <Switch
              checked={restrictedOnly}
              onChange={(checked) => setRestrictedOnly(checked)}
            />
            <Text type="secondary">Restricted only</Text>
          </Space>
        </Col>
      </Row>

      {error && (
        <Alert
          type="error"
          message="Unable to load your teams"
          description={
            <>
              <Paragraph style={{ marginBottom: 8 }}>{error}</Paragraph>
              <Button size="small" onClick={() => setReloadFlag((n) => n + 1)}>
                Retry
              </Button>
            </>
          }
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {!loading && !error && !hasRows ? (
        <Empty
          description="You are not part of any team yet."
          style={{ padding: '40px 0' }}
        >
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() =>
                router.push('/konnected/teams-collaboration/team-builder')
              }
            >
              Create or join a team
            </Button>
            <Button
              icon={<ProjectOutlined />}
              onClick={() =>
                router.push('/konnected/teams-collaboration/project-workspaces')
              }
            >
              Browse project workspaces
            </Button>
          </Space>
        </Empty>
      ) : (
        <Table<TeamRow>
          rowKey="key"
          size="middle"
          bordered
          loading={loading}
          columns={columns}
          dataSource={sortedData}
          rowSelection={rowSelection}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: 1000 }}
        />
      )}
    </KonnectedPageShell>
  );
}
