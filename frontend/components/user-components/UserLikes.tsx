// FILE: frontend/components/user-components/UserLikes.tsx
// C:\MyCode\Konnaxionv14\frontend\components\user-components\UserLikes.tsx
// Source: dump original (UserLikes.tsx) 
'use client';

/**
 * Description: User likes list component
 * Author: Hieu Chu
 */

import { Avatar, Card, Empty, List, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Link from 'next/link';
import React, { useMemo } from 'react';

dayjs.extend(relativeTime);

type LikeImage = { url: string; created?: string | Date };
type Sculpture = {
  name: string;
  images?: LikeImage[];
  accessionId?: string | number;
};

type UserLikeItem = {
  likedTime: string | Date;
  sculptureId?: string | number;
  sculpture: Sculpture;
};

interface UserLikesProps {
  likes: UserLikeItem[];
}

const FALLBACK_IMG = '/static/no-image.png';

const UserLikes: React.FC<UserLikesProps> = ({ likes }) => {
  // Tri sans muter la prop et tri interne des images sans mutation
  const items = useMemo<UserLikeItem[]>(() => {
    const safeLikes = Array.isArray(likes) ? likes : [];
    return safeLikes
      .slice() // clone props
      .sort(
        (a, b) =>
          new Date(b.likedTime).getTime() - new Date(a.likedTime).getTime(),
      )
      .map((x) => {
        const sortedImages = (x.sculpture?.images ?? [])
          .slice() // clone images
          .sort(
            (a, b) =>
              new Date(a.created ?? 0).getTime() -
              new Date(b.created ?? 0).getTime(),
          );
        return {
          ...x,
          sculpture: { ...x.sculpture, images: sortedImages },
        };
      });
  }, [likes]);

  return (
    <Card
      title="Likes"
      bodyStyle={{ padding: '20px 24px 0px' }}
      variant="borderless"
      style={{ marginTop: 12 }}
    >
      <List<UserLikeItem>
        itemLayout="horizontal"
        dataSource={items}
        className="comment-list"
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No Likes"
            />
          ),
        }}
        renderItem={(x) => {
          const images = x.sculpture?.images ?? [];
          const firstImageUrl =
            images.length > 0 && images[0]?.url ? images[0].url : FALLBACK_IMG;
          const targetId = x.sculptureId ?? x.sculpture?.accessionId;
          const when = dayjs(x.likedTime);

          const titleNode = (
            <Typography.Text
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: 'rgba(0, 0, 0, 0.65)',
              }}
            >
              {x.sculpture?.name ?? 'Unknown sculpture'}
            </Typography.Text>
          );

          return (
            <List.Item
              key={`${String(targetId ?? x.sculpture?.name ?? 'unknown')}-${new Date(
                x.likedTime,
              ).getTime()}`}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    shape="square"
                    size={42}
                    src={firstImageUrl}
                    alt={x.sculpture?.name ?? 'sculpture'}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                  />
                }
                title={
                  targetId != null ? (
                    <Link href={`/sculptures/id/${encodeURIComponent(String(targetId))}`}>
                      {titleNode}
                    </Link>
                  ) : (
                    titleNode
                  )
                }
                description={
                  <Tooltip title={when.format('D MMMM YYYY, h:mm:ss a')}>
                    <Typography.Text
                      style={{
                        fontSize: 14,
                        color: 'rgba(0, 0, 0, 0.35)',
                      }}
                    >
                      {when.fromNow()}
                    </Typography.Text>
                  </Tooltip>
                }
              />
            </List.Item>
          );
        }}
        pagination={{ pageSize: 15, hideOnSinglePage: true }}
      />
    </Card>
  );
};

export default UserLikes;
