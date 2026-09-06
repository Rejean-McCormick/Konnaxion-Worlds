// FILE: frontend/app/kreative/community-showcases/featured-projects/page.tsx
// C:\MyCode\Konnaxionv14\frontend\app\kreative\community-showcases\featured-projects\page.tsx
'use client';

import { SearchOutlined } from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Input,
  Modal,
  Pagination,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import Image from 'next/image';
import React, { useMemo, useState } from 'react';

import KreativePageShell from '@/app/kreative/kreativePageShell';

const { Title, Text, Paragraph } = Typography;

interface Project {
  id: string;
  title: string;
  description: string;
  creator: string;
  coverImage: string;
  category: string;
}

const PREVIEW_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'Project Sunrise',
    description:
      'An inspiring project that captures the beauty of dawn with innovative photo techniques and a vivid color palette.',
    creator: 'Alice Johnson',
    coverImage: 'https://via.placeholder.com/400x300.png?text=Project+Sunrise',
    category: 'Photography',
  },
  {
    id: '2',
    title: 'Digital Dreamscape',
    description:
      'A surreal digital art piece combining abstract concepts with vibrant colors to evoke emotion.',
    creator: 'Bob Smith',
    coverImage: 'https://via.placeholder.com/400x300.png?text=Digital+Dreamscape',
    category: 'Digital Art',
  },
  {
    id: '3',
    title: 'Urban Poetry',
    description:
      'A mixed-media project blending urban photography with spoken word performance, reimagining cityscapes in a poetic light.',
    creator: 'Carol Lee',
    coverImage: 'https://via.placeholder.com/400x300.png?text=Urban+Poetry',
    category: 'Mixed Media',
  },
  {
    id: '4',
    title: 'Vintage Revival',
    description:
      'A creative reinterpretation of vintage art styles merged with modern design sensibilities.',
    creator: 'David Kim',
    coverImage: 'https://via.placeholder.com/400x300.png?text=Vintage+Revival',
    category: 'Painting',
  },
];

export default function FeaturedProjectsPage(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] =
    useState<string>('All');
  const [modalVisible, setModalVisible] =
    useState<boolean>(false);
  const [selectedProject, setSelectedProject] =
    useState<Project | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 4;

  const filteredProjects = useMemo(() => {
    let projects = PREVIEW_PROJECTS;

    if (selectedCategory !== 'All') {
      projects = projects.filter(
        (project) => project.category === selectedCategory,
      );
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      projects = projects.filter(
        (project) =>
          project.title.toLowerCase().includes(q) ||
          project.description.toLowerCase().includes(q),
      );
    }

    return projects;
  }, [searchQuery, selectedCategory]);

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage]);

  const openModal = (project: Project) => {
    setSelectedProject(project);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedProject(null);
  };

  return (
    <KreativePageShell
      title="Featured projects"
      subtitle="Discover highlighted creative projects from the Kreative community."
    >
      {/* Filters */}
      <Space wrap style={{ marginBottom: 24 }}>
        <Input
          placeholder="Search projects."
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          style={{ width: 300 }}
        />

        <Select
          value={selectedCategory}
          onChange={(value) => {
            setSelectedCategory(value);
            setCurrentPage(1);
          }}
          style={{ width: 220 }}
          options={[
            { value: 'All', label: 'All Categories' },
            { value: 'Photography', label: 'Photography' },
            { value: 'Digital Art', label: 'Digital Art' },
            { value: 'Mixed Media', label: 'Mixed Media' },
            { value: 'Painting', label: 'Painting' },
          ]}
        />
      </Space>

      {/* Grid */}
      <Row gutter={[24, 24]}>
        {paginatedProjects.map((project) => (
          <Col key={project.id} xs={24} sm={12} md={8} lg={6}>
            <Badge.Ribbon text="Featured" color="red">
              <Card
                hoverable
                cover={
                  <Image
                    alt={project.title}
                    src={project.coverImage}
                    width={400}
                    height={200}
                    unoptimized
                    style={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                    }}
                  />
                }
                onClick={() => openModal(project)}
              >
                <Card.Meta
                  title={project.title}
                  description={
                    <>
                      <Paragraph
                        className="line-clamp-2"
                        style={{ marginBottom: 8 }}
                      >
                        {project.description}
                      </Paragraph>
                      <Text type="secondary">
                        By {project.creator}
                      </Text>
                    </>
                  }
                />
              </Card>
            </Badge.Ribbon>
          </Col>
        ))}
      </Row>

      {/* Pagination */}
      <div
        style={{
          textAlign: 'center',
          marginTop: 24,
        }}
      >
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={filteredProjects.length}
          onChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* Modal */}
      <Modal
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={800}
      >
        {selectedProject && (
          <div>
            <Image
              alt={selectedProject.title}
              src={selectedProject.coverImage}
              width={800}
              height={400}
              unoptimized
              style={{
                width: '100%',
                height: 400,
                objectFit: 'cover',
              }}
            />
            <div style={{ marginTop: 16 }}>
              <Title level={3}>{selectedProject.title}</Title>
              <Text type="secondary">
                By {selectedProject.creator}
              </Text>
              <p style={{ marginTop: 12 }}>
                {selectedProject.description}
              </p>
              <Button type="primary" disabled>
                Detail route unavailable
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* simple 2-line clamp */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </KreativePageShell>
  );
}
