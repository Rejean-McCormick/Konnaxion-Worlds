// FILE: frontend/components/user-components/UserVisit.tsx
// C:\MyCode\Konnaxionv14\frontend\components\user-components\UserVisit.tsx
'use client';

/**
 * Description: User visit list component
 * Author: Hieu Chu
 */

import { Comment } from '@ant-design/compatible';
import { Card, Empty, List, Tooltip } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Image from 'next/image';
import Link from 'next/link';
import type React from 'react';

dayjs.extend(relativeTime);

/** Types minimaux utilisés par ce composant */
type ImageItem = { url: string; created: string | Date };

export interface Visit {
  visitTime: string | Date;
  sculptureId: string | number;
  sculpture: {
    name: string;
    images: ImageItem[];
  };
}

type FormattedComment = {
  author: React.ReactNode;
  avatar: React.ReactNode;
  content: React.ReactNode;
};

const FALLBACK_IMG = '/static/no-image.png';

const UserVisit: React.FC<{ visits: Visit[] }> = ({ visits }) => {
  // Ne pas muter la prop
  // Clone + tri inverse par date de visite
  const items: Visit[] = [...(visits ?? [])]
    .sort(
      (a, b) =>
        new Date(b.visitTime).getTime() - new Date(a.visitTime).getTime(),
    )
    .map((v) => {
      // Tri des images par date croissante
      const images = [...(v.sculpture?.images ?? [])].sort(
        (a, b) =>
          new Date(a.created).getTime() - new Date(b.created).getTime(),
      );
      return { ...v, sculpture: { ...v.sculpture, images } };
    });

  const formattedComments: FormattedComment[] = items.map((x: Visit) => {
    // Accès sûr à l’URL de la première image
    const firstImageUrl = x.sculpture?.images?.[0]?.url ?? FALLBACK_IMG;

    return {
      author: (
        <Link href={`/sculptures/id/${String(x.sculptureId)}`}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: 'rgba(0, 0, 0, 0.65)',
            }}
          >
            {x.sculpture?.name ?? 'Untitled sculpture'}
          </span>
        </Link>
      ),
      avatar: (
        <Image
          src={firstImageUrl}
          alt={x.sculpture?.name ?? 'Sculpture'}
          width={42}
          height={42}
          unoptimized
          // Fallback d'image robuste
          onError={(e) => {
            // évite une boucle si le fallback est manquant
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_IMG;
          }}
          style={{
            width: 42,
            height: 42,
            objectFit: 'cover',
            borderRadius: 4,
          }}
        />
      ),
      content: (
        <div style={{ fontSize: 14 }}>
          <Tooltip title={dayjs(x.visitTime).format('D MMMM YYYY, h:mm:ss a')}>
            <span style={{ fontSize: 14, color: 'rgba(0, 0, 0, 0.35)' }}>
              {dayjs(x.visitTime).fromNow()}
            </span>
          </Tooltip>
        </div>
      ),
    };
  });

  return (
    <Card
      title="Visits"
      bodyStyle={{ padding: '20px 24px 0px' }}
      variant="borderless"
      style={{ marginTop: 12 }}
    >
      <List<FormattedComment>
        itemLayout="horizontal"
        dataSource={formattedComments}
        className="comment-list"
        locale={{
          emptyText: (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No Visits" />
          ),
        }}
        renderItem={(item: FormattedComment) => (
          <li>
            <Comment
              author={item.author}
              avatar={item.avatar}
              content={item.content}
              className="comment"
            />
          </li>
        )}
        pagination={{ pageSize: 15, hideOnSinglePage: true }}
      />
    </Card>
  );
};

export default UserVisit;
