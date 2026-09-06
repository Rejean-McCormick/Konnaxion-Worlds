'use client';

import { FileTextOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { type ProColumns, ProTable } from '@ant-design/pro-components';
import { Alert, Card, Col, Input, Row, Select, Space, Tag, Tree, Typography } from 'antd';
import type { DataNode, TreeProps } from 'antd/es/tree';
import React, { useMemo, useState } from 'react';

import KeenPage from '@/app/keenkonnect/KeenPageShell';

const { Search } = Input;
const { Title, Text } = Typography;

/**
 * Vocabulaire du dépôt de connaissances KeenKonnect
 * (aligné avec la doc : domaines, types, niveaux d'accès, statuts)
 */
const DOMAINS = ['Robotics', 'Healthcare', 'Education', 'Civic Engagement'] as const;
const KINDS = ['Blueprint', 'Protocol', 'Case Study', 'Toolkit'] as const;

type Domain = (typeof DOMAINS)[number];
type Kind = (typeof KINDS)[number];
type AccessLevel = 'Public' | 'Member' | 'Partner';
type Status = 'Published' | 'Draft';

type KnowledgeDocument = {
  id: string;
  title: string;
  domain: Domain;
  kind: Kind;
  access: AccessLevel;
  status: Status;
  updatedAt: string; // ISO date string
  owner: string;
  tags: string[];
};

type TreeKey = 'all' | Domain | `${Domain}|${Kind}`;
type AccessFilter = 'all' | AccessLevel;
type StatusFilter = 'all' | Status;

/**
 * Arborescence du dépôt : domaine -> type de ressource
 */
const treeData: DataNode[] = [
  {
    key: 'all' as TreeKey,
    title: 'Tous les contenus',
    icon: <FolderOpenOutlined />,
  },
  {
    key: 'Robotics' as TreeKey,
    title: 'Robotics',
    icon: <FolderOpenOutlined />,
    children: [
      { key: 'Robotics|Blueprint' as TreeKey, title: 'Blueprints', icon: <FileTextOutlined /> },
      { key: 'Robotics|Protocol' as TreeKey, title: 'Protocols', icon: <FileTextOutlined /> },
      { key: 'Robotics|Case Study' as TreeKey, title: 'Case Studies', icon: <FileTextOutlined /> },
      { key: 'Robotics|Toolkit' as TreeKey, title: 'Toolkits', icon: <FileTextOutlined /> },
    ],
  },
  {
    key: 'Healthcare' as TreeKey,
    title: 'Healthcare',
    icon: <FolderOpenOutlined />,
    children: [
      { key: 'Healthcare|Blueprint' as TreeKey, title: 'Blueprints', icon: <FileTextOutlined /> },
      { key: 'Healthcare|Protocol' as TreeKey, title: 'Protocols', icon: <FileTextOutlined /> },
      { key: 'Healthcare|Case Study' as TreeKey, title: 'Case Studies', icon: <FileTextOutlined /> },
      { key: 'Healthcare|Toolkit' as TreeKey, title: 'Toolkits', icon: <FileTextOutlined /> },
    ],
  },
  {
    key: 'Education' as TreeKey,
    title: 'Education',
    icon: <FolderOpenOutlined />,
    children: [
      { key: 'Education|Blueprint' as TreeKey, title: 'Blueprints', icon: <FileTextOutlined /> },
      { key: 'Education|Protocol' as TreeKey, title: 'Protocols', icon: <FileTextOutlined /> },
      { key: 'Education|Case Study' as TreeKey, title: 'Case Studies', icon: <FileTextOutlined /> },
      { key: 'Education|Toolkit' as TreeKey, title: 'Toolkits', icon: <FileTextOutlined /> },
    ],
  },
  {
    key: 'Civic Engagement' as TreeKey,
    title: 'Civic Engagement',
    icon: <FolderOpenOutlined />,
    children: [
      {
        key: 'Civic Engagement|Blueprint' as TreeKey,
        title: 'Blueprints',
        icon: <FileTextOutlined />,
      },
      {
        key: 'Civic Engagement|Protocol' as TreeKey,
        title: 'Protocols',
        icon: <FileTextOutlined />,
      },
      {
        key: 'Civic Engagement|Case Study' as TreeKey,
        title: 'Case Studies',
        icon: <FileTextOutlined />,
      },
      {
        key: 'Civic Engagement|Toolkit' as TreeKey,
        title: 'Toolkits',
        icon: <FileTextOutlined />,
      },
    ],
  },
];

/**
 * Declared preview dataset aligned with KeenKonnect Knowledge
 * (domains, types, tags...).
 */
const PREVIEW_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: 'doc-001',
    title: 'Blueprint robotique – Drone civique open-source',
    domain: 'Robotics',
    kind: 'Blueprint',
    access: 'Public',
    status: 'Published',
    updatedAt: '2025-02-15',
    owner: 'Collectif Drones Montréal',
    tags: ['drone', 'mobilité', 'open hardware'],
  },
  {
    id: 'doc-002',
    title: 'Toolkit – Robots d’assistance pour bibliothèques de quartier',
    domain: 'Robotics',
    kind: 'Toolkit',
    access: 'Member',
    status: 'Published',
    updatedAt: '2025-01-20',
    owner: 'KeenKonnect Robotics Guild',
    tags: ['inclusion', 'accessibilité', 'bibliothèque'],
  },
  {
    id: 'doc-003',
    title: 'Protocole de télémédecine pour cliniques mobiles',
    domain: 'Healthcare',
    kind: 'Protocol',
    access: 'Public',
    status: 'Draft',
    updatedAt: '2025-03-02',
    owner: 'Coop Santé Quartier-Nord',
    tags: ['télémédecine', 'clinique mobile', 'santé'],
  },
  {
    id: 'doc-004',
    title: 'Étude de cas – Réseau de soins communautaires',
    domain: 'Healthcare',
    kind: 'Case Study',
    access: 'Partner',
    status: 'Published',
    updatedAt: '2025-01-05',
    owner: 'Healthcare Civic Lab',
    tags: ['réseau', 'communauté', 'santé'],
  },
  {
    id: 'doc-005',
    title: 'Toolkit – Atelier de littératie numérique pour ados',
    domain: 'Education',
    kind: 'Toolkit',
    access: 'Public',
    status: 'Published',
    updatedAt: '2024-12-18',
    owner: 'KeenKonnect Learning Hub',
    tags: ['éducation', 'numérique', 'atelier'],
  },
  {
    id: 'doc-006',
    title: 'Blueprint – FabLab scolaire low-cost',
    domain: 'Education',
    kind: 'Blueprint',
    access: 'Member',
    status: 'Draft',
    updatedAt: '2025-02-01',
    owner: 'FabLab École-ouverte',
    tags: ['fablab', 'école', 'DIY'],
  },
  {
    id: 'doc-007',
    title: 'Étude de cas – Budget participatif de quartier',
    domain: 'Civic Engagement',
    kind: 'Case Study',
    access: 'Public',
    status: 'Published',
    updatedAt: '2024-11-30',
    owner: 'Lab Participation Citoyenne',
    tags: ['budget participatif', 'civic tech', 'gouvernance'],
  },
  {
    id: 'doc-008',
    title: 'Protocole – Facilitation d’assemblées citoyennes hybrides',
    domain: 'Civic Engagement',
    kind: 'Protocol',
    access: 'Partner',
    status: 'Draft',
    updatedAt: '2025-01-28',
    owner: 'Civic Engagement Studio',
    tags: ['assemblée', 'hybride', 'facilitation'],
  },
];

