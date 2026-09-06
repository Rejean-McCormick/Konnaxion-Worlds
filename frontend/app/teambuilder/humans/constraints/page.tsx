// frontend/app/teambuilder/humans/constraints/page.tsx
'use client';

import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Collapse,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Space,
  Steps,
  Switch,
  Tag,
  TimePicker,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React from 'react';

import TeamBuilderPageShell from '@/components/teambuilder/TeamBuilderPageShell';

const { Panel } = Collapse;
const { RangePicker } = TimePicker;
const { TextArea } = Input;
const { Text, Paragraph } = Typography;

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'Spanish', value: 'es' },
  { label: 'German', value: 'de' },
  { label: 'Arabic', value: 'ar' },
  { label: 'Chinese (Mandarin)', value: 'zh' },
];

const REGION_OPTIONS = [
  { label: 'Europe', value: 'europe' },
  { label: 'North America', value: 'north_america' },
  { label: 'Latin America', value: 'latin_america' },
  { label: 'Africa', value: 'africa' },
  { label: 'Middle East', value: 'middle_east' },
  { label: 'Asia-Pacific', value: 'apac' },
];

const TIMEZONE_OPTIONS = [
  { label: 'UTC−08:00 (PST)', value: 'America/Los_Angeles' },
  { label: 'UTC−05:00 (EST)', value: 'America/New_York' },
  { label: 'UTC±00:00 (UTC)', value: 'Etc/UTC' },
  { label: 'UTC+01:00 (CET)', value: 'Europe/Paris' },
  { label: 'UTC+02:00 (EET)', value: 'Europe/Athens' },
  { label: 'UTC+05:30 (IST)', value: 'Asia/Kolkata' },
];

const DAY_OPTIONS = [
  { label: 'Monday', value: 'mon' },
  { label: 'Tuesday', value: 'tue' },
  { label: 'Wednesday', value: 'wed' },
  { label: 'Thursday', value: 'thu' },
  { label: 'Friday', value: 'fri' },
  { label: 'Saturday', value: 'sat' },
  { label: 'Sunday', value: 'sun' },
];

