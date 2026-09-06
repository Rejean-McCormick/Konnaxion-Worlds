// FILE: frontend/modules/ethikos/trust/credentials/page.tsx
'use client'

import { InboxOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Result, Upload, type UploadProps } from 'antd';
import { useState } from 'react';

import usePageTitle from '@/hooks/usePageTitle';
import { uploadCredential } from '@/services/trust';

export default function Credentials() {
  usePageTitle('Trust · Credentials');

  const [done, setDone] = useState(false);

  const props: UploadProps = {
    name: 'file',
    multiple: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        await uploadCredential(file as File);
        onSuccess?.('ok');
        setDone(true);
      } catch {
        onError?.(new Error('Credential upload failed'));
      }
    },
  };

  return (
    <PageContainer ghost>
      {done ? (
        <Result
          status="success"
          title="Document uploaded!"
          subTitle="Your credential is pending verification."
          extra={<Button type="primary" onClick={() => setDone(false)}>Upload another</Button>}
        />
      ) : (
        <Upload.Dragger {...props} accept=".pdf,.jpg,.png">
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">Supported: PDF / JPG / PNG &nbsp;·&nbsp; Max 5 MB</p>
        </Upload.Dragger>
      )}
    </PageContainer>
  );
}
