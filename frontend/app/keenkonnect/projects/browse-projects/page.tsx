// FILE: frontend/app/keenkonnect/projects/browse-projects/page.tsx
// app/keenkonnect/projects/browse-projects/page.tsx
'use client';

import {
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import {
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Drawer,
  Empty,
  Input,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Tabs,
  Tag,
  Tooltip,
} from 'antd';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import api from '@/api';
import KeenPageShell from '@/app/keenkonnect/KeenPageShell';

const { Search } = Input;
const { Option } = Select;

// Aligned with Django router: /api/keenkonnect/projects/
const PROJECTS_ENDPOINT = 'keenkonnect/projects/'; // relative to NEXT_PUBLIC_API_BASE

type SortCriteria = 'newest' | 'mostMembers';

interface ApiProject {
  id: number;
  title: string;
  description: string;
  creator: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  tags: number[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  owner: string;
  technologies: string[];
  domain: string;
  members: number;
  createdAt: string; // ISO date string
}

export default function BrowseProjectsPage(): JSX.Element {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [searchText, setSearchText] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [selectedTechnology, setSelectedTechnology] = useState<string>('All');
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('newest');
  const [activeDomainTabKey, setActiveDomainTabKey] = useState<string>('All');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await api.get<ApiProject[]>(PROJECTS_ENDPOINT);

        // Map backend Project objects to the UI shape used by this page
        const mapped: Project[] = data.map((p) => ({
          id: String(p.id),
          name: p.title,
          description: p.description ?? '',
          owner: p.creator ?? '',
          domain: p.category ?? 'Uncategorized',
          technologies: [], // TODO: map from tags or related data when available
          members: 0, // Membership count unavailable in the current project-list contract.
          createdAt: p.created_at,
        }));

        setProjects(mapped);
      } catch (err) {
         
        console.error('Failed to load projects', err);
        setError('Unable to load projects from the server.');
      } finally {
        setLoading(false);
      }
    };

    void fetchProjects();
  }, []);

  const domainOptions = useMemo(() => {
    const unique = Array.from(
      new Set(projects.map((p) => p.domain || 'Uncategorized')),
    );
    return ['All', ...unique];
  }, [projects]);

  const technologyOptions = useMemo(() => {
    const allTechs = new Set<string>();
    projects.forEach((p) => {
      p.technologies.forEach((t) => allTechs.add(t));
    });
    return ['All', ...Array.from(allTechs)];
  }, [projects]);

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const matchesSearch =
          !searchText ||
          project.name.toLowerCase().includes(searchText.toLowerCase()) ||
          project.description.toLowerCase().includes(searchText.toLowerCase());

        const matchesDomain =
          selectedDomain === 'All' || project.domain === selectedDomain;

        const matchesTechnology =
          selectedTechnology === 'All' ||
          project.technologies.includes(selectedTechnology);

        return matchesSearch && matchesDomain && matchesTechnology;
      }),
    [projects, searchText, selectedDomain, selectedTechnology],
  );

  const sortedProjects = useMemo(() => {
    const next = [...filteredProjects];
    if (sortCriteria === 'newest') {
      next.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (sortCriteria === 'mostMembers') {
      next.sort((a, b) => b.members - a.members);
    }
    return next;
  }, [filteredProjects, sortCriteria]);

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedProjects.slice(startIndex, startIndex + pageSize);
  }, [sortedProjects, currentPage]);

  const handleOpenDrawer = (project: Project) => {
    setSelectedProject(project);
    setDrawerVisible(true);
  };

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setSelectedProject(null);
  };

  const handleDomainTabChange = (key: string) => {
    setActiveDomainTabKey(key);
    setSelectedDomain(key);
    setCurrentPage(1);
  };

  return (
    <KeenPageShell
      title="Browse Projects"
      description="Discover projects and collaborate through KeenKonnect. Data is loaded from the Django backend."
      metaTitle="KeenKonnect · Browse Projects"
      toolbar={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() =>
            router.push('/keenkonnect/projects/create-new-project')
          }
        >
          Create New Project
        </Button>
      }
    >
      <ProCard ghost>
        {loading && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin />
          </div>
        )}

        {error && (
          <div style={{ marginBottom: 16 }}>
            <Tag color="red">{error}</Tag>
          </div>
        )}

        {/* Tabs + filters */}
        <ProCard bordered={false}>
          {/* Quick domain Tabs */}
          <Tabs
            activeKey={activeDomainTabKey}
            onChange={handleDomainTabChange}
            items={domainOptions.map((domain) => ({
              key: domain,
              label: domain === 'All' ? 'All Domains' : domain,
            }))}
          />

          {/* Filters */}
          <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
            <Col xs={24} md={10}>
              <Search
                placeholder="Search by name or description"
                allowClear
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </Col>
            <Col xs={24} sm={12} md={7}>
              <Select
                value={selectedDomain}
                style={{ width: '100%' }}
                onChange={(value) => {
                  setSelectedDomain(value);
                  setActiveDomainTabKey(value);
                  setCurrentPage(1);
                }}
              >
                {domainOptions.map((domain) => (
                  <Option key={domain} value={domain}>
                    {domain === 'All' ? 'All Domains' : domain}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={7}>
              <Select
                value={selectedTechnology}
                style={{ width: '100%' }}
                onChange={(value) => {
                  setSelectedTechnology(value);
                  setCurrentPage(1);
                }}
              >
                {technologyOptions.map((tech) => (
                  <Option key={tech} value={tech}>
                    {tech === 'All' ? 'All Technologies' : tech}
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>

          {/* Sorter */}
          <Row style={{ marginTop: 16 }}>
            <Col span={24}>
              <Space>
                <span>Sort by:</span>
                <Select<SortCriteria>
                  value={sortCriteria}
                  onChange={(value) => setSortCriteria(value)}
                  style={{ width: 180 }}
                >
                  <Option value="newest">Newest first</Option>
                  <Option value="mostMembers">Most members</Option>
                </Select>
              </Space>
            </Col>
          </Row>
        </ProCard>

        {/* Content */}
        <ProCard ghost style={{ marginTop: 16 }}>
          {projects.length === 0 && !loading && !error && (
            <Empty
              description={
                <Space direction="vertical">
                  <span>No projects found yet.</span>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() =>
                      router.push('/keenkonnect/projects/create-new-project')
                    }
                  >
                    Create the first project
                  </Button>
                </Space>
              }
            />
          )}

          {projects.length > 0 && (
            <Row gutter={[16, 16]}>
              {paginatedProjects.map((project) => (
                <Col key={project.id} xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    title={
                      <Space>
                        <TeamOutlined />
                        <span>{project.name}</span>
                      </Space>
                    }
                    onClick={() => handleOpenDrawer(project)}
                    extra={(
                      <Space size={8}>
                        <Tooltip title="Open workspace">
                          <Button
                            type="link"
                            icon={<UserOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/keenkonnect/projects/project-workspace?projectId=${project.id}`,
                              );
                            }}
                          >
                            Open
                          </Button>
                        </Tooltip>
                        <Tooltip title="Collaborator drill-down is unavailable until a dedicated project-membership detail contract exists.">
                          <Button
                            type="link"
                            icon={<TeamOutlined />}
                            onClick={(e) => e.stopPropagation()}
                            disabled
                          >
                            Team preview
                          </Button>
                        </Tooltip>
                      </Space>
                    )}
                  >
                    <Space
                      direction="vertical"
                      size={8}
                      style={{ width: '100%' }}
                    >
                      <div>
                        <Tag color="blue">{project.domain}</Tag>
                      </div>

                      <div
                        style={{
                          minHeight: 48,
                          color: 'rgba(0,0,0,0.65)',
                          fontSize: 13,
                        }}
                      >
                        {project.description || 'No description provided yet.'}
                      </div>

                      {/* Technologies */}
                      <Space wrap>
                        {project.technologies.length === 0 ? (
                          <Tag>No technologies listed</Tag>
                        ) : (
                          project.technologies.map((tech) => (
                            <Tag key={tech}>{tech}</Tag>
                          ))
                        )}
                      </Space>

                      {/* Avatars + owner + CTA */}
                      <Row
                        justify="space-between"
                        align="middle"
                        style={{ marginTop: 8 }}
                      >
                        <Col>
                          <Space size={8}>
                            <Avatar.Group max={{ count: 3 }} size="small">
                              <Avatar icon={<UserOutlined />} />
                              <Avatar>
                                {project.owner
                                  ? project.owner.charAt(0).toUpperCase()
                                  : '?'}
                              </Avatar>
                              <Avatar icon={<UserOutlined />} />
                            </Avatar.Group>
                            <span
                              style={{
                                fontSize: 12,
                                color: 'rgba(0,0,0,0.45)',
                              }}
                            >
                              Owner: {project.owner || 'Unknown'}
                            </span>
                          </Space>
                        </Col>
                        <Col>
                          <Button
                            type="link"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/keenkonnect/projects/project-workspace?projectId=${project.id}`,
                              );
                            }}
                          >
                            Open workspace
                          </Button>
                        </Col>
                      </Row>
                    </Space>
                  </Card>
                </Col>
              ))}

              {paginatedProjects.length === 0 && projects.length > 0 && (
                <Col span={24}>
                  <Card>
                    <Space direction="vertical">
                      <span>No projects match your filters.</span>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() =>
                          router.push(
                            '/keenkonnect/projects/create-new-project',
                          )
                        }
                      >
                        Start a New Project
                      </Button>
                    </Space>
                  </Card>
                </Col>
              )}
            </Row>
          )}
        </ProCard>

        {/* Pagination */}
        {sortedProjects.length > pageSize && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={sortedProjects.length}
              showSizeChanger={false}
              onChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}

        {/* Drawer: project details */}
        <Drawer
          title={selectedProject?.name}
          placement="right"
          width={420}
          open={drawerVisible}
          onClose={handleCloseDrawer}
        >
          {selectedProject && (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space align="center">
                <Avatar.Group max={{ count: 3 }}>
                  <Avatar size="large" icon={<UserOutlined />} />
                  <Avatar>
                    {selectedProject.owner
                      ? selectedProject.owner.charAt(0).toUpperCase()
                      : '?'}
                  </Avatar>
                  <Avatar icon={<UserOutlined />} />
                </Avatar.Group>
                <div>
                  <div>
                    <strong>Owner: </strong>
                    {selectedProject.owner || 'Unknown'}
                  </div>
                  <div>
                    <strong>Members: </strong>
                    {selectedProject.members}
                  </div>
                </div>
              </Space>

              <Divider />

              <div>
                <p>
                  <strong>Description</strong>
                </p>
                <p>
                  {selectedProject.description ||
                    'No detailed description provided yet.'}
                </p>
              </div>

              <div>
                <p>
                  <strong>Domain</strong>
                </p>
                <Tag color="blue">{selectedProject.domain}</Tag>
              </div>

              <div>
                <p>
                  <strong>Technologies</strong>
                </p>
                <Space wrap>
                  {selectedProject.technologies.length === 0 ? (
                    <Tag>No technologies listed</Tag>
                  ) : (
                    selectedProject.technologies.map((tech) => (
                      <Tag key={tech}>{tech}</Tag>
                    ))
                  )}
                </Space>
              </div>

              <div>
                <p>
                  <strong>Created At</strong>
                </p>
                <span>{selectedProject.createdAt}</span>
              </div>
            </Space>
          )}
        </Drawer>
      </ProCard>
    </KeenPageShell>
  );
}