export default function HumansConstraintsPage(): JSX.Element {
  const [form] = Form.useForm();

  // Live summary via watchers
  const languages = Form.useWatch('languages', form) as string[] | undefined;
  const regions = Form.useWatch('regions', form) as string[] | undefined;
  const timezones = Form.useWatch('timezones', form) as string[] | undefined;
  const workingDays = Form.useWatch('working_days', form) as string[] | undefined;
  const workingHours = Form.useWatch(
    'working_hours',
    form,
  ) as dayjs.Dayjs[] | undefined;
  const allowMixedTZ = Form.useWatch(
    'allow_mixed_timezones',
    form,
  ) as boolean | undefined;
  const useOrgTemplate = Form.useWatch(
    'use_org_template',
    form,
  ) as boolean | undefined;

  const handleSave = (values: unknown) => {
    // TODO: integrate with backend constraints API
     
    console.log('Human constraints saved:', values);
  };

  const handleReset = () => {
    form.resetFields();
  };

  const handleSaveTemplate = () => {
    const currentValues = form.getFieldsValue();
    // TODO: integrate with "templates" API
     
    console.log('Save constraints as template:', currentValues);
  };

  const summaryTags: React.ReactNode[] = [];

  if (languages && languages.length > 0) {
    summaryTags.push(
      <Tag key="languages" icon={<GlobalOutlined />}>
        {languages.length} language{languages.length > 1 ? 's' : ''}
      </Tag>,
    );
  }

  if (regions && regions.length > 0) {
    summaryTags.push(
      <Tag key="regions" icon={<EnvironmentOutlined />}>
        {regions.length} region{regions.length > 1 ? 's' : ''}
      </Tag>,
    );
  }

  if (timezones && timezones.length > 0) {
    summaryTags.push(
      <Tag key="timezones" color="blue">
        {timezones.length} time zone{timezones.length > 1 ? 's' : ''}
      </Tag>,
    );
  }

  if (workingDays && workingDays.length > 0) {
    summaryTags.push(
      <Tag key="days" color="green">
        {workingDays.length} working day{workingDays.length > 1 ? 's' : ''}
      </Tag>,
    );
  }

  // TS-safe handling of workingHours
  if (
    Array.isArray(workingHours) &&
    workingHours.length === 2 &&
    workingHours[0] &&
    workingHours[1]
  ) {
    summaryTags.push(
      <Tag key="hours" icon={<ClockCircleOutlined />} color="gold">
        {workingHours[0].format('HH:mm')} – {workingHours[1].format('HH:mm')}
      </Tag>,
    );
  }

  if (allowMixedTZ) {
    summaryTags.push(
      <Tag key="mixed_tz" color="purple">
        Mixed time zones allowed
      </Tag>,
    );
  }

  if (useOrgTemplate) {
    summaryTags.push(
      <Tag key="org_template" color="geekblue">
        Org default template
      </Tag>,
    );
  }

  const primaryAction = (
    <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()}>
      Save constraints
    </Button>
  );

  const secondaryActions = (
    <Button icon={<ReloadOutlined />} onClick={handleReset}>
      Reset
    </Button>
  );

  return (
    <TeamBuilderPageShell
      title="Human constraints"
      subtitle="Configure language, geography, time zones and working schedules that the team builder must respect."
      sectionLabel="Humans"
      maxWidth={1040}
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          allow_mixed_timezones: false,
          use_org_template: false,
          working_days: ['mon', 'tue', 'wed', 'thu', 'fri'],
          working_hours: [dayjs('09:00', 'HH:mm'), dayjs('17:00', 'HH:mm')],
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* High-level context + summary */}
          <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Alert
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                message="How these constraints are used"
                description={
                  <Paragraph type="secondary" style={{ margin: 0 }}>
                    Human constraints act as hard or soft guardrails for the team
                    builder: language and geography increase collaboration comfort;
                    schedule and time zones reduce coordination friction. You can
                    still override them when designing specific sessions.
                  </Paragraph>
                }
              />

              <Steps
                size="small"
                current={2}
                items={[
                  { title: 'Pool & profiles' },
                  { title: 'Human constraints' },
                  { title: 'Problem & modes' },
                ]}
              />

              <Divider style={{ margin: '12px 0' }} />

              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Text strong>Current summary</Text>
                {summaryTags.length === 0 ? (
                  <Text type="secondary">
                    No constraints set yet. Define languages, regions and working time
                    to help the matching engine propose better teams.
                  </Text>
                ) : (
                  <Space wrap>{summaryTags}</Space>
                )}
              </Space>
            </Space>
          </Card>

          {/* Main configuration blocks */}
          <Card>
            <Collapse
              defaultActiveKey={['languages', 'geography', 'schedule']}
              bordered={false}
            >
              {/* Languages */}
              <Panel
                key="languages"
                header={
                  <Space>
                    <GlobalOutlined />
                    <span>Languages</span>
                  </Space>
                }
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={16}>
                    <Form.Item
                      name="languages"
                      label="Preferred working languages"
                      tooltip="Used to avoid creating teams where people cannot communicate comfortably."
                    >
                      <Select
                        mode="multiple"
                        allowClear
                        placeholder="Select one or more languages"
                        options={LANGUAGE_OPTIONS}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="languages_notes" label="Notes">
                      <TextArea
                        rows={3}
                        placeholder="Any specific language nuances, accents, or requirements..."
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Panel>

              {/* Geography & time zones */}
              <Panel
                key="geography"
                header={
                  <Space>
                    <EnvironmentOutlined />
                    <span>Geography & time zones</span>
                  </Space>
                }
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="regions"
                      label="Allowed regions"
                      tooltip="Use this to restrict team formation to specific geographical regions."
                    >
                      <Select
                        mode="multiple"
                        allowClear
                        placeholder="Select allowed regions"
                        options={REGION_OPTIONS}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="timezones"
                      label="Preferred time zones"
                      tooltip="Optional: if set, the engine will prefer grouping people with overlapping time zones."
                    >
                      <Select
                        mode="multiple"
                        allowClear
                        placeholder="Select one or more time zones"
                        options={TIMEZONE_OPTIONS}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="allow_mixed_timezones"
                      label="Allow mixed time zones"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={16}>
                    <Form.Item name="geo_notes" label="Notes">
                      <TextArea
                        rows={2}
                        placeholder="e.g. avoid pairing Americas with APAC for urgent teams; okay for long-term projects."
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Panel>

              {/* Schedule */}
              <Panel
                key="schedule"
                header={
                  <Space>
                    <ClockCircleOutlined />
                    <span>Working schedule</span>
                  </Space>
                }
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Form.Item name="working_days" label="Typical working days">
                      <Checkbox.Group options={DAY_OPTIONS} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="working_hours"
                      label="Typical working hours (local time)"
                    >
                      <RangePicker format="HH:mm" minuteStep={15} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="use_org_template"
                      label="Use organisation default schedule"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="schedule_notes" label="Notes">
                      <TextArea
                        rows={2}
                        placeholder="e.g. high-intensity teams available for weekend work, learning teams weekdays only..."
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Panel>
            </Collapse>

            <Divider />

            {/* Bottom actions (in addition to shell toolbar) */}
            <Space
              style={{
                width: '100%',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
              }}
            >
              <Space>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  Reset
                </Button>
              </Space>

              <Space>
                <Button icon={<PlusOutlined />} onClick={handleSaveTemplate}>
                  Save as template
                </Button>
                <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
                  Save constraints
                </Button>
              </Space>
            </Space>
          </Card>
        </Space>
      </Form>
    </TeamBuilderPageShell>
  );
}
