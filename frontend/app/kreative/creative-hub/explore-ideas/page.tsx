// FILE: frontend/app/kreative/creative-hub/explore-ideas/page.tsx
'use client';

// File: C:\MyCode\Konnaxionv14\frontend\app\kreative\creative-hub\explore-ideas\page.tsx

import { SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Input,
  Pagination,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import KreativePageShell from '@/app/kreative/kreativePageShell';

const { Title, Text, Paragraph } = Typography;

type Domain = 'Art' | 'Music' | 'Writing';
type SortOpt = 'newest' | 'popular';
type CategoryFilter = 'All' | Domain;

interface CreativeIdea {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  domain: Domain;
  thumbnail: string;
  date: string; // ISO date
  popularity: number;
}

const creativeIdeasData: CreativeIdea[] = [
  {
    id: '1',
    title: 'The Beauty of Minimalism',
    excerpt: 'Exploring the art of less is more in design and creative expression.',
    author: 'Alice Martin',
    domain: 'Art',
    thumbnail: 'https://via.placeholder.com/300x200.png?text=Minimalism',
    date: '2025-11-20T10:00:00Z',
    popularity: 87,
  },
  {
    id: '2',
    title: 'Soundscapes: Music and Emotion',
    excerpt: 'How different chord progressions evoke specific emotional responses.',
    author: 'Brian Chen',
    domain: 'Music',
    thumbnail: 'https://via.placeholder.com/300x200.png?text=Soundscapes',
    date: '2025-11-18T14:30:00Z',
    popularity: 73,
  },
  {
    id: '3',
    title: 'Writing with Constraints',
    excerpt: 'Using constraints like lipograms to spark creativity.',
    author: 'Caroline Dupont',
    domain: 'Writing',
    thumbnail: 'https://via.placeholder.com/300x200.png?text=Constraints',
    date: '2025-11-15T09:00:00Z',
    popularity: 55,
  },
  {
    id: '4',
    title: 'Color Theory Basics',
    excerpt: 'Understanding complementary and analogous color schemes.',
    author: 'David Lopez',
    domain: 'Art',
    thumbnail: 'https://via.placeholder.com/300x200.png?text=Color+Theory',
    date: '2025-11-10T11:45:00Z',
    popularity: 61,
  },
];

export default function ExploreIdeasPage(): JSX.Element {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>('All');
  const [sortOption, setSortOption] = useState<SortOpt>('newest');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 9;

  const filteredIdeas = useMemo<CreativeIdea[]>(() => {
    let ideas = [...creativeIdeasData];

    if (selectedCategory !== 'All') {
      ideas = ideas.filter((idea) => idea.domain === selectedCategory);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      ideas = ideas.filter(
        (idea) =>
          idea.title.toLowerCase().includes(q) ||
          idea.excerpt.toLowerCase().includes(q),
      );
    }

    ideas =
      sortOption === 'newest'
        ? ideas.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )
        : ideas.sort((a, b) => b.popularity - a.popularity);

    return ideas;
  }, [searchQuery, selectedCategory, sortOption]);

  const paginatedIdeas = useMemo<CreativeIdea[]>(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredIdeas.slice(startIndex, startIndex + pageSize);
  }, [filteredIdeas, currentPage]);

  const handleCardClick = (idea: CreativeIdea) => {
    router.push(`/kreative/creative-hub/idea/${idea.id}`);
  };

  return (
    <KreativePageShell
      title="Explore Ideas"
      subtitle="Browse curated prompts and articles across creative domains."
      primaryAction={
        <Button
          type="primary"
          onClick={() =>
            router.push('/kreative/idea-incubator/create-new-idea')
          }
        >
          Create New Idea
        </Button>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space wrap>
          <Input
            placeholder="Search ideas"
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: 300 }}
            allowClear
          />

          <Select<CategoryFilter>
            value={selectedCategory}
            onChange={(value) => {
              setSelectedCategory(value);
              setCurrentPage(1);
            }}
            options={[
              { value: 'All', label: 'All Domains' },
              { value: 'Art', label: 'Art' },
              { value: 'Music', label: 'Music' },
              { value: 'Writing', label: 'Writing' },
            ]}
            style={{ width: 180 }}
          />

          <Select<SortOpt>
            value={sortOption}
            onChange={(value) => {
              setSortOption(value);
              setCurrentPage(1);
            }}
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'popular', label: 'Most Popular' },
            ]}
            style={{ width: 180 }}
          />
        </Space>

        <Row gutter={[24, 24]}>
          {paginatedIdeas.map((idea) => (
            <Col key={idea.id} xs={24} sm={12} md={8}>
              <Card
                hoverable
                cover={
                  <Image
                    alt={idea.title}
                    src={idea.thumbnail}
                    width={300}
                    height={160}
                    unoptimized
                    style={{ width: '100%', height: 160, objectFit: 'cover' }}
                  />
                }
                onClick={() => handleCardClick(idea)}
              >
                <Title
                  level={4}
                  className="clamp-1"
                  style={{ marginBottom: 8 }}
                >
                  {idea.title}
                </Title>

                <Paragraph
                  className="clamp-2"
                  type="secondary"
                  style={{ marginBottom: 12 }}
                >
                  {idea.excerpt}
                </Paragraph>

                <Text strong>By: </Text>
                <Text>{idea.author}</Text>
              </Card>
            </Col>
          ))}
        </Row>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredIdeas.length}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
          />
        </div>
      </Space>

      <style jsx>{`
        .clamp-1 {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </KreativePageShell>
  );
}
