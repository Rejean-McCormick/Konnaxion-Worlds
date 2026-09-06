// FILE: frontend/app/teambuilder/problems/taxonomy/page.tsx
'use client';

import {
  BookOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SaveOutlined,
  TagOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Cascader,
  Col,
  Divider,
  Input,
  Popover,
  Row,
  Space,
  Tag,
  Tooltip,
  Tree,
  TreeSelect,
  Typography,
} from 'antd';
import type { DefaultOptionType } from 'antd/es/cascader';
import type { DataNode } from 'antd/es/tree';
import React, { useMemo, useState } from 'react';

import TeamBuilderPageShell from '@/components/teambuilder/TeamBuilderPageShell';

const { Text, Paragraph } = Typography;
const { Search } = Input;

/**
 * NOTE:
 * This uses a very small illustrative subset of a UNESCO-like taxonomy.
 * In a real implementation you would likely fetch this from an API or
 * import a static JSON file representing the full hierarchy.
 */

type TaxonomyNode = DataNode & {
  key: string;
  title: string;
  description?: string;
  children?: TaxonomyNode[];
};

const UNESCO_TREE: TaxonomyNode[] = [
  {
    key: '1',
    title: 'Natural Sciences',
    description:
      'Physics, chemistry, earth and space sciences, environmental sciences, mathematics, computer and information sciences.',
    children: [
      {
        key: '1.1',
        title: 'Mathematics',
        description: 'Pure and applied mathematics, statistics.',
        children: [
          {
            key: '1.1.1',
            title: 'Pure mathematics',
            description: 'Algebra, analysis, geometry, topology, etc.',
          },
          {
            key: '1.1.2',
            title: 'Applied mathematics',
            description: 'Operations research, mathematical modelling.',
          },
        ],
      },
      {
        key: '1.2',
        title: 'Computer and information sciences',
        description: 'Computer science, information systems, AI, data science.',
        children: [
          {
            key: '1.2.1',
            title: 'Artificial intelligence & machine learning',
            description: 'AI systems, ML, pattern recognition.',
          },
          {
            key: '1.2.2',
            title: 'Human–computer interaction',
            description: 'UX, interaction design, accessibility.',
          },
        ],
      },
    ],
  },
  {
    key: '2',
    title: 'Engineering & Technology',
    description:
      'Civil, electrical, electronic, mechanical, materials, medical engineering, environmental engineering, etc.',
    children: [
      {
        key: '2.1',
        title: 'Civil engineering',
        description:
          'Infrastructure, construction, transportation systems, urban planning (engineering aspects).',
      },
      {
        key: '2.2',
        title: 'Environmental engineering',
        description: 'Water, waste, air quality, sustainable systems.',
      },
      {
        key: '2.3',
        title: 'Medical engineering',
        description: 'Biomedical engineering, medical devices, health tech.',
      },
    ],
  },
  {
    key: '3',
    title: 'Social Sciences',
    description:
      'Psychology, economics, sociology, law, political science, educational sciences.',
    children: [
      {
        key: '3.1',
        title: 'Psychology',
        description: 'Cognitive, social, organisational psychology.',
      },
      {
        key: '3.2',
        title: 'Educational sciences',
        description: 'Pedagogy, learning science, didactics.',
      },
      {
        key: '3.3',
        title: 'Economics & business',
        description: 'Economics, management, entrepreneurship.',
      },
    ],
  },
];

type FlatTaxonomyNode = {
  key: string;
  title: string;
  path: string[];
  description?: string;
};

function flattenTree(
  nodes: TaxonomyNode[],
  parentPath: string[] = [],
): FlatTaxonomyNode[] {
  const result: FlatTaxonomyNode[] = [];
  nodes.forEach(node => {
    const currentPath = [...parentPath, node.title];
    result.push({
      key: node.key,
      title: node.title,
      path: currentPath,
      description: node.description,
    });
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, currentPath));
    }
  });
  return result;
}

const FLAT_TAXONOMY: FlatTaxonomyNode[] = flattenTree(UNESCO_TREE);

/**
 * Map the tree to Cascader options.
 */
const toCascaderOptions = (nodes: TaxonomyNode[]): DefaultOptionType[] =>
  nodes.map(node => ({
    value: node.key,
    label: node.title,
    children: node.children ? toCascaderOptions(node.children) : undefined,
  }));

const CASCADER_OPTIONS = toCascaderOptions(UNESCO_TREE);