const ACCESS_FILTER_OPTIONS: { label: string; value: AccessFilter }[] = [
  { label: 'Tous les accès', value: 'all' },
  { label: 'Public', value: 'Public' },
  { label: 'Membres', value: 'Member' },
  { label: 'Partenaires', value: 'Partner' },
];

const STATUS_FILTER_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Publié', value: 'Published' },
  { label: 'Brouillon', value: 'Draft' },
];

function BrowseRepositoryPage(): JSX.Element {

  const [selectedKey, setSelectedKey] = useState<TreeKey>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const handleTreeSelect: TreeProps['onSelect'] = (keys) => {
    if (!keys || !keys.length) return;
    setSelectedKey(keys[0] as TreeKey);
  };

  const filteredData = useMemo(
    () =>
      PREVIEW_DOCUMENTS.filter((doc) => {
        // 1) Filtre par arborescence (domaine / type)
        if (selectedKey !== 'all') {
          const [domainKey, kindKey] = selectedKey.split('|') as [
            Domain | undefined,
            Kind | undefined,
          ];

          if (domainKey && doc.domain !== domainKey) {
            return false;
          }
          if (kindKey && doc.kind !== kindKey) {
            return false;
          }
        }

        // 2) Filtre par niveau d’accès
        if (accessFilter !== 'all' && doc.access !== accessFilter) {
          return false;
        }

        // 3) Filtre par statut
        if (statusFilter !== 'all' && doc.status !== statusFilter) {
          return false;
        }

        // 4) Recherche plein texte
        const trimmed = searchTerm.trim();
        if (!trimmed) return true;

        const needle = trimmed.toLowerCase();
        return (
          doc.title.toLowerCase().includes(needle) ||
          doc.owner.toLowerCase().includes(needle) ||
          doc.domain.toLowerCase().includes(needle) ||
          doc.kind.toLowerCase().includes(needle) ||
          doc.tags.some((tag) => tag.toLowerCase().includes(needle))
        );
      }),
    [selectedKey, accessFilter, statusFilter, searchTerm],
  );

  const columns: ProColumns<KnowledgeDocument>[] = useMemo(
    () => [
      {
        title: 'Titre',
        dataIndex: 'title',
        ellipsis: true,
        width: 260,
      },
      {
        title: 'Domaine',
        dataIndex: 'domain',
        width: 150,
        filters: DOMAINS.map((domain) => ({ text: domain, value: domain })),
        onFilter: (value, record) => record.domain === (value as Domain),
      },
      {
        title: 'Type',
        dataIndex: 'kind',
        width: 150,
        filters: KINDS.map((kind) => ({ text: kind, value: kind })),
        onFilter: (value, record) => record.kind === (value as Kind),
      },
      {
        title: 'Accès',
        dataIndex: 'access',
        width: 120,
        render: (_dom, row) => {
          let color: string = 'default';

          if (row.access === 'Public') color = 'green';
          if (row.access === 'Member') color = 'blue';
          if (row.access === 'Partner') color = 'purple';

          return <Tag color={color}>{row.access}</Tag>;
        },
      },
      {
        title: 'Statut',
        dataIndex: 'status',
        width: 120,
        render: (_dom, row) => (
          <Tag color={row.status === 'Published' ? 'green' : 'gold'}>
            {row.status === 'Published' ? 'Publié' : 'Brouillon'}
          </Tag>
        ),
      },
      {
        title: 'Mise à jour',
        dataIndex: 'updatedAt',
        valueType: 'date',
        width: 130,
      },
      {
        title: 'Propriétaire',
        dataIndex: 'owner',
        width: 180,
      },
      {
        title: 'Tags',
        dataIndex: 'tags',
        search: false,
        render: (_dom, row) => (
          <Space size={4} wrap>
            {row.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        ),
      },
      {
        title: 'Actions',
        valueType: 'option',
        width: 120,
        render: () => [
          <Text key="preview" type="secondary">
            Preview only
          </Text>,
        ],
      },
    ],
    [],
  );

  return (
    <KeenPage
      title="Parcourir le dépôt de connaissances"
      description="Parcourez et filtrez les ressources KeenKonnect par domaine, type, niveau d’accès et statut."
    >
      <Alert
        type="info"
        showIcon
        message="Knowledge repository preview"
        description="The general knowledge-document repository is not backed by a dedicated persistence contract in this build. The records below are declared preview data; project-attached resources remain separate."
        style={{ marginBottom: 16 }}
      />
      <Row gutter={[24, 24]}>
        {/* Panneau de gauche : arbre de navigation */}
        <Col xs={24} lg={6}>
          <Card
            size="small"
            bordered={false}
            title="Arborescence du dépôt"
            headStyle={{ fontWeight: 600 }}
          >
            <Text type="secondary">
              Naviguez par domaine et type de ressource pour filtrer la liste à
              droite.
            </Text>

            <div style={{ marginTop: 16 }}>
              <Tree
                showIcon
                blockNode
                defaultExpandAll
                selectedKeys={[selectedKey]}
                onSelect={handleTreeSelect}
                treeData={treeData}
              />
            </div>
          </Card>
        </Col>

        {/* Panneau de droite : recherche + ProTable */}
        <Col xs={24} lg={18}>
          <Card
            size="small"
            bordered={false}
            title={
              <Space direction="vertical" size={0}>
                <Title level={4} style={{ margin: 0 }}>
                  Parcourir les ressources
                </Title>
                <Text type="secondary">
                  Combinez l’arborescence, la recherche et les filtres pour
                  trouver rapidement les ressources KeenKonnect.
                </Text>
              </Space>
            }
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Space
                wrap
                style={{
                  width: '100%',
                  justifyContent: 'space-between',
                  rowGap: 16,
                }}
              >
                <Search
                  placeholder="Rechercher par titre, tag, propriétaire…"
                  allowClear
                  style={{ maxWidth: 360 }}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onSearch={(value) => setSearchTerm(value.trim())}
                />

                <Space wrap>
                  <Select<AccessFilter>
                    allowClear
                    placeholder="Niveau d'accès"
                    style={{ minWidth: 160 }}
                    value={accessFilter === 'all' ? undefined : accessFilter}
                    onChange={(value) => setAccessFilter(value ?? 'all')}
                    options={ACCESS_FILTER_OPTIONS}
                  />
                  <Select<StatusFilter>
                    allowClear
                    placeholder="Statut"
                    style={{ minWidth: 160 }}
                    value={statusFilter === 'all' ? undefined : statusFilter}
                    onChange={(value) => setStatusFilter(value ?? 'all')}
                    options={STATUS_FILTER_OPTIONS}
                  />
                </Space>
              </Space>

              <ProTable<KnowledgeDocument>
                rowKey="id"
                search={false}
                options={false}
                toolBarRender={false}
                size="small"
                dataSource={filteredData}
                columns={columns}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: false,
                }}
              />
            </Space>
          </Card>
        </Col>
      </Row>
    </KeenPage>
  );
}

export default BrowseRepositoryPage;
