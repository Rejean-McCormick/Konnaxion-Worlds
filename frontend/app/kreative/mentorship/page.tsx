// FILE: frontend/app/kreative/mentorship/page.tsx
// app/kreative/mentorship/page.tsx
'use client';

import {
  AudioOutlined,
  BookOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  GlobalOutlined,
  PictureOutlined,
  TeamOutlined,
  UploadOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import {
  Alert,
  message as antdMessage,
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  List,
  Row,
  Segmented,
  Select,
  Space,
  Tag,
  Typography,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import React, { useMemo, useState } from 'react';

import KreativePageShell from '@/app/kreative/kreativePageShell';
import { createTraditionEntry } from '@/services/kreative';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

type MentorAvailability = 'Open' | 'Waitlist' | 'Full';

type Mentor = {
  id: string;
  name: string;
  discipline: string;
  tradition: string;
  region: string;
  languages: string[];
  availability: MentorAvailability;
  focusTags: string[];
  isOnline: boolean;
  avatarInitial?: string;
};

type ArchiveMediaType = 'Video' | 'Audio' | 'Photo' | 'Text';

type ArchiveItem = {
  id: string;
  title: string;
  tradition: string;
  region: string;
  mediaType: ArchiveMediaType;
  contributor: string;
  summary: string;
  year?: number;
};

type ArchiveFormValues = {
  title: string;
  tradition: string;
  region: string;
  mediaType: ArchiveMediaType;
  description: string;
  approximateYear?: string;
  media: UploadFile[];
};

// Minimal type for Upload onChange (avoid implicit any)
type UploadChangeParamLite = {
  fileList: UploadFile[];
};

/* ------------------------------------------------------------------ */
/*  Declared preview data                                             */
/* ------------------------------------------------------------------ */

const MENTOR_PREVIEW_DATA: Mentor[] = [
  {
    id: 'm1',
    name: 'Amara Ndlovu',
    discipline: 'Textile Arts',
    tradition: 'Zulu beadwork & weaving',
    region: 'Southern Africa',
    languages: ['English', 'Zulu'],
    availability: 'Open',
    focusTags: ['Beadwork', 'Weaving', 'Ceremonial attire'],
    isOnline: true,
    avatarInitial: 'A',
  },
  {
    id: 'm2',
    name: 'Kenji Sato',
    discipline: 'Performing Arts',
    tradition: 'Noh Theatre',
    region: 'Japan',
    languages: ['Japanese', 'English'],
    availability: 'Waitlist',
    focusTags: ['Theatre', 'Mask work', 'Chanting'],
    isOnline: false,
    avatarInitial: 'K',
  },
  {
    id: 'm3',
    name: 'Luz Maria Ortega',
    discipline: 'Culinary Arts',
    tradition: 'Traditional Oaxacan cuisine',
    region: 'Latin America',
    languages: ['Spanish', 'English'],
    availability: 'Open',
    focusTags: ['Cuisine', 'Festivals', 'Family recipes'],
    isOnline: true,
    avatarInitial: 'L',
  },
  {
    id: 'm4',
    name: 'Tane Mahuta',
    discipline: 'Carving & Woodcraft',
    tradition: 'Māori wood carving',
    region: 'Oceania',
    languages: ['Māori', 'English'],
    availability: 'Full',
    focusTags: ['Carving', 'Symbolism', 'Storytelling'],
    isOnline: false,
    avatarInitial: 'T',
  },
];

const ARCHIVE_PREVIEW_DATA: ArchiveItem[] = [
  {
    id: 'a1',
    title: 'Moonlight weaving circle',
    tradition: 'Zulu beadwork & weaving',
    region: 'Southern Africa',
    mediaType: 'Photo',
    contributor: 'Community Hub Durban',
    summary:
      'Documenting an intergenerational weaving circle preserving bead patterns tied to coming-of-age ceremonies.',
    year: 2022,
  },
  {
    id: 'a2',
    title: 'Noh chants for autumn festival',
    tradition: 'Noh Theatre',
    region: 'Japan',
    mediaType: 'Audio',
    contributor: 'Kyoto Culture Lab',
    summary:
      'Audio recordings of rarely performed chants used only during local harvest festivals.',
    year: 2019,
  },
  {
    id: 'a3',
    title: 'Corn and cacao ritual drinks',
    tradition: 'Oaxacan cuisine',
    region: 'Latin America',
    mediaType: 'Video',
    contributor: 'Casa de Sabores',
    summary:
      'Short video series capturing techniques behind ceremonial chocolate and corn drinks.',
    year: 2021,
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function availabilityColor(status: MentorAvailability): string {
  if (status === 'Open') return 'green';
  if (status === 'Waitlist') return 'gold';
  return 'red';
}

function mediaTypeIcon(type: ArchiveMediaType): React.ReactNode {
  switch (type) {
    case 'Video':
      return <VideoCameraOutlined />;
    case 'Audio':
      return <AudioOutlined />;
    case 'Photo':
      return <PictureOutlined />;
    case 'Text':
    default:
      return <FileTextOutlined />;
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function MentorshipPage(): JSX.Element {
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'online' | 'in-person'>('all');
  const [searchValue, setSearchValue] = useState<string>('');

  const [archiveForm] = Form.useForm<ArchiveFormValues>();
  const [archiveFiles, setArchiveFiles] = useState<UploadFile[]>([]);
  const [archiveItems, setArchiveItems] = useState<ArchiveItem[]>(ARCHIVE_PREVIEW_DATA);
  const [messageApi, messageContextHolder] = antdMessage.useMessage();

  const disciplines = useMemo(
    () => Array.from(new Set(MENTOR_PREVIEW_DATA.map((m) => m.discipline))).sort(),
    [],
  );
  const regions = useMemo(
    () => Array.from(new Set(MENTOR_PREVIEW_DATA.map((m) => m.region))).sort(),
    [],
  );

  const filteredMentors = useMemo(() => {
    return MENTOR_PREVIEW_DATA.filter((mentor) => {
      if (disciplineFilter !== 'all' && mentor.discipline !== disciplineFilter) {
        return false;
      }
      if (regionFilter !== 'all' && mentor.region !== regionFilter) {
        return false;
      }
      if (deliveryFilter === 'online' && !mentor.isOnline) return false;
      if (deliveryFilter === 'in-person' && mentor.isOnline) return false;

      if (!searchValue.trim()) return true;

      const needle = searchValue.toLowerCase();
      const haystack = [
        mentor.name,
        mentor.discipline,
        mentor.tradition,
        mentor.region,
        mentor.languages.join(' '),
        mentor.focusTags.join(' '),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [disciplineFilter, regionFilter, deliveryFilter, searchValue]);

  const handleArchiveUploadChange = (info: UploadChangeParamLite) => {
    setArchiveFiles(info.fileList);
  };

  const normalizeArchiveFile = (e: UploadChangeParamLite | UploadFile[]) => {
    if (Array.isArray(e)) return e;
    return e?.fileList ?? [];
  };

  const handleArchiveSubmit = async (values: ArchiveFormValues) => {
    const upload = archiveFiles[0]?.originFileObj;
    if (!(upload instanceof File)) {
      messageApi.error('Please attach one media file.');
      return;
    }

    const descriptionParts = [
      values.description,
      `Tradition: ${values.tradition}`,
      `Media type: ${values.mediaType}`,
      values.approximateYear ? `Approximate year: ${values.approximateYear}` : '',
    ].filter(Boolean);

    const payload = new FormData();
    payload.append('title', values.title);
    payload.append('description', descriptionParts.join('\n\n'));
    payload.append('region', values.region);
    payload.append('media_file', upload);

    try {
      const created = await createTraditionEntry(payload);
      const next: ArchiveItem = {
        id: String(created.id),
        title: values.title,
        tradition: values.tradition,
        region: values.region,
        mediaType: values.mediaType,
        contributor: created.submitted_by || 'You',
        summary: values.description,
        year: values.approximateYear
          ? Number(values.approximateYear) || undefined
          : undefined,
      };

      setArchiveItems((prev) => [next, ...prev]);
      messageApi.success('Archive contribution saved.');
      archiveForm.resetFields();
      setArchiveFiles([]);
    } catch (error) {
      messageApi.error(
        error instanceof Error
          ? error.message
          : 'Unable to save the archive contribution.',
      );
    }
  };

  const secondaryActions = (
    <Space>
      <Button icon={<TeamOutlined />} href="/kreative/collaborative-spaces/find-spaces">
        Explore spaces
      </Button>
      <Button icon={<BookOutlined />} href="/kreative/creative-hub/explore-ideas">
        Explore ideas
      </Button>
    </Space>
  );

  return (
    <KreativePageShell
      title="Mentorship & Cultural Archive"
      subtitle="Connect with mentors and help preserve cultural traditions and endangered practices."
      secondaryActions={secondaryActions}
    >
      {messageContextHolder}
      {/* Intro + How it works */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={10}>
          <Card>
            <Title level={4} style={{ marginBottom: 12 }}>
              How the mentorship program works
            </Title>
            <Paragraph type="secondary">
              This page combines a declared mentor-directory preview with a real persisted cultural-archive contribution flow.
            </Paragraph>
            <ul style={{ paddingLeft: 20, marginTop: 8, marginBottom: 0 }}>
              <li>
                <Text>
                  Browse <Text strong>mentors</Text> by discipline, region, or delivery mode.
                </Text>
              </li>
              <li>
                <Text>
                  Mentor discovery is preview-only; request delivery is not exposed by the current backend.
                </Text>
              </li>
              <li>
                <Text>
                  Use the form below to <Text strong>contribute media</Text> to the archive:
                  photos, audio, videos, or written descriptions.
                </Text>
              </li>
            </ul>
            <Alert
              type="info"
              showIcon
              style={{ marginTop: 16 }}
              message="Archive contributions are persisted through Kreative. Mentor-request delivery remains preview-only until a dedicated contract exists."
            />
          </Card>
        </Col>

        {/* Filters summary */}
        <Col xs={24} lg={14}>
          <Card title="Find a mentor">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Text strong style={{ display: 'block', marginBottom: 4 }}>
                  Discipline
                </Text>
                <Select
                  value={disciplineFilter}
                  onChange={(value) => setDisciplineFilter(value)}
                  style={{ width: '100%' }}
                  placeholder="All disciplines"
                  allowClear={false}
                >
                  <Option value="all">All disciplines</Option>
                  {disciplines.map((d) => (
                    <Option key={d} value={d}>
                      {d}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={8}>
                <Text strong style={{ display: 'block', marginBottom: 4 }}>
                  Region
                </Text>
                <Select
                  value={regionFilter}
                  onChange={(value) => setRegionFilter(value)}
                  style={{ width: '100%' }}
                  placeholder="All regions"
                  allowClear={false}
                >
                  <Option value="all">All regions</Option>
                  {regions.map((r) => (
                    <Option key={r} value={r}>
                      {r}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={8}>
                <Text strong style={{ display: 'block', marginBottom: 4 }}>
                  Delivery
                </Text>
                <Segmented
                  block
                  value={deliveryFilter}
                  onChange={(value) =>
                    setDeliveryFilter(value as 'all' | 'online' | 'in-person')
                  }
                  options={[
                    { label: 'All', value: 'all' },
                    { label: 'Online', value: 'online' },
                    { label: 'In person', value: 'in-person' },
                  ]}
                />
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Input.Search
                  placeholder="Search by mentor name, tradition, language…"
                  allowClear
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Mentors list */}
      <Card
        title="Mentors & opportunities"
        extra={
          <Text type="secondary">
            Showing <strong>{filteredMentors.length}</strong> of {MENTOR_PREVIEW_DATA.length} mentors
          </Text>
        }
        style={{ marginBottom: 32 }}
      >
        {filteredMentors.length === 0 ? (
          <Empty description="No mentors match your filters yet." />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={filteredMentors}
            renderItem={(mentor) => (
              <List.Item
                key={mentor.id}
                actions={[
                  <Button
                    key="request"
                    type="primary"
                    disabled
                    title="Mentorship request delivery is not exposed by the backend yet."
                  >
                    Request unavailable
                  </Button>,
                  <Button
                    key="details"
                    type="link"
                    disabled
                    title="Mentor profile details are preview-only in this build."
                  >
                    Details unavailable
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar>
                      {mentor.avatarInitial ??
                        mentor.name.charAt(0).toUpperCase()}
                    </Avatar>
                  }
                  title={
                    <Space size="small" wrap>
                      <Text strong>{mentor.name}</Text>
                      <Tag color={availabilityColor(mentor.availability)}>
                        {mentor.availability}
                      </Tag>
                      {mentor.isOnline ? (
                        <Tag icon={<GlobalOutlined />}>Online sessions</Tag>
                      ) : (
                        <Tag icon={<EnvironmentOutlined />}>In-person only</Tag>
                      )}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text>
                        <Text strong>Discipline:</Text> {mentor.discipline}
                      </Text>
                      <Text>
                        <Text strong>Tradition:</Text> {mentor.tradition}
                      </Text>
                      <Space size="small" wrap>
                        <Tag>{mentor.region}</Tag>
                        {mentor.languages.map((lang) => (
                          <Tag key={lang}>{lang}</Tag>
                        ))}
                      </Space>
                      <Space size={[4, 4]} wrap>
                        {mentor.focusTags.map((tag) => (
                          <Tag key={tag} color="blue">
                            {tag}
                          </Tag>
                        ))}
                      </Space>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Divider />

      {/* Archive: form + gallery */}
      <Row gutter={[24, 24]}>
        {/* Submission form */}
        <Col xs={24} lg={12}>
          <Card
            title="Contribute to the Cultural Archive"
            extra={<Tag color="success">Persisted</Tag>}
            style={{ marginBottom: 24 }}
          >
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              Share media documenting a cultural practice, ritual, or art form. Submissions are stored as Kreative tradition entries.
            </Paragraph>

            <Form<ArchiveFormValues>
              layout="vertical"
              form={archiveForm}
              onFinish={handleArchiveSubmit}
            >
              <Form.Item
                label="Title of the contribution"
                name="title"
                rules={[{ required: true, message: 'Please enter a title' }]}
              >
                <Input placeholder="e.g., Harvest dance in the northern valley" />
              </Form.Item>

              <Form.Item
                label="Tradition or practice"
                name="tradition"
                rules={[{ required: true, message: 'Please describe the tradition' }]}
              >
                <Input placeholder="e.g., Noh Theatre autumn performance" />
              </Form.Item>

              <Form.Item
                label="Region / community"
                name="region"
                rules={[{ required: true, message: 'Please specify a region or community' }]}
              >
                <Input
                  prefix={<EnvironmentOutlined />}
                  placeholder="e.g., Kyoto, Japan / local community name"
                />
              </Form.Item>

              <Form.Item
                label="Media type"
                name="mediaType"
                rules={[{ required: true, message: 'Please select a media type' }]}
              >
                <Select placeholder="Choose one">
                  <Option value="Video">Video</Option>
                  <Option value="Audio">Audio</Option>
                  <Option value="Photo">Photo</Option>
                  <Option value="Text">Text / transcript only</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Approximate year (optional)"
                name="approximateYear"
                tooltip="Use a 4-digit year, e.g., 1998"
              >
                <Input maxLength={4} placeholder="e.g., 2015" />
              </Form.Item>

              <Form.Item
                label="Description & context"
                name="description"
                rules={[
                  { required: true, message: 'Please provide a short description' },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Explain when this practice happens, who participates, and why it matters."
                />
              </Form.Item>

              <Form.Item
                label="Upload media"
                name="media"
                valuePropName="fileList"
                getValueFromEvent={normalizeArchiveFile}
                rules={[
                  {
                    validator: (_, value: UploadFile[]) =>
                      value && value.length
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error('Please attach at least one media file'),
                          ),
                  },
                ]}
              >
                <Upload
                  maxCount={1}
                  beforeUpload={() => false}
                  onChange={handleArchiveUploadChange}
                  fileList={archiveFiles}
                >
                  <Button icon={<UploadOutlined />}>Select file(s)</Button>
                </Upload>
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    Submit contribution
                  </Button>
                  <Button
                    onClick={() => {
                      archiveForm.resetFields();
                      setArchiveFiles([]);
                    }}
                  >
                    Reset
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Archive gallery */}
        <Col xs={24} lg={12}>
          <Card
            title="Archive highlights"
            extra={
              <Space>
                <GlobalOutlined />
                <Text type="secondary">Sample entries (front-end only)</Text>
              </Space>
            }
          >
            {archiveItems.length === 0 ? (
              <Empty description="No archive items yet." />
            ) : (
              <List
                itemLayout="vertical"
                dataSource={archiveItems}
                renderItem={(item) => (
                  <List.Item key={item.id}>
                    <List.Item.Meta
                      title={
                        <Space direction="vertical" size={0}>
                          <Space>
                            <Text strong>{item.title}</Text>
                            <Tag icon={mediaTypeIcon(item.mediaType)}>
                              {item.mediaType}
                            </Tag>
                          </Space>
                          <Space size="small" wrap>
                            <Tag icon={<EnvironmentOutlined />}>{item.region}</Tag>
                            <Tag>{item.tradition}</Tag>
                            {item.year && <Tag color="geekblue">{item.year}</Tag>}
                          </Space>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Paragraph
                            style={{ marginBottom: 4 }}
                            ellipsis={{ rows: 3, expandable: false }}
                          >
                            {item.summary}
                          </Paragraph>
                          <Text type="secondary">Contributor: {item.contributor}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </KreativePageShell>
  );
}
