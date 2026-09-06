// frontend/app/teambuilder/create/CreateSessionClient.tsx
'use client';

import {
  ArrowLeftOutlined,
  BranchesOutlined,
  CheckOutlined,
  FileTextOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Input,
  Space,
  Spin,
  Steps,
  Typography,
} from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';


import { AlgorithmConfig } from '@/components/teambuilder/AlgorithmConfig';
import { CandidateSelector } from '@/components/teambuilder/CandidateSelector';
import TeamBuilderPageShell from '@/components/teambuilder/TeamBuilderPageShell';
import api from '@/services/_request'; // shared axios wrapper
import { teambuilderService } from '@/services/teambuilder';
import {
  IAlgorithmConfig,
  ICreateSessionRequest,
  ITeambuilderUser,
} from '@/services/teambuilder/types';

const { Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function CreateSessionClient(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const problemId = searchParams.get('problemId');

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Data
  const [sessionName, setSessionName] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [availableCandidates, setAvailableCandidates] = useState<ITeambuilderUser[]>([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>([]);

  const [algorithmConfig, setAlgorithmConfig] = useState<IAlgorithmConfig>({
    target_team_size: 4,
    strategy: 'balanced_expertise',
    diversity_weight: 0.5,
  });

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // shared axios wrapper returns data directly
        const users = await api.get<ITeambuilderUser[]>('users/');
        setAvailableCandidates(users);
      } catch (err) {
         
        console.error('Failed to fetch users', err);
        setError('Could not load candidate list.');
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleCreateSession = async () => {
    if (!sessionName.trim()) {
      setError('Session name is required.');
      return;
    }
    if (selectedCandidateIds.length < 2) {
      setError('Please select at least 2 candidates.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: ICreateSessionRequest = {
        name: sessionName,
        description: sessionDescription,
        candidate_ids: selectedCandidateIds,
        algorithm_config: algorithmConfig,
        ...(problemId ? { problem_id: problemId } : {}),
      };

      const session = await teambuilderService.createSession(payload);

      router.push(`/teambuilder/${session.id}`);
    } catch (err) {
       
      console.error(err);
      setError('Failed to create session. Please try again.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3);
    } else {
      router.push('/teambuilder');
    }
  };

  const handleNext = () => {
    setStep((s) => Math.min(3, s + 1) as 1 | 2 | 3);
  };

  // ---------------------------------------------------------------------------
  // Render Steps
  // ---------------------------------------------------------------------------

  const renderStep1 = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Space align="baseline">
          <Text strong>Session Name</Text>
          <Text type="danger">*</Text>
        </Space>
        <Input
          style={{ marginTop: 8 }}
          placeholder="e.g. Q3 Hackathon Teams"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          maxLength={200}
        />
      </div>

      <div>
        <Text strong>Description</Text>
        <TextArea
          style={{ marginTop: 8 }}
          rows={3}
          placeholder="Optional context about this team formation..."
          value={sessionDescription}
          onChange={(e) => setSessionDescription(e.target.value)}
        />
      </div>
    </Space>
  );

  const renderStep2 = () => (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Paragraph type="secondary">
        Select the pool of users you want to organize into teams.
      </Paragraph>

      {usersLoading ? (
        <div
          style={{
            padding: '40px 0',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Spin size="large" />
        </div>
      ) : (
        <CandidateSelector
          candidates={availableCandidates}
          selectedIds={selectedCandidateIds}
          onChange={setSelectedCandidateIds}
        />
      )}

      <Text type="secondary" style={{ textAlign: 'right', display: 'block' }}>
        {selectedCandidateIds.length} candidates selected
      </Text>
    </Space>
  );

  const renderStep3 = () => (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Paragraph type="secondary">
        Configure how the engine should distribute the selected candidates.
      </Paragraph>

      <AlgorithmConfig config={algorithmConfig} onChange={setAlgorithmConfig} />

      <Alert
        type="info"
        showIcon
        style={{ marginTop: 8 }}
        message={
          <span>
            <strong>Summary:</strong> Creating teams of approximately{' '}
            <strong>{algorithmConfig.target_team_size}</strong> people using the{' '}
            <strong>
              {algorithmConfig.strategy === 'random'
                ? 'Random'
                : 'Balanced Expertise'}
            </strong>{' '}
            strategy.
          </span>
        }
      />
    </Space>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------

  return (
    <TeamBuilderPageShell
      title="Create Team Session"
      subtitle="Set up a new team building session: define basics, pick candidates, and configure the matching algorithm."
      sectionLabel="Sessions"
      maxWidth={960}
      secondaryActions={
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/teambuilder')}
        >
          Back to sessions
        </Button>
      }
    >
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Steps
            current={step - 1}
            items={[
              {
                title: 'Basics',
                icon: <FileTextOutlined />,
              },
              {
                title: 'Candidates',
                icon: <TeamOutlined />,
              },
              {
                title: 'Logic',
                icon: <BranchesOutlined />,
              },
            ]}
          />

          {error && (
            <Alert
              type="error"
              showIcon
              message="There was a problem"
              description={error}
            />
          )}

          {renderCurrentStep()}

          <Space
            style={{
              width: '100%',
              justifyContent: 'space-between',
              marginTop: 8,
            }}
          >
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
            >
              {step > 1 ? 'Back' : 'Cancel'}
            </Button>

            {step < 3 ? (
              <Button
                type="primary"
                onClick={handleNext}
                disabled={step === 1 && !sessionName.trim()}
              >
                Next: {step === 1 ? 'Select Candidates' : 'Configure Algorithm'}
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleCreateSession}
                loading={loading}
              >
                Create &amp; View Session
              </Button>
            )}
          </Space>
        </Space>
      </Card>
    </TeamBuilderPageShell>
  );
}
