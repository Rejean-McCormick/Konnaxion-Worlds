// FILE: frontend/app/keenkonnect/knowledge/upload-new-document/page.tsx
'use client';

import { InboxOutlined } from '@ant-design/icons';
import {
  ProCard,
  ProForm,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProFormUploadDragger,
} from '@ant-design/pro-components';
import { Alert } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import React from 'react';

import KeenPageShell from '@/app/keenkonnect/KeenPageShell';

type CategoryOption = 'Robotics' | 'Healthcare' | 'Technology' | 'Energy' | 'Education';
type LanguageOption = 'English' | 'French';

interface UploadDocumentFormValues {
  title: string;
  description: string;
  category: CategoryOption;
  version: string;
  language: LanguageOption;
  publishNow: boolean;
  documentFile?: UploadFile[]; // optional in typing, required via rules
}

// Normalise Upload event -> UploadFile[]
const normFile = (event: unknown): UploadFile[] => {
  if (Array.isArray(event)) return event as UploadFile[];
  if (event && typeof event === 'object' && 'fileList' in event) {
    const fileList = (event as { fileList?: unknown }).fileList;
    return Array.isArray(fileList) ? (fileList as UploadFile[]) : [];
  }
  return [];
};

export default function UploadNewDocumentPage(): JSX.Element {
  const handleFinish = async (): Promise<boolean> => {
    // Declared read-only: no general knowledge-document upload contract exists.
    return false;
  };

  return (
    <KeenPageShell
      title="Upload New Document"
      description="Add a new knowledge asset to KeenKonnect."
      metaTitle="KeenKonnect · Knowledge · Upload document"
    >
      <Alert
        type="info"
        showIcon
        message="Document upload unavailable"
        description="This form is retained as a declared read-only product preview. Konnaxion does not currently expose a general knowledge-document upload persistence contract."
        style={{ marginBottom: 16 }}
      />
      <ProCard>
        <ProForm<UploadDocumentFormValues>
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            publishNow: true,
          }}
          submitter={{
            searchConfig: {
              submitText: 'Upload unavailable',
              resetText: 'Reset',
            },
            submitButtonProps: {
              disabled: true,
              type: 'primary',
              title: 'Unavailable until a knowledge-document persistence contract exists.',
            },
          }}
        >
          <ProFormText
            name="title"
            label="Document Title"
            placeholder="Enter document title"
            rules={[
              { required: true, message: 'Please enter a document title' },
              { max: 200, message: 'Title is too long' },
            ]}
          />

          <ProFormTextArea
            name="description"
            label="Description / Abstract"
            placeholder="Short summary of the document contents"
            fieldProps={{ rows: 4 }}
            rules={[
              { required: true, message: 'Please provide a description or abstract' },
            ]}
          />

          <ProFormSelect<CategoryOption>
            name="category"
            label="Category / Topic"
            placeholder="Select a category"
            rules={[{ required: true, message: 'Please select a category/topic' }]}
            options={[
              { label: 'Robotics', value: 'Robotics' },
              { label: 'Healthcare', value: 'Healthcare' },
              { label: 'Technology', value: 'Technology' },
              { label: 'Energy', value: 'Energy' },
              { label: 'Education', value: 'Education' },
            ]}
          />

          <ProFormText
            name="version"
            label="Version"
            placeholder="e.g. 1.0"
            rules={[
              { required: true, message: 'Please specify the document version' },
            ]}
          />

          <ProFormSelect<LanguageOption>
            name="language"
            label="Language"
            placeholder="Select language"
            rules={[{ required: true, message: 'Please select a language' }]}
            options={[
              { label: 'English', value: 'English' },
              { label: 'French', value: 'French' },
            ]}
          />

          <ProFormUploadDragger
            name="documentFile"
            label="Document File"
            max={1}
            valuePropName="fileList"
            getValueFromEvent={normFile}
            rules={[
              { required: true, message: 'Please upload the document file' },
            ]}
            fieldProps={{
              multiple: false,
              beforeUpload: () => false, // pas d'upload auto, on gère tout dans onFinish
              accept: '.pdf,.doc,.docx,.ppt,.pptx,.txt',
            }}
          >
            <div style={{ padding: '24px 0' }}>
              <InboxOutlined style={{ fontSize: 32 }} />
              <div style={{ marginTop: 8 }}>
                Click or drag file to this area to upload
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                Supported formats: PDF, DOC/DOCX, PPT/PPTX, TXT (single file).
              </div>
            </div>
          </ProFormUploadDragger>

          <ProFormSwitch
            name="publishNow"
            label="Publish Status"
            fieldProps={{
              checkedChildren: 'Publish Now',
              unCheckedChildren: 'Save as Draft',
            }}
          />
        </ProForm>
      </ProCard>
    </KeenPageShell>
  );
}