export default function TaxonomyExplorerPage(): JSX.Element {
  const [searchValue, setSearchValue] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(['1', '2', '3']);
  const [autoExpandParent, setAutoExpandParent] = useState(true);

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [favourites, setFavourites] = useState<string[]>([]);

  const [treeSelectValue, setTreeSelectValue] = useState<string[]>([]);
  const [cascaderValue, setCascaderValue] = useState<string[][]>([]);

  const searchMatches = useMemo(
    () =>
      searchValue.trim().length === 0
        ? []
        : FLAT_TAXONOMY.filter(item =>
            item.title.toLowerCase().includes(searchValue.toLowerCase()),
          ),
    [searchValue],
  );

  const handleSearchChange = (value: string) => {
    setSearchValue(value);

    if (!value) {
      setExpandedKeys(['1', '2', '3']);
      setAutoExpandParent(false);
      return;
    }

    const matchedKeys = searchMatches.map(match => match.key);
    setExpandedKeys(matchedKeys);
    setAutoExpandParent(true);
  };

  const handleTreeSelect = (keys: React.Key[]) => {
    const strKeys = keys.map(String);
    setSelectedKeys(strKeys);
  };

  const handleAddToFavourites = () => {
    const merged = Array.from(new Set([...favourites, ...selectedKeys]));
    setFavourites(merged);
  };

  const handleClearFavourites = () => {
    setFavourites([]);
  };

  const handleResetAll = () => {
    setSearchValue('');
    setExpandedKeys(['1', '2', '3']);
    setAutoExpandParent(false);
    setSelectedKeys([]);
    setFavourites([]);
    setTreeSelectValue([]);
    setCascaderValue([]);
  };

  const favouriteNodes = useMemo(
    () => FLAT_TAXONOMY.filter(node => favourites.includes(node.key)),
    [favourites],
  );

  const tooltipForNode = (key: string): string | undefined => {
    const node = FLAT_TAXONOMY.find(n => n.key === key);
    return node?.description;
  };

  return (
    <TeamBuilderPageShell
      title="UNESCO taxonomy explorer"
      subtitle={
        <Space direction="vertical" size={8}>
          <Text type="secondary">
            Browse and curate the UNESCO-style taxonomy of problem domains. Use this
            explorer to pick the domains you want problem templates to reference.
          </Text>
        </Space>
      }
      sectionLabel="Problems"
      maxWidth={1200}
      primaryAction={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleResetAll}>
            Reset all
          </Button>
          <Button type="primary" icon={<SaveOutlined />}>
            Save favourites
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="What is this taxonomy?"
          description={
            <Space direction="vertical">
              <Paragraph type="secondary" style={{ marginBottom: 4 }}>
                The UNESCO taxonomy organizes knowledge domains into a consistent
                hierarchy. By selecting favourite nodes, you decide which domains and
                subdomains will appear when creating problem templates in Team Builder.
              </Paragraph>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                This does not restrict what teams can work on by itself; it just makes
                it easier to classify problems and reason about coverage and diversity.
              </Paragraph>
            </Space>
          }
        />

        {/* Main layout */}
        <Row gutter={[16, 16]}>
          {/* Left: tree + search */}
          <Col xs={24} md={14}>
            <Card
              title={
                <Space>
                  <BookOutlined />
                  <span>Taxonomy tree</span>
                </Space>
              }
              extra={
                <Tooltip title="Use the search box to quickly find a domain; select nodes to mark them as favourites.">
                  <InfoCircleOutlined />
                </Tooltip>
              }
            >
              <Space
                direction="vertical"
                style={{ width: '100%', marginBottom: 16 }}
                size="middle"
              >
                <Search
                  placeholder="Search taxonomy nodes (e.g. AI, psychology, mathematics)…"
                  value={searchValue}
                  onChange={e => handleSearchChange(e.target.value)}
                  allowClear
                  enterButton={<FilterOutlined />}
                />

                {searchValue && (
                  <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    {searchMatches.length === 0 ? (
                      <>No taxonomy nodes match “{searchValue}”.</>
                    ) : (
                      <>
                        <Text strong>{searchMatches.length}</Text> node(s) match “
                        {searchValue}”.
                      </>
                    )}
                  </Paragraph>
                )}
              </Space>

              <Tree
                checkable
                selectable
                showLine
                treeData={UNESCO_TREE}
                expandedKeys={expandedKeys}
                onExpand={keys => {
                  setExpandedKeys(keys);
                  setAutoExpandParent(false);
                }}
                autoExpandParent={autoExpandParent}
                checkedKeys={selectedKeys}
                onCheck={keys => handleTreeSelect(keys as React.Key[])}
                titleRender={node => {
                  const key = String(node.key);
                  const desc = tooltipForNode(key);
                  const isFavourite = favourites.includes(key);

                  const titleNode = (
                    <Space size={4}>
                      <span>{node.title}</span>
                      {isFavourite && (
                        <Tag
                          icon={<TagOutlined />}
                          color="blue"
                          style={{ marginLeft: 4 }}
                        >
                          Favourite
                        </Tag>
                      )}
                    </Space>
                  );

                  return desc ? (
                    <Popover
                      placement="right"
                      content={
                        <div style={{ maxWidth: 280 }}>
                          <Paragraph strong style={{ marginBottom: 4 }}>
                            {node.title}
                          </Paragraph>
                          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                            {desc}
                          </Paragraph>
                        </div>
                      }
                    >
                      {titleNode}
                    </Popover>
                  ) : (
                    titleNode
                  );
                }}
                style={{ maxHeight: 480, overflow: 'auto', marginTop: 8 }}
              />

              <Divider />

              <Space>
                <Button
                  type="primary"
                  icon={<TagOutlined />}
                  disabled={selectedKeys.length === 0}
                  onClick={handleAddToFavourites}
                >
                  Add selected to favourites
                </Button>
                <Button onClick={() => setSelectedKeys([])}>Clear selection</Button>
              </Space>
            </Card>
          </Col>

          {/* Right: alternative selection + favourites */}
          <Col xs={24} md={10}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card
                title={
                  <Space>
                    <FilterOutlined />
                    <span>TreeSelect & Cascader views</span>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div>
                    <Text strong>TreeSelect</Text>
                    <Paragraph type="secondary" style={{ marginBottom: 4 }}>
                      An alternative way to pick a small number of domains or subdomains.
                    </Paragraph>
                    <TreeSelect
                      treeData={UNESCO_TREE}
                      value={treeSelectValue}
                      onChange={v => setTreeSelectValue(v as string[])}
                      treeCheckable
                      showCheckedStrategy="SHOW_PARENT"
                      placeholder="Select domains via TreeSelect…"
                      style={{ width: '100%' }}
                      allowClear
                    />
                  </div>

                  <Divider />

                  <div>
                    <Text strong>Cascader</Text>
                    <Paragraph type="secondary" style={{ marginBottom: 4 }}>
                      Navigate the hierarchy step by step; useful when the tree is very
                      deep.
                    </Paragraph>
                    <Cascader
                      options={CASCADER_OPTIONS}
                      multiple
                      maxTagCount="responsive"
                      value={cascaderValue}
                      onChange={v => setCascaderValue(v as string[][])}
                      placeholder="Select one or more paths via Cascader…"
                      style={{ width: '100%' }}
                      allowClear
                    />
                  </div>
                </Space>
              </Card>

              <Card
                title={
                  <Space>
                    <TagOutlined />
                    <span>Favourite taxonomy nodes</span>
                  </Space>
                }
                extra={
                  <Button size="small" onClick={handleClearFavourites}>
                    Clear favourites
                  </Button>
                }
              >
                {favouriteNodes.length === 0 ? (
                  <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    No favourites yet. Select nodes in the tree and click “Add selected
                    to favourites”.
                  </Paragraph>
                ) : (
                  <Space wrap>
                    {favouriteNodes.map(node => (
                      <Tag
                        key={node.key}
                        color="blue"
                        icon={<BookOutlined />}
                        style={{ marginBottom: 4 }}
                      >
                        {node.path?.join(' › ') ?? node.title}
                      </Tag>
                    ))}
                  </Space>
                )}
              </Card>
            </Space>
          </Col>
        </Row>

        <Divider />

        <Alert
          type="success"
          showIcon
          message="Next step: use these domains in your problem templates"
          description={
            <Space direction="vertical">
              <Text>
                When you create or edit a problem under{' '}
                <strong>Problems → Problem library</strong>, you will be able to tag it
                with one or more of the favourite taxonomy nodes you selected here.
              </Text>
              <Text type="secondary">
                This makes it easier to search for problems, build balanced portfolios of
                teams across domains, and analyse which areas are under- or over-served.
              </Text>
            </Space>
          }
        />
      </Space>
    </TeamBuilderPageShell>
  );
}
