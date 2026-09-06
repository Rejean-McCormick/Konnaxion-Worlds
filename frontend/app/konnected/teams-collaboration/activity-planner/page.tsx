// FILE: frontend/app/konnected/teams-collaboration/activity-planner/page.tsx
// app/konnected/teams-collaboration/activity-planner/page.tsx
'use client';

import { PlusOutlined } from '@ant-design/icons';
import type { CalendarProps } from 'antd';
import {
  Button,
  Calendar,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  List,
  message,
  Modal,
  Row,
  Select,
  Tag,
  TimePicker,
  Typography,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import React, { useMemo, useState } from 'react';

import KonnectedPageShell from '@/app/konnected/KonnectedPageShell';

const { Title, Text, Paragraph } = Typography;

/** Domain types */
type ActivityType = 'Workshop' | 'Check-in' | 'Live Session' | 'Async Sprint';

interface ActivityEvent {
  id: string;
  title: string;
  description: string;
  /** Stored as Dayjs (AntD v5 default) */
  dateTime: Dayjs;
  owner: string;
  team: string;
  activityType?: ActivityType;
  /** Optional linkage to other KonnectED sub-modules */
  linkedLearningPathLabel?: string;
  linkedResourceLabel?: string;
}

interface ActivityFormValues {
  eventTitle: string;
  eventDescription?: string;
  eventDate?: Dayjs | null;
  eventTime?: Dayjs | null;
  team?: string;
  owner?: string;
  activityType?: ActivityType;
  linkedLearningPathLabel?: string;
  linkedResourceLabel?: string;
}

/** Team list for filter and form */
const teamOptions = ['All', 'Alpha Innovators', 'Beta Coders', 'Gamma Team'] as const;

/** Activity type options (team learning & collaboration) */
const ACTIVITY_TYPE_OPTIONS: ActivityType[] = [
  'Workshop',
  'Check-in',
  'Live Session',
  'Async Sprint',
];

/** Some sample learning paths / resources labels (UI-only for now) */
const LEARNING_PATH_OPTIONS = [
  'Onboarding to KonnectED',
  'AI Literacy Starter',
  'Leadership Essentials',
];

const RESOURCE_OPTIONS = [
  'Knowledge: “Intro to Robotics”',
  'Knowledge: “Impact Evaluation Basics”',
  'Knowledge: “Team Collaboration Best Practices”',
];

export default function ActivityPlannerPage(): JSX.Element {
  /** Initial mocked events – replace with API data later */
  const [events, setEvents] = useState<ActivityEvent[]>([
    {
      id: 'evt1',
      title: 'Team Onboarding Workshop',
      description:
        'Kick-off session for new members, reviewing our current learning path and workspace norms.',
      dateTime: dayjs().add(2, 'day').hour(10).minute(0),
      owner: 'Alice',
      team: 'Alpha Innovators',
      activityType: 'Workshop',
      linkedLearningPathLabel: 'Onboarding to KonnectED',
    },
    {
      id: 'evt2',
      title: 'Sprint Learning Check-in',
      description:
        'Short sync on what we learned this sprint and which resources to bookmark in Knowledge.',
      dateTime: dayjs().add(4, 'day').hour(9).minute(30),
      owner: 'Bob',
      team: 'Beta Coders',
      activityType: 'Check-in',
      linkedResourceLabel: 'Knowledge: “Team Collaboration Best Practices”',
    },
  ]);

  const [selectedTeam, setSelectedTeam] = useState<string>('All');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [preSelectedDate, setPreSelectedDate] = useState<Dayjs | null>(null);

  const [form] = Form.useForm<ActivityFormValues>();

  /** Filtering by team */
  const filteredEvents = useMemo(
    () =>
      selectedTeam === 'All'
        ? events
        : events.filter((evt) => evt.team === selectedTeam),
    [events, selectedTeam],
  );

  /** Upcoming list, sorted by date/time */
  const upcomingEvents = useMemo(
    () =>
      [...filteredEvents]
        .filter((evt) => evt.dateTime.isAfter(dayjs().subtract(1, 'day')))
        .sort((a, b) => a.dateTime.valueOf() - b.dateTime.valueOf()),
    [filteredEvents],
  );

  /** AntD v5: use `cellRender` for date cells to show small markers */
  const cellRender: CalendarProps<Dayjs>['cellRender'] = (value, info) => {
    if (info.type !== 'date') return info.originNode;
    const listData = events.filter((evt) => evt.dateTime.isSame(value, 'day'));
    if (!listData.length) return info.originNode;

    return (
      <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
        {listData.slice(0, 3).map((item) => (
          <li key={item.id} style={{ marginBottom: 2 }}>
            <Text style={{ fontSize: 10 }} ellipsis>
              {item.title}
            </Text>
          </li>
        ))}
        {listData.length > 3 && (
          <li>
            <Text type="secondary" style={{ fontSize: 10 }}>
              +{listData.length - 3} more
            </Text>
          </li>
        )}
      </ul>
    );
  };

  /** Calendar selection uses Dayjs in AntD v5 */
  const handleDateSelect = (value: Dayjs) => {
    setPreSelectedDate(value);
    // preset only the date; time stays empty until user picks it
    form.setFieldsValue({ eventDate: value });
    setModalVisible(true);
  };

  /** Add new activity (currently client-side only) */
  const handleAddEvent = (values: ActivityFormValues) => {
    if (!values.eventDate || !values.eventTime || !values.team || !values.owner) {
      message.error('Please fill in all required fields.');
      return;
    }

    const mergedDateTime = values.eventDate
      .hour(values.eventTime.hour())
      .minute(values.eventTime.minute());

    const newEvent: ActivityEvent = {
      id: `evt-${Date.now()}`,
      title: values.eventTitle,
      description: values.eventDescription ?? '',
      dateTime: mergedDateTime,
      owner: values.owner,
      team: values.team,
      activityType: values.activityType,
      linkedLearningPathLabel: values.linkedLearningPathLabel,
      linkedResourceLabel: values.linkedResourceLabel,
    };

    setEvents((prev) => [...prev, newEvent]);
    setModalVisible(false);
    form.resetFields();
    setPreSelectedDate(null);
    message.success('Activity added to the team calendar.');
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((evt) => evt.id !== id));
    message.success('Activity removed.');
  };

  const handleOpenModalEmpty = () => {
    setPreSelectedDate(null);
    form.resetFields();
    setModalVisible(true);
  };

  const modalTitle = preSelectedDate
    ? `Add Activity on ${preSelectedDate.format('YYYY-MM-DD')}`
    : 'Add New Activity';

  return (
    <KonnectedPageShell
      title="Activity Planner"
      subtitle={
        <span>
          Plan team learning sessions, workshops, and collaborative check-ins, and optionally link
          them to Learning Paths or Knowledge resources.
        </span>
      }
      primaryAction={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModalEmpty}>
          Add Activity
        </Button>
      }
      secondaryActions={
        <Select
          value={selectedTeam}
          style={{ minWidth: 180 }}
          onChange={setSelectedTeam}
          options={teamOptions.map((t) => ({ label: t, value: t }))}
        />
      }
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            title="Team Activity Calendar"
            extra={
              <Text type="secondary">
                Click a date to schedule a new session for a team.
              </Text>
            }
            bordered
          >
            <Calendar
              fullscreen
              onSelect={handleDateSelect}
              cellRender={cellRender}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card bordered>
            <Title level={4} style={{ marginBottom: 8 }}>
              Upcoming Activities
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              Showing activities for{' '}
              <Text strong>{selectedTeam === 'All' ? 'all teams' : selectedTeam}</Text>.
            </Paragraph>

            <List
              size="small"
              dataSource={upcomingEvents}
              locale={{
                emptyText: 'No planned activities yet. Use “Add Activity” to get started.',
              }}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  actions={[
                    <Button
                      key="delete"
                      danger
                      size="small"
                      onClick={() => handleDeleteEvent(item.id)}
                    >
                      Delete
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <span>
                        {item.title}{' '}
                        {item.activityType && <Tag color="blue">{item.activityType}</Tag>}
                      </span>
                    }
                    description={
                      <div>
                        <div>
                          <Text strong>
                            {item.dateTime.format('YYYY-MM-DD HH:mm')}
                          </Text>
                        </div>
                        <div>
                          <Text type="secondary">
                            Team: {item.team} • Owner: {item.owner}
                          </Text>
                        </div>
                        {(item.linkedLearningPathLabel || item.linkedResourceLabel) && (
                          <div style={{ marginTop: 4 }}>
                            {item.linkedLearningPathLabel && (
                              <Tag color="green">
                                Path: {item.linkedLearningPathLabel}
                              </Tag>
                            )}
                            {item.linkedResourceLabel && (
                              <Tag color="purple">
                                Resource: {item.linkedResourceLabel}
                              </Tag>
                            )}
                          </div>
                        )}
                        {item.description && (
                          <div style={{ marginTop: 4 }}>
                            <Text>{item.description}</Text>
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />

            <Divider />

            <Text type="secondary">
              Tip: You can later wire this planner to real team data, Learning Paths, and Knowledge
              resources so that attendance and completion stats feed into analytics.
            </Text>
          </Card>
        </Col>
      </Row>

      <Modal
        title={modalTitle}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setPreSelectedDate(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form<ActivityFormValues> form={form} layout="vertical" onFinish={handleAddEvent}>
          <Form.Item
            label="Activity Title"
            name="eventTitle"
            rules={[{ required: true, message: 'Please enter the activity title.' }]}
          >
            <Input placeholder="e.g. Sprint Learning Check-in" />
          </Form.Item>

          <Form.Item label="Description" name="eventDescription">
            <Input.TextArea
              rows={3}
              placeholder="What is the team expected to do or learn during this activity?"
            />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label="Date"
                name="eventDate"
                rules={[{ required: true, message: 'Please select a date.' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Time"
                name="eventTime"
                rules={[{ required: true, message: 'Please select a time.' }]}
              >
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Team"
            name="team"
            rules={[{ required: true, message: 'Please select a team.' }]}
            initialValue={teamOptions[1]}
          >
            <Select
              options={teamOptions
                .filter((t) => t !== 'All')
                .map((t) => ({ value: t, label: t }))}
            />
          </Form.Item>

          <Form.Item label="Activity Type" name="activityType">
            <Select
              placeholder="Select an activity type"
              allowClear
              options={ACTIVITY_TYPE_OPTIONS.map((t) => ({ label: t, value: t }))}
            />
          </Form.Item>

          <Form.Item
            label="Owner"
            name="owner"
            rules={[{ required: true, message: 'Please enter the owner.' }]}
          >
            <Input placeholder="e.g. Team lead or facilitator name" />
          </Form.Item>

          <Form.Item label="Linked Learning Path (optional)" name="linkedLearningPathLabel">
            <Select
              placeholder="Link to a Learning Path"
              allowClear
              options={LEARNING_PATH_OPTIONS.map((label) => ({ label, value: label }))}
            />
          </Form.Item>

          <Form.Item label="Linked Knowledge Resource (optional)" name="linkedResourceLabel">
            <Select
              placeholder="Link to a Knowledge resource"
              allowClear
              options={RESOURCE_OPTIONS.map((label) => ({ label, value: label }))}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block icon={<PlusOutlined />}>
              Add Activity
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </KonnectedPageShell>
  );
}
