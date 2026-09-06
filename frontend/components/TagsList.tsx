// FILE: frontend/components/TagsList.tsx
'use client';

import { Tag as AntdTag, Card, Empty, List, Typography } from 'antd';
import React from 'react';

const { Text } = Typography;

export interface TagItem {
  id: string;
  name: string;
  count?: number;
}

type TagsInput = TagItem[] | { data?: TagItem[] } | null | undefined;

interface TagsListProps {
  /** Peut être un tableau direct ou un objet de type AxiosResponse avec `.data` */
  data?: TagsInput;
  onSelectTag?: (tag: TagItem) => void;
}

/** Type guard pour un objet de forme { data: TagItem[] } */
function hasDataArray(x: unknown): x is { data: TagItem[] } {
  return (
    !!x &&
    typeof x === 'object' &&
    'data' in x &&
    Array.isArray((x as { data?: unknown }).data)
  );
}

/** Normalise l’entrée en tableau de tags */
function toTagsArray(input: TagsInput): TagItem[] {
  if (Array.isArray(input)) return input;
  if (hasDataArray(input)) return input.data;
  return [];
}

const TagsList: React.FC<TagsListProps> = ({ data, onSelectTag }) => {
  const tags = React.useMemo<TagItem[]>(() => toTagsArray(data), [data]);

  return (
    <Card title="Tags">
      {tags.length === 0 ? (
        <Empty description="No tags" />
      ) : (
        <List<TagItem>
          dataSource={tags}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-8">
                  <AntdTag
                    onClick={onSelectTag ? () => onSelectTag(item) : undefined}
                    style={{ cursor: onSelectTag ? 'pointer' : 'default' }}
                  >
                    {item.name}
                  </AntdTag>
                  {typeof item.count === 'number' && (
                    <Text type="secondary">{item.count}</Text>
                  )}
                </div>
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default TagsList;
