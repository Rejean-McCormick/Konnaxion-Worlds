// FILE: frontend/app/keenkonnect/workspaces/launch-new-workspace/page.tsx
'use client';

import {
  ProForm,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { Alert, Card } from 'antd';
import React, { Suspense } from 'react';

import KeenPageShell from '@/app/keenkonnect/KeenPageShell';

type LaunchWorkspaceFormValues = {
  name: string;
  team: string;
  tools: string[];
  isPublic: boolean;
};

function Content() {
  return (
    <Card>
      <Alert
        type="info"
        showIcon
        message="Workspace creation preview"
        description="KeenKonnect does not expose a workspace persistence contract in this build. You can inspect the intended configuration model, but launching a workspace is disabled."
        style={{ marginBottom: 16 }}
      />
      <ProForm<LaunchWorkspaceFormValues>
        layout="vertical"
        initialValues={{ isPublic: true }}
        onFinish={async () => false}
        submitter={{
          searchConfig: { submitText: 'Launch unavailable' },
          submitButtonProps: { disabled: true },
          resetButtonProps: { disabled: true },
        }}
      >
        <ProFormText
          name="name"
          label="Nom de l’espace de travail"
          placeholder="ex. KeenKonnect Quantum Strategy Lab"
        />
        <ProFormSelect
          name="team"
          label="Équipe responsable"
          placeholder="Sélectionnez une équipe"
          options={[
            { label: 'Team Alpha – Strategic Vision', value: 'Team Alpha' },
            { label: 'Team Beta – Quantum Strategists', value: 'Team Beta' },
            { label: 'Team Gamma – Innovation Pod', value: 'Team Gamma' },
            { label: 'Special Guests – Invited Fellows', value: 'Special Guests' },
          ]}
        />
        <ProFormSelect
          name="tools"
          label="Outils & environnements inclus"
          placeholder="Choisissez un ou plusieurs environnements"
          fieldProps={{ mode: 'multiple' }}
          options={[
            { label: 'Data Science Notebook', value: 'Data Science Notebook' },
            { label: 'VR Lab', value: 'VR Lab' },
            { label: 'Programming Workspace', value: 'Programming Workspace' },
            { label: 'Design Studio', value: 'Design Studio' },
            { label: '3D Modeling', value: '3D Modeling' },
            { label: 'Virtual Whiteboard', value: 'Virtual Whiteboard' },
            { label: 'Brainstorming Hub', value: 'Brainstorming Hub' },
            { label: 'Prototyping Area', value: 'Prototyping Area' },
          ]}
        />
        <ProFormSwitch
          name="isPublic"
          label="Espace visible à l’ensemble de KeenKonnect"
        />
      </ProForm>
    </Card>
  );
}

export default function PageWrapper() {
  return (
    <KeenPageShell
      title="Launch a New Workspace"
      description="Preview the intended workspace configuration model. Persistence remains deferred until a dedicated KeenKonnect workspace contract exists."
    >
      <Suspense fallback={null}>
        <Content />
      </Suspense>
    </KeenPageShell>
  );
}
