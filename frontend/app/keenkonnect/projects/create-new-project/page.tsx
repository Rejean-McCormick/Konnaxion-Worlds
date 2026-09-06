// FILE: frontend/app/keenkonnect/projects/create-new-project/page.tsx
'use client';

import {
  ProFormDatePicker,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProFormUploadButton,
  StepsForm,
} from '@ant-design/pro-components';
import { Card, Col, message, Row, Typography } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { useRouter } from 'next/navigation';
import React, { Suspense, useState } from 'react';

import { apiPost } from '@/api';
import KeenPageShell from '@/app/keenkonnect/KeenPageShell';

const { Paragraph } = Typography;

// Backend route: /api/keenkonnect/projects/
const PROJECTS_ENDPOINT = 'keenkonnect/projects/';

type CreateProjectFormValues = {
  name: string;
  description?: string;
  category?: string;
  team?: string;
  startDate?: unknown;
  endDate?: unknown;
  attachments?: UploadFile[];
  notes?: string;
};

export default function CreateNewProjectPage() {
  return (
    <KeenPageShell
      title="Create New Project"
      description="Use this guided wizard to describe your project, configure the team and timeline, and attach any supporting files."
    >
      <Suspense fallback={null}>
        <Content />
      </Suspense>
    </KeenPageShell>
  );
}

function Content() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async (values: CreateProjectFormValues) => {
    try {
      setSubmitting(true);

      // Minimal payload aligned with Django ProjectSerializer
      const payload = {
        title: values.name,
        description: values.description ?? '',
        category: values.category ?? 'Uncategorized',
        status: 'idea' as const,
      };

      await apiPost(PROJECTS_ENDPOINT, payload);

      message.success('Project created successfully!');
      router.push('/keenkonnect/projects/my-projects');
      return true;
    } catch (err) {
       
      console.error('Create project error:', err);
      message.error('Failed to create project.');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Paragraph type="secondary" className="mb-4">
        The core project record is created in the Django backend. You can refine
        team, timeline and attachments in the steps below.
      </Paragraph>

      <Row justify="center">
        <Col xs={24} lg={18} xl={16}>
          <Card>
            <StepsForm<CreateProjectFormValues>
              onFinish={handleFinish}
              formProps={{
                layout: 'vertical',
              }}
              submitter={{
                searchConfig: {
                  submitText: 'Create Project',
                },
                submitButtonProps: {
                  loading: submitting,
                },
              }}
            >
              {/* Step 1 – Basic Info */}
              <StepsForm.StepForm name="basic" title="Basic Info">
                <ProFormText
                  name="name"
                  label="Project Name"
                  placeholder="Enter project name"
                  rules={[
                    { required: true, message: 'Please enter a project name' },
                  ]}
                />

                <ProFormTextArea
                  name="description"
                  label="Description"
                  placeholder="Describe your project goals, context, and expected outcomes"
                  fieldProps={{ rows: 4 }}
                />

                <ProFormSelect
                  name="category"
                  label="Category"
                  placeholder="Choose a domain or focus area"
                  options={[
                    { label: 'Civic', value: 'Civic' },
                    { label: 'Arts', value: 'Arts' },
                    { label: 'Education', value: 'Education' },
                    { label: 'Environment', value: 'Environment' },
                    { label: 'Other', value: 'Other' },
                  ]}
                />
              </StepsForm.StepForm>

              {/* Step 2 – Team & Timeline */}
              <StepsForm.StepForm
                name="team-settings"
                title="Team & Timeline"
              >
                <ProFormSelect
                  name="team"
                  label="Team"
                  placeholder="Select team (optional for now)"
                  options={[
                    { label: 'Team Alpha', value: 'alpha' },
                    { label: 'Team Beta', value: 'beta' },
                  ]}
                />

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <ProFormDatePicker
                      name="startDate"
                      label="Start Date"
                      fieldProps={{ style: { width: '100%' } }}
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <ProFormDatePicker
                      name="endDate"
                      label="End Date"
                      fieldProps={{ style: { width: '100%' } }}
                    />
                  </Col>
                </Row>
              </StepsForm.StepForm>

              {/* Step 3 – Attachments & Notes */}
              <StepsForm.StepForm
                name="attachments"
                title="Attachments & Notes"
              >
                <ProFormUploadButton
                  name="attachments"
                  label="Attachments"
                  max={5}
                  fieldProps={{
                    multiple: true,
                    // No automatic upload; files are kept in form state
                    beforeUpload: () => false,
                    listType: 'text',
                  }}
                  extra="Optional: upload briefs, specs, or reference documents."
                />

                <ProFormTextArea
                  name="notes"
                  label="Additional Notes"
                  placeholder="Anything else your collaborators should know?"
                  fieldProps={{ rows: 4 }}
                />
              </StepsForm.StepForm>
            </StepsForm>
          </Card>
        </Col>
      </Row>
    </>
  );
}
