// FILE: frontend/app/keenkonnect/user-reputation/manage-expertise-areas/page.tsx
﻿'use client';

import { ProForm, ProFormSelect } from '@ant-design/pro-components';
import { Alert, Divider, Form, List, Rate, Space, Tag, Typography } from 'antd';
import React, { useMemo, useState } from 'react';

import KeenPageShell from '@/app/keenkonnect/KeenPageShell';

const { Text, Paragraph } = Typography;
const { CheckableTag } = Tag;

type Visibility = 'public' | 'team-only' | 'private';

type FormValues = {
  currentExpertise: string[];
  newFields?: string[];
  visibility: Visibility;
};

interface ExpertiseItem {
  key: string;
  label: string;
  description: string;
  defaultLevel: number; // 1–5, for Rate
}

// Catalogue d’expertises disponibles dans KeenKonnect
const EXPERTISE_CATALOG: ExpertiseItem[] = [
  {
    key: 'frontend',
    label: 'Frontend Development',
    description:
      'React, TypeScript, modern component patterns and design systems.',
    defaultLevel: 4.5,
  },
  {
    key: 'backend',
    label: 'Backend Development',
    description:
      'APIs, microservices, Node.js / Python, data modelling & reliability.',
    defaultLevel: 4,
  },
  {
    key: 'uiux',
    label: 'UI/UX Design',
    description:
      'User journeys, wireframes, interactive prototypes, design systems.',
    defaultLevel: 4.5,
  },
  {
    key: 'data-science',
    label: 'Data Science',
    description:
      'Exploratory analysis, ML models, dashboards, decision support.',
    defaultLevel: 3.5,
  },
  {
    key: 'devops',
    label: 'DevOps',
    description:
      'CI/CD, observability, infrastructure-as-code, cloud environments.',
    defaultLevel: 3.5,
  },
  {
    key: 'mobile',
    label: 'Mobile Development',
    description:
      'Native & cross-platform apps, performance and offline patterns.',
    defaultLevel: 3,
  },
  {
    key: 'qa',
    label: 'QA',
    description: 'Testing strategy, automation, regression & release quality.',
    defaultLevel: 3.5,
  },
  {
    key: 'pm',
    label: 'Project Management',
    description:
      'Roadmapping, stakeholder alignment, agile delivery and rituals.',
    defaultLevel: 4,
  },
];

const CURRENT_EXPERTISE_INITIAL: string[] = [
  'Frontend Development',
  'UI/UX Design',
];

const SELECTABLE_FIELDS: string[] = [
  'React',
  'Next.js',
  'TypeScript',
  'Figma',
  'GraphQL',
  'Node.js',
  'Cypress',
  'Jest',
];

const VISIBILITY_OPTIONS = [
  { label: 'Public', value: 'public' as const },
  { label: 'Team only', value: 'team-only' as const },
  { label: 'Private', value: 'private' as const },
];

export default function ManageExpertiseAreasPage(): JSX.Element {
  const [form] = Form.useForm<FormValues>();

  // Gestion interne de la sélection via Tag.CheckableTag
  const [selectedTags, setSelectedTags] = useState<string[]>(
    CURRENT_EXPERTISE_INITIAL,
  );

  // Liste pour l’aperçu (List + Rate) basée sur les tags sélectionnés
  const previewExpertise = useMemo(
    () => EXPERTISE_CATALOG.filter((item) => selectedTags.includes(item.label)),
    [selectedTags],
  );

  const handleTagChange = (label: string, checked: boolean) => {
    const nextSelected = checked
      ? Array.from(new Set([...selectedTags, label]))
      : selectedTags.filter((tag) => tag !== label);

    setSelectedTags(nextSelected);
    form.setFieldsValue({ currentExpertise: nextSelected });
  };

  return (
    <KeenPageShell
      title="Manage Expertise Areas"
      description="Declare and fine-tune the expertise areas used by Ekoh, KeenKonnect matching, and Smart Vote."
      metaTitle="KeenKonnect · Manage Expertise Areas"
    >
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        Declare and fine-tune the expertise areas used by Ekoh, KeenKonnect
        matching, and Smart Vote.
      </Paragraph>

      <Divider orientation="left">Your expertise profile</Divider>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Expertise editing is a declared read-only preview"
        description="Expertise source state belongs to EkoH. This KeenKonnect screen does not write expertise until an explicit EkoH-owned mutation contract is connected."
      />

      {/* Formulaire principal avec ProForm + ProFormSelect */}
      <ProForm<FormValues>
        form={form}
        layout="vertical"
        initialValues={{
          currentExpertise: CURRENT_EXPERTISE_INITIAL,
          visibility: 'team-only',
          newFields: [],
        }}
        submitter={{
          searchConfig: {
            submitText: 'Save unavailable',
          },
          submitButtonProps: { disabled: true },
          resetButtonProps: { disabled: true },
          render: (_, dom) => <div style={{ marginTop: 16 }}>{dom}</div>,
        }}
      >
        {/* Sélection des expertises actuelles via Tag.CheckableTag */}
        <Form.Item
          name="currentExpertise"
          label="Current expertise areas"
          rules={[
            {
              required: true,
              message: 'Please select at least one expertise area.',
            },
          ]}
        >
          <div style={{ marginBottom: 8 }}>
            {EXPERTISE_CATALOG.map((item) => (
              <CheckableTag
                key={item.key}
                checked={selectedTags.includes(item.label)}
                onChange={(checked) => handleTagChange(item.label, checked)}
                style={{ marginBottom: 8 }}
              >
                {item.label}
              </CheckableTag>
            ))}
          </div>
        </Form.Item>

        {/* ProFormSelect pour affiner / ajouter des champs précis */}
        <ProFormSelect
          name="newFields"
          label="Add or refine fields (optional)"
          mode="multiple"
          placeholder="Select specific technologies, tools, or domains"
          allowClear
          options={SELECTABLE_FIELDS.map((field) => ({
            label: field,
            value: field,
          }))}
        />

        {/* ProFormSelect pour la visibilité du profil d’expertise */}
        <ProFormSelect
          name="visibility"
          label="Visibility of your expertise"
          placeholder="Choose who can view your expertise profile"
          options={VISIBILITY_OPTIONS}
          rules={[
            {
              required: true,
              message: 'Please choose a visibility level.',
            },
          ]}
        />

        <Alert
          style={{ marginTop: 16 }}
          type="info"
          showIcon
          message="Note: New expertise or fields may need validation through activity and peer endorsements before they impact your Ekoh score."
        />
      </ProForm>

      <Divider orientation="left">Preview: how others see your expertise</Divider>

      {/* Aperçu des domaines sélectionnés via List + Rate */}
      <List
        bordered
        itemLayout="vertical"
        dataSource={previewExpertise}
        locale={{
          emptyText:
            'Select at least one expertise area above to see the preview.',
        }}
        renderItem={(item) => (
          <List.Item key={item.key}>
            <List.Item.Meta
              title={
                <Space>
                  <Text strong>{item.label}</Text>
                  <Tag color="blue">Core expertise</Tag>
                </Space>
              }
              description={item.description}
            />
            <div>
              <Text type="secondary" style={{ marginRight: 8 }}>
                Typical expertise level
              </Text>
              {/* Rate utilisé ici en lecture seule pour l’aperçu */}
              <Rate allowHalf disabled defaultValue={item.defaultLevel} />
            </div>
          </List.Item>
        )}
      />
    </KeenPageShell>
  );
}
