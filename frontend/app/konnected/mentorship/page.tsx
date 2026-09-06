// FILE: frontend/app/konnected/mentorship/page.tsx
// app/konnected/mentorship/page.tsx
'use client';

import {
  FilterOutlined,
  MessageOutlined,
  StarFilled,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Alert,
  Divider,
  Empty,
  Form,
  Input,
  List,
  message,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';

import KonnectedPageShell from '@/app/konnected/KonnectedPageShell';
import api from '@/services/_request';

const { Text, Paragraph, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

type MentorLevel = 'primary' | 'secondary' | 'adult';

type MentorApi = {
  id: number | string;
  display_name?: string;
  user?: string;
  bio?: string;
  expertise_areas?: string[] | null;
  languages?: string[] | null;
  level?: MentorLevel | '';
  rating?: number | string | null;
  sessions_completed?: number;
  is_active?: boolean;
  is_accepting_mentees?: boolean;
  focus_areas?: string[] | null;
};

type Mentor = {
  id: string;
  name: string;
  expertise: string[];
  languages: string[];
  level: MentorLevel;
  rating: number;
  sessionsCompleted: number;
  isAvailable: boolean;
  bio: string;
  focusAreas: string[];
};

type AvailabilityFilter = 'all' | 'available';

type FilterState = {
  subject?: string;
  level?: MentorLevel | 'all';
  language?: string;
  availability: AvailabilityFilter;
};

type MentorshipRequestFormValues = {
  learningGoal: string;
  preferredLanguage?: string;
  ageGroup?: string;
  contactChannel?: string;
  additionalNotes?: string;
};

function toMentor(row: MentorApi): Mentor {
  return {
    id: String(row.id),
    name: row.display_name?.trim() || row.user?.trim() || `Mentor ${row.id}`,
    expertise: row.expertise_areas ?? [],
    languages: row.languages ?? [],
    level: row.level || 'adult',
    rating: Number(row.rating ?? 0),
    sessionsCompleted: row.sessions_completed ?? 0,
    isAvailable: Boolean(row.is_accepting_mentees),
    bio: row.bio ?? '',
    focusAreas: row.focus_areas ?? [],
  };
}

const SUBJECT_OPTIONS = [
  'Any',
  'STEM',
  'Languages',
  'Digital literacy',
  'Civics & Ethics',
  'Study skills',
];

const LEVEL_OPTIONS: { label: string; value: MentorLevel | 'all' }[] = [
  { label: 'All levels', value: 'all' },
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Adult / Lifelong learning', value: 'adult' },
];

const LANGUAGE_OPTIONS = ['Any', 'English', 'French', 'Spanish', 'Arabic', 'Other'];

export default function KonnectedMentorshipPage() {
  const [filters, setFilters] = useState<FilterState>({
    subject: 'Any',
    level: 'all',
    language: 'Any',
    availability: 'available',
  });
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(true);
  const [mentorError, setMentorError] = useState<string | null>(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [form] = Form.useForm<MentorshipRequestFormValues>();

  useEffect(() => {
    let cancelled = false;

    async function loadMentors() {
      setLoadingMentors(true);
      setMentorError(null);

      try {
        const rows = await api.get<MentorApi[]>('konnected/mentors/');
        if (!cancelled) {
          setMentors(rows.map(toMentor));
        }
      } catch (error) {
        console.error('Failed to load KonnectED mentors', error);
        if (!cancelled) {
          setMentorError('Unable to load mentors right now.');
        }
      } finally {
        if (!cancelled) {
          setLoadingMentors(false);
        }
      }
    }

    void loadMentors();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredMentors = useMemo(() => {
    return mentors.filter((mentor) => {
      if (filters.availability === 'available' && !mentor.isAvailable) {
        return false;
      }

      if (filters.level && filters.level !== 'all' && mentor.level !== filters.level) {
        return false;
      }

      if (filters.language && filters.language !== 'Any') {
        if (!mentor.languages.includes(filters.language)) {
          return false;
        }
      }

      if (filters.subject && filters.subject !== 'Any') {
        const subject = filters.subject.toLowerCase();
        const expertiseMatch = mentor.expertise.some((e) =>
          e.toLowerCase().includes(subject),
        );
        if (!expertiseMatch) {
          return false;
        }
      }

      return true;
    });
  }, [filters, mentors]);

  const handleOpenRequest = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setRequestModalOpen(true);
  };

  const handleCloseRequest = () => {
    setRequestModalOpen(false);
    form.resetFields();
  };

  const handleSubmitRequest = async (values: MentorshipRequestFormValues) => {
    if (!selectedMentor) {
      message.error('Choose a mentor before submitting a request.');
      return;
    }

    setSubmittingRequest(true);
    try {
      await api.post('konnected/mentorship-requests/', {
        mentor: Number(selectedMentor.id),
        learning_goal: values.learningGoal.trim(),
        preferred_language: values.preferredLanguage ?? '',
        age_group: values.ageGroup ?? '',
        contact_channel: values.contactChannel ?? '',
        additional_notes: values.additionalNotes ?? '',
      });

      message.success('Your mentorship request has been recorded.');
      handleCloseRequest();
    } catch (error) {
      console.error('Failed to create mentorship request', error);
      message.error('Unable to submit the mentorship request.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      subject: 'Any',
      level: 'all',
      language: 'Any',
      availability: 'available',
    });
  };

  return (
    <KonnectedPageShell
      title="Mentorship"
      subtitle="Connect with volunteer mentors and join cross-age learning circles."
      primaryAction={
        <Button icon={<TeamOutlined />} href="#learning-circles">
          Browse learning circles
        </Button>
      }
      secondaryActions={
        <Button icon={<FilterOutlined />} onClick={handleResetFilters}>
          Reset filters
        </Button>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Filter mentors" extra={<FilterOutlined />}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Subject focus</Text>
                <Select
                  style={{ width: '100%', marginTop: 4 }}
                  value={filters.subject}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      subject: value,
                    }))
                  }
                >
                  {SUBJECT_OPTIONS.map((subject) => (
                    <Option key={subject} value={subject}>
                      {subject}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <Text strong>Level</Text>
                <Radio.Group
                  style={{ marginTop: 4 }}
                  value={filters.level}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      level: e.target.value as FilterState['level'],
                    }))
                  }
                >
                  {LEVEL_OPTIONS.map((opt) => (
                    <Radio.Button key={opt.value} value={opt.value}>
                      {opt.label}
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </div>

              <div>
                <Text strong>Language</Text>
                <Select
                  style={{ width: '100%', marginTop: 4 }}
                  value={filters.language}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      language: value,
                    }))
                  }
                >
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <Option key={lang} value={lang}>
                      {lang}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <Text strong>Availability</Text>
                <Radio.Group
                  style={{ marginTop: 4 }}
                  value={filters.availability}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      availability: e.target.value as AvailabilityFilter,
                    }))
                  }
                >
                  <Radio value="available">Currently available</Radio>
                  <Radio value="all">Show all mentors</Radio>
                </Radio.Group>
              </div>
            </Space>
          </Card>

          <Card style={{ marginTop: 16 }} title="How mentorship works">
            <Space direction="vertical" size="small">
              <Paragraph>
                Mentors are volunteers who support learners with specific goals:
                homework help, exam preparation, career guidance, or exploring new
                subjects.
              </Paragraph>
              <Paragraph>
                Once your request is accepted, you will be matched with a mentor or
                invited into a cross-age learning circle with peers and older
                mentors.
              </Paragraph>
              <Paragraph>
                For youth accounts, guardian approval may be required before live
                sessions are scheduled.
              </Paragraph>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <UserOutlined />
                <span>Available mentors</span>
              </Space>
            }
            extra={
              <Text type="secondary">
                {filteredMentors.length} of {mentors.length} mentors shown
              </Text>
            }
          >
            {mentorError && (
              <Alert
                type="error"
                showIcon
                message={mentorError}
                style={{ marginBottom: 16 }}
              />
            )}
            {loadingMentors ? (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <Spin />
              </div>
            ) : filteredMentors.length === 0 ? (
              <Empty
                description="No mentors match your current filters. Try resetting or broadening your selection."
                style={{ padding: '24px 0' }}
              />
            ) : (
              <List
                itemLayout="vertical"
                dataSource={filteredMentors}
                renderItem={(mentor) => (
                  <List.Item
                    key={mentor.id}
                    actions={[
                      <Space key="rating">
                        <StarFilled style={{ color: '#faad14' }} />
                        <Text>
                          {mentor.rating.toFixed(1)} · {mentor.sessionsCompleted} sessions
                        </Text>
                      </Space>,
                      <Button
                        key="request"
                        type="link"
                        icon={<MessageOutlined />}
                        onClick={() => handleOpenRequest(mentor)}
                        disabled={!mentor.isAvailable}
                      >
                        {mentor.isAvailable ? 'Request mentorship' : 'Join waitlist'}
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar size="large" icon={<UserOutlined />} />}
                      title={
                        <Space wrap>
                          <Text strong>{mentor.name}</Text>
                          {mentor.isAvailable ? (
                            <Badge status="success" text="Available" />
                          ) : (
                            <Badge status="default" text="Waitlist" />
                          )}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={4}>
                          <Space wrap>
                            {mentor.expertise.map((area) => (
                              <Tag key={area}>{area}</Tag>
                            ))}
                          </Space>
                          <Text type="secondary">
                            Speaks: {mentor.languages.join(', ')} · Level:{' '}
                            {mentor.level === 'primary'
                              ? 'Primary'
                              : mentor.level === 'secondary'
                              ? 'Secondary'
                              : 'Adult / lifelong'}
                          </Text>
                        </Space>
                      }
                    />
                    <Paragraph style={{ marginTop: 8 }}>{mentor.bio}</Paragraph>
                    <Space wrap>
                      {mentor.focusAreas.map((area) => (
                        <Tag key={area} color="blue">
                          {area}
                        </Tag>
                      ))}
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>

          {/* Divider does not receive id – keep it purely presentational */}
          <Divider />

          {/* Anchor target lives on the Card, which is valid HTML and TS-safe */}
          <Card
            id="learning-circles"
            title={
              <Space>
                <TeamOutlined />
                <span>Cross-age learning circles</span>
              </Space>
            }
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Paragraph>
                Learning circles are small groups of learners supported by one or more
                mentors. They meet regularly to work on shared projects, practice
                languages, or explore a topic together.
              </Paragraph>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card size="small" variant="borderless">
                    <Title level={5}>Project-based circles</Title>
                    <Paragraph type="secondary">
                      Work on a concrete project (science fair, community initiative,
                      storytelling series) with peers and mentors guiding you through
                      each step.
                    </Paragraph>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card size="small" variant="borderless">
                    <Title level={5}>Skill-building circles</Title>
                    <Paragraph type="secondary">
                      Focus on specific skills like reading fluency, math basics, or
                      digital literacy in a supportive, multi-age group.
                    </Paragraph>
                  </Card>
                </Col>
              </Row>
              <Button type="primary" icon={<TeamOutlined />}>
                Express interest in a learning circle
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          selectedMentor
            ? `Request mentorship with ${selectedMentor.name}`
            : 'Request mentorship'
        }
        open={requestModalOpen}
        onCancel={handleCloseRequest}
        footer={null}
        destroyOnHidden
      >
        <Form<MentorshipRequestFormValues>
          layout="vertical"
          form={form}
          onFinish={handleSubmitRequest}
        >
          <Form.Item
            label="What would you like to work on?"
            name="learningGoal"
            rules={[
              {
                required: true,
                message: 'Please describe your learning goal.',
              },
            ]}
          >
            <TextArea
              rows={3}
              placeholder="Example: I need help preparing for my science exam."
            />
          </Form.Item>

          <Form.Item label="Preferred language" name="preferredLanguage">
            <Select placeholder="Choose a language (optional)">
              {LANGUAGE_OPTIONS.filter((l) => l !== 'Any').map((lang) => (
                <Option key={lang} value={lang}>
                  {lang}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Age group" name="ageGroup">
            <Select placeholder="Select your age group">
              <Option value="primary">Primary (approx. 6–12)</Option>
              <Option value="secondary">Secondary (approx. 13–18)</Option>
              <Option value="adult">Adult / Lifelong learner</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Preferred contact channel" name="contactChannel">
            <Radio.Group>
              <Radio value="messaging">In-app messaging</Radio>
              <Radio value="video">Video or audio sessions</Radio>
              <Radio value="either">Either is fine</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="Additional notes (optional)" name="additionalNotes">
            <TextArea
              rows={3}
              placeholder="Share any constraints (schedule, accessibility needs, guardian contact, etc.)."
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleCloseRequest}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<MessageOutlined />}
                loading={submittingRequest}
              >
                Submit request
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </KonnectedPageShell>
  );
}
