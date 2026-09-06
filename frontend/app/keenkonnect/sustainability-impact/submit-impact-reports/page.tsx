// FILE: frontend/app/keenkonnect/sustainability-impact/submit-impact-reports/page.tsx
'use client';

import { InboxOutlined } from '@ant-design/icons';
import { ProFormDigit, StepsForm } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Result,
  Select,
  Spin,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import Link from 'next/link';
import React, { Suspense, useState } from 'react';

import KeenPage from '@/app/keenkonnect/KeenPageShell';

const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;

type SustainabilityReportFormValues = {
  project: string;
  date: Dayjs;
  category: string;
  co2Reduction?: number;
  energySaved?: number;
  peopleImpacted?: number;
  budgetUsed?: number;
  description: string;
  attachments?: UploadFile[];
};

export default function SubmitImpactReportsPage() {
  return (
    <KeenPage
      title="Submit Impact Report"
      description="Report sustainability impact for your KeenKonnect projects and attach supporting evidence."
      metaTitle="KeenKonnect · Sustainability · Submit Impact Report"
    >
      <Suspense fallback={<Spin style={{ marginTop: 40 }} />}>
        <Content />
      </Suspense>
    </KeenPage>
  );
}

function Content(): JSX.Element {
  const [completed, setCompleted] = useState(false);
  const [referenceId, setReferenceId] = useState<string | undefined>();

  const handleFinish = async (): Promise<boolean> => {
    // Declared read-only: no sustainability-impact report write contract exists.
    return false;
  };

  // Typed helper to normalize Upload value
  const normFile = (event: unknown): UploadFile[] => {
    if (Array.isArray(event)) {
      return event as UploadFile[];
    }

    if (
      typeof event === 'object' &&
      event !== null &&
      'fileList' in event &&
      Array.isArray((event as { fileList?: unknown }).fileList)
    ) {
      return (event as { fileList: UploadFile[] }).fileList;
    }

    return [];
  };

  if (completed) {
    return (
      <Result
        status="success"
        title="Impact report submitted"
        subTitle={
          referenceId
            ? `Reference: ${referenceId}. You can now track this impact in your dashboard.`
            : 'Your report has been saved. You can now track this impact in your dashboard.'
        }
        extra={[
          <Link
            key="track"
            href="/keenkonnect/sustainability-impact/track-project-impact"
          >
            <Button type="primary">Go to Track Project Impact</Button>
          </Link>,
          <Button key="again" onClick={() => setCompleted(false)}>
            Submit another report
          </Button>,
        ]}
      />
    );
  }

  return (
    <>
      <Alert
        type="info"
        showIcon
        message="Impact report submission unavailable"
        description="Tracking views can remain visible, but this write form is a declared read-only preview because no sustainability-impact report persistence endpoint is exposed in the current backend."
        style={{ marginBottom: 16 }}
      />
      <Card>
      <StepsForm<SustainabilityReportFormValues>
        onFinish={handleFinish}
        submitter={{
          // SearchConfig in ProComponents v2 only supports resetText / submitText
          searchConfig: {
            submitText: 'Submit report',
          },
          submitButtonProps: {
            disabled: true,
            title: 'Unavailable until a sustainability-impact report contract exists.',
          },
          render: (props, dom) => (
            <div style={{ marginTop: 24, textAlign: 'right' }}>{dom}</div>
          ),
        }}
      >
        {/* Step 1 – Project & timeframe */}
        <StepsForm.StepForm
          name="basic"
          title="Project & timeframe"
          layout="vertical"
          initialValues={{
            date: dayjs(),
          }}
        >
          <Form.Item
            label="Project"
            name="project"
            rules={[{ required: true, message: 'Please select a project' }]}
          >
            <Select placeholder="Select the project">
              {/* Declared preview project options until an impact-report contract exists. */}
              <Option value="project-a">Project A</Option>
              <Option value="project-b">Project B</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Date"
            name="date"
            rules={[{ required: true, message: 'Please select a date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Impact category"
            name="category"
            rules={[{ required: true, message: 'Please choose a category' }]}
          >
            <Select placeholder="Select impact category">
              <Option value="environment">Environment</Option>
              <Option value="social">Social</Option>
              <Option value="governance">Governance</Option>
            </Select>
          </Form.Item>
        </StepsForm.StepForm>

        {/* Step 2 – Quantitative metrics */}
        <StepsForm.StepForm
          name="metrics"
          title="Impact metrics"
          layout="vertical"
        >
          <ProFormDigit
            name="co2Reduction"
            label="CO₂ reduction (tons)"
            min={0}
            fieldProps={{ precision: 2 }}
            tooltip="Estimated CO₂ equivalent reduced by this initiative"
          />

          <ProFormDigit
            name="energySaved"
            label="Energy saved (kWh)"
            min={0}
            fieldProps={{ precision: 0 }}
          />

          <ProFormDigit
            name="peopleImpacted"
            label="People positively impacted"
            min={0}
            fieldProps={{ precision: 0 }}
          />

          <ProFormDigit
            name="budgetUsed"
            label="Budget used (USD)"
            min={0}
            fieldProps={{ precision: 2 }}
          />
        </StepsForm.StepForm>

        {/* Step 3 – Evidence & narrative */}
        <StepsForm.StepForm
          name="evidence"
          title="Evidence & narrative"
          layout="vertical"
        >
          <Form.Item
            label="Impact narrative"
            name="description"
            rules={[
              {
                required: true,
                message: 'Please describe the impact you observed',
              },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Describe the impact, context and key outcomes..."
            />
          </Form.Item>

          <Form.Item
            label="Supporting files"
            name="attachments"
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Dragger
              name="files"
              multiple
              beforeUpload={() => false}
              accept=".pdf,.doc,.docx,.xlsx,.csv,image/*"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag files to this area to upload
              </p>
              <p className="ant-upload-hint">
                Attach reports, spreadsheets, dashboards or photos that support
                your impact.
              </p>
            </Dragger>
          </Form.Item>
        </StepsForm.StepForm>
      </StepsForm>
      </Card>
    </>
  );
}
