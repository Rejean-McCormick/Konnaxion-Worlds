// FILE: frontend/components/user-components/UserComments.tsx
'use client';

/**
 * Description: User comments list component
 * Author: Hieu Chu
 */

import {
  DeleteOutlined,
  EllipsisOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  message as antdMessage,
  Avatar,
  Button,
  Card,
  Dropdown,
  Empty,
  Input,
  List,
  Modal,
  Space,
  Tooltip,
  Typography,
} from 'antd';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Link from 'next/link';
import React, { useMemo } from 'react';

import api from '@/services/_request';

import { normalizeError } from '../../shared/errors';

dayjs.extend(relativeTime);

const { Text } = Typography;
const { TextArea } = Input;

interface CommentUser {
  userId: string;
  nickname?: string | null;
  name?: string | null;
  picture?: string | null;
}

interface CommentSculpture {
  accessionId: string | number;
  name: string;
}

export interface UserComment {
  commentId: string;
  content: string;
  createdTime: string; // ISO 8601
  user: CommentUser;
  sculpture: CommentSculpture;
}

interface Props {
  comments: UserComment[];
  deleteComment: (id: string) => void;
}

const UserComments: React.FC<Props> = ({ comments, deleteComment }) => {
  // Tri sans muter les props
  const items = useMemo<UserComment[]>(
    () =>
      [...comments].sort(
        (a, b) => Date.parse(b.createdTime) - Date.parse(a.createdTime),
      ),
    [comments],
  );

  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    Modal.confirm({
      title: 'Delete this comment permanently?',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      style: { top: 110 },
      maskClosable: true,
      okText: 'Confirm',
      okButtonProps: {
        style: { background: '#ff4d4f', borderColor: '#ff4d4f' },
      },
      onOk: async () => {
        try {
          await api.delete(`/comment/${String(key)}`);
          antdMessage.success('Deleted comment successfully!', 2);
          deleteComment(String(key));
        } catch (e) {
          const { message } = normalizeError(e);
          antdMessage.error(message || 'Failed to delete');
        }
      },
    });
  };

  return (
    <Card title="Comments" bodyStyle={{ padding: '20px 24px 0px' }} bordered={false}>
      <List<UserComment>
        itemLayout="horizontal"
        dataSource={items}
        className="comment-list"
        locale={{
          emptyText: (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No Comments" />
          ),
        }}
        pagination={{ pageSize: 15, hideOnSinglePage: true }}
        renderItem={(x) => {
          const displayName = x.user.userId.includes('auth0')
            ? x.user.nickname ?? x.user.name ?? 'User'
            : x.user.name ?? x.user.nickname ?? 'User';

          return (
            <List.Item
              key={x.commentId}
              actions={[
                <Dropdown
                  key="more"
                  trigger={['click']}
                  menu={{
                    items: [
                      { key: x.commentId, label: 'Delete comment', icon: <DeleteOutlined /> },
                    ],
                    onClick: onMenuClick,
                  }}
                >
                  <Button type="text" aria-label="More actions" icon={<EllipsisOutlined />} />
                </Dropdown>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar src={x.user.picture ?? undefined} alt={displayName}>
                    {!x.user.picture && displayName.charAt(0).toUpperCase()}
                  </Avatar>
                }
                title={
                  <Space size={8} wrap>
                    <Text strong style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)' }}>
                      {displayName}
                    </Text>
                    <Tooltip title={dayjs(x.createdTime).format('D MMMM YYYY, h:mm:ss a')}>
                      <Text type="secondary" style={{ fontSize: 14 }}>
                        {dayjs(x.createdTime).fromNow()} in
                      </Text>
                    </Tooltip>
                    <Link href={`/sculptures/id/${String(x.sculpture.accessionId)}`}>
                      <Text style={{ fontSize: 14 }}>{x.sculpture.name}</Text>
                    </Link>
                  </Space>
                }
                description={
                  <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>
                    {x.content?.trim() ?? ''}
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />

      {/* quick reply editor */}
      <div style={{ padding: '16px 24px' }}>
        <TextArea disabled placeholder="Use admin screen to reply" />
      </div>
    </Card>
  );
};

export default UserComments;
