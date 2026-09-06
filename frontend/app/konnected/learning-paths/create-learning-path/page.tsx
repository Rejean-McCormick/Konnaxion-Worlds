// FILE: frontend/app/konnected/learning-paths/create-learning-path/page.tsx
"use client";

import {
  PageContainer,
  ProCard,
  ProDescriptions,
  ProFormDependency,
  ProFormInstance,
  ProFormList,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  StepsForm,
} from "@ant-design/pro-components";
import {
  Alert,
  Button,
  Drawer,
  Empty,
  Input,
  message,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useCallback, useMemo, useRef, useState } from "react";
import type { Key } from "react";

import { apiFetch } from '@/api';
import KonnectedPageShell from "@/app/konnected/KonnectedPageShell";

const { Paragraph } = Typography;
const { Search } = Input;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

type LearningPathStatus = "draft" | "published";

type LearningPathStepForm = {
  title: string;
  type: "lesson" | "quiz" | "assignment";
  objective?: string;
  resourceIds?: number[];
};

type LearningPathFormValues = {
  name: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  tags?: string[];
  steps?: LearningPathStepForm[];
};

type KnowledgeResource = {
  id: number;
  title: string;
  type: "article" | "video" | "lesson" | "quiz" | "dataset";
  author?: string | null;
  subject?: string | null;
  estimated_duration_minutes?: number | null;
};

type ResourceSearchParams = {
  q?: string;
  type?: KnowledgeResource["type"] | "all";
};

type ErrorResponse = {
  detail?: string;
};

type KnowledgeResourceListResponse =
  | KnowledgeResource[]
  | {
      results?: KnowledgeResource[];
    };

const buildUrl = (path: string) => {
  if (API_BASE) return `${API_BASE}${path}`;
  return path;
};

async function createLearningPath(
  values: LearningPathFormValues,
  status: LearningPathStatus
) {
  const response = await apiFetch(buildUrl("/api/konnected/learning-paths/"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: values.name,
      description: values.description,
      difficulty: values.difficulty,
      tags: values.tags ?? [],
      status,
      steps: (values.steps ?? []).map((step, index) => ({
        order: index + 1,
        title: step.title,
        type: step.type,
        objective: step.objective,
        resource_ids: step.resourceIds ?? [],
      })),
    }),
  });

  if (!response.ok) {
    let detail = "Failed to save learning path.";
    try {
      const data = (await response.json()) as ErrorResponse;
      if (typeof data.detail === "string") detail = data.detail;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(detail);
  }

  return response.json().catch(() => null);
}

async function fetchKnowledgeResources(
  params: ResourceSearchParams
): Promise<KnowledgeResource[]> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.type && params.type !== "all") search.set("type", params.type);

  const response = await apiFetch(
    buildUrl(`/api/knowledge/resources/${search.toString() ? `?${search}` : ""}`)
  );

  if (!response.ok) {
    throw new Error("Failed to load resources.");
  }

  const data = (await response.json()) as KnowledgeResourceListResponse;

  if (Array.isArray(data)) return data as KnowledgeResource[];
  if (Array.isArray(data.results)) return data.results as KnowledgeResource[];
  return [];
}

const CONTENT_TYPE_OPTIONS: {
  label: string;
  value: ResourceSearchParams["type"];
}[] = [
  { label: "All types", value: "all" },
  { label: "Articles", value: "article" },
  { label: "Videos", value: "video" },
  { label: "Lessons", value: "lesson" },
  { label: "Quizzes", value: "quiz" },
  { label: "Datasets", value: "dataset" },
];

const difficultyOptions = [
  { label: "Beginner", value: "Beginner" },
  { label: "Intermediate", value: "Intermediate" },
  { label: "Advanced", value: "Advanced" },
];

const stepTypeOptions = [
  { label: "Lesson", value: "lesson" },
  { label: "Quiz", value: "quiz" },
  { label: "Assignment", value: "assignment" },
];

const CreateLearningPathPage: React.FC = () => {
  const formRef = useRef<ProFormInstance<LearningPathFormValues>>();
  const [submitMode, setSubmitMode] = useState<LearningPathStatus>("draft");
  const [submitting, setSubmitting] = useState(false);

  const [resourceDrawerOpen, setResourceDrawerOpen] = useState(false);
  const [resourceDrawerStepIndex, setResourceDrawerStepIndex] = useState<number | null>(null);
  const [resourceSearchParams, setResourceSearchParams] =
    useState<ResourceSearchParams>({});
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resources, setResources] = useState<KnowledgeResource[]>([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState<Key[]>([]);

  const openResourceDrawer = useCallback((stepIndex: number) => {
    setResourceDrawerStepIndex(stepIndex);

    const steps = formRef.current?.getFieldValue("steps") as
      | LearningPathStepForm[]
      | undefined;

    if (steps && steps[stepIndex]?.resourceIds?.length) {
      setSelectedResourceIds(steps[stepIndex].resourceIds as Key[]);
    } else {
      setSelectedResourceIds([]);
    }

    setResourcesLoading(true);
    fetchKnowledgeResources({})
      .then(setResources)
      .catch((err) => {
        message.error(err.message || "Failed to load resources.");
        setResources([]);
      })
      .finally(() => setResourcesLoading(false));

    setResourceDrawerOpen(true);
  }, []);

  const closeResourceDrawer = () => {
    setResourceDrawerOpen(false);
    setResourceDrawerStepIndex(null);
  };

  const handleResourceSearch = useCallback(
    (q?: string) => {
      const nextParams: ResourceSearchParams = {
        ...resourceSearchParams,
        q: q || undefined,
      };
      setResourceSearchParams(nextParams);

      setResourcesLoading(true);
      fetchKnowledgeResources(nextParams)
        .then(setResources)
        .catch((err) => {
          message.error(err.message || "Failed to load resources.");
          setResources([]);
        })
        .finally(() => setResourcesLoading(false));
    },
    [resourceSearchParams]
  );

  const handleResourceTypeChange = (type: ResourceSearchParams["type"]): void => {
    const nextParams: ResourceSearchParams = {
      ...resourceSearchParams,
      type,
    };
    setResourceSearchParams(nextParams);

    setResourcesLoading(true);
    fetchKnowledgeResources(nextParams)
      .then(setResources)
      .catch((err) => {
        message.error(err.message || "Failed to load resources.");
        setResources([]);
      })
      .finally(() => setResourcesLoading(false));
  };

  const handleResourceDrawerOk = () => {
    if (resourceDrawerStepIndex == null) {
      closeResourceDrawer();
      return;
    }

    const currentSteps =
      (formRef.current?.getFieldValue("steps") as LearningPathStepForm[]) ?? [];

    const updatedSteps = currentSteps.map((step, index) =>
      index === resourceDrawerStepIndex
        ? { ...step, resourceIds: selectedResourceIds as number[] }
        : step
    );

    formRef.current?.setFieldsValue({ steps: updatedSteps });
    closeResourceDrawer();
  };

  const resourceColumns: ColumnsType<KnowledgeResource> = useMemo(
    () => [
      {
        title: "Title",
        dataIndex: "title",
        key: "title",
      },
      {
        title: "Type",
        dataIndex: "type",
        key: "type",
        render: (value) => <Tag>{value}</Tag>,
      },
      {
        title: "Author",
        dataIndex: "author",
        key: "author",
        render: (value) => value || "—",
      },
      {
        title: "Subject",
        dataIndex: "subject",
        key: "subject",
        render: (value) => value || "—",
      },
      {
        title: "Estimated time",
        dataIndex: "estimated_duration_minutes",
        key: "estimated_duration_minutes",
        render: (value) => (value ? `${value} min` : "—"),
      },
    ],
    []
  );

  const handleFinish = async (values: LearningPathFormValues) => {
    if (submitMode === "published") {
      if (!values.steps || values.steps.length === 0) {
        message.error("You must add at least one step before publishing.");
        return false;
      }

      const missingResources = values.steps.some(
        (step) => !step.resourceIds || step.resourceIds.length === 0
      );
      if (missingResources) {
        message.error(
          "Each step must have at least one resource attached before publishing."
        );
        return false;
      }
    }

    setSubmitting(true);
    try {
      await createLearningPath(values, submitMode);
      message.success(
        submitMode === "published"
          ? "Learning path published."
          : "Learning path saved as draft."
      );
      return true;
    } catch (error: unknown) {
      message.error(
        error instanceof Error ? error.message : "Failed to save learning path.",
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KonnectedPageShell
      title="Create learning path"
      subtitle="Author a structured sequence of resources that learners can follow."
      primaryAction={null}
    >
      <PageContainer>
        <ProCard>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Use this wizard to define metadata, steps, and resources for a new learning path. You can save it as a draft or publish it when complete."
          />

          <StepsForm<LearningPathFormValues>
            formRef={formRef}
            onFinish={handleFinish}
            submitter={{
              render: (props) => {
                const { onSubmit, onPre } = props;
                return [
                  <Button
                    key="pre"
                    onClick={() => {
                      onPre?.();
                    }}
                  >
                    Previous
                  </Button>,
                  <Button
                    key="save-draft"
                    onClick={() => {
                      setSubmitMode("draft");
                      onSubmit?.();
                    }}
                    loading={submitting}
                  >
                    Save draft
                  </Button>,
                  <Button
                    key="publish"
                    type="primary"
                    onClick={() => {
                      setSubmitMode("published");
                      onSubmit?.();
                    }}
                    loading={submitting}
                  >
                    Publish
                  </Button>,
                ];
              },
            }}
          >
            <StepsForm.StepForm<LearningPathFormValues>
              name="basic"
              title="Basics"
            >
              <ProFormText
                name="name"
                label="Path name"
                placeholder="e.g. Web fundamentals for new team members"
                rules={[
                  { required: true, message: "Please enter a path name." },
                  {
                    min: 4,
                    message: "Name should be at least 4 characters long.",
                  },
                ]}
              />
              <ProFormTextArea
                name="description"
                label="Description"
                placeholder="Describe who this path is for and what it covers."
                fieldProps={{ autoSize: { minRows: 3, maxRows: 6 } }}
                rules={[
                  {
                    required: true,
                    message: "Please enter a description.",
                  },
                  {
                    min: 20,
                    message: "Description should be at least 20 characters long.",
                  },
                ]}
              />
              <ProFormSelect
                name="difficulty"
                label="Difficulty"
                options={difficultyOptions}
                placeholder="Select difficulty level"
                rules={[
                  { required: true, message: "Please select a difficulty." },
                ]}
              />
              <ProFormSelect
                name="tags"
                label="Tags"
                mode="tags"
                placeholder="Add tags (optional)"
                fieldProps={{ tokenSeparators: [","] }}
              />
            </StepsForm.StepForm>

            <StepsForm.StepForm<LearningPathFormValues>
              name="steps"
              title="Steps"
            >
              <ProFormList
                name="steps"
                label="Path steps"
                creatorButtonProps={{
                  position: "bottom",
                  creatorButtonText: "Add step",
                }}
                rules={[
                  {
                    validator: async (_, value) => {
                      if (!value || value.length === 0) {
                        throw new Error(
                          "You must add at least one step to the path."
                        );
                      }
                    },
                  },
                ]}
              >
                {(field, index) => (
                  <ProCard
                    bordered
                    style={{ marginBottom: 8 }}
                    title={`Step ${index + 1}`}
                  >
                    <ProFormText
                      name={[field.name, "title"]}
                      label="Step title"
                      placeholder="e.g. Introduction to HTML & CSS"
                      rules={[
                        {
                          required: true,
                          message: "Please enter a step title.",
                        },
                      ]}
                    />
                    <ProFormSelect
                      name={[field.name, "type"]}
                      label="Step type"
                      options={stepTypeOptions}
                      rules={[
                        {
                          required: true,
                          message: "Please select a step type.",
                        },
                      ]}
                    />
                    <ProFormTextArea
                      name={[field.name, "objective"]}
                      label="Learning objective"
                      placeholder="What should learners be able to do after this step?"
                      fieldProps={{
                        autoSize: { minRows: 2, maxRows: 4 },
                      }}
                    />
                  </ProCard>
                )}
              </ProFormList>
            </StepsForm.StepForm>

            <StepsForm.StepForm<LearningPathFormValues>
              name="resources"
              title="Resources"
            >
              <ProFormDependency name={["steps"]}>
                {({ steps }) => {
                  const stepList = (steps as LearningPathStepForm[]) ?? [];
                  if (!stepList.length) {
                    return (
                      <Alert
                        type="warning"
                        showIcon
                        message="You need to create at least one step in the previous step before attaching resources."
                      />
                    );
                  }

                  return (
                    <>
                      <Paragraph>
                        Attach one or more library resources to each step. You can
                        still save as a draft without completing all attachments,
                        but every step must have at least one resource before
                        publishing.
                      </Paragraph>

                      <Space direction="vertical" style={{ width: "100%" }}>
                        {stepList.map((step, index) => (
                          <ProCard
                            key={index}
                            bordered
                            title={`Step ${index + 1}: ${
                              step.title || "Untitled"
                            }`}
                            extra={
                              <Button
                                onClick={() => openResourceDrawer(index)}
                                size="small"
                              >
                                Select resources
                              </Button>
                            }
                          >
                            {step.resourceIds && step.resourceIds.length > 0 ? (
                              <Space wrap>
                                {step.resourceIds.map((id) => (
                                  <Tag key={id}>{`Resource #${id}`}</Tag>
                                ))}
                              </Space>
                            ) : (
                              <Paragraph type="secondary">
                                No resources attached yet.
                              </Paragraph>
                            )}
                          </ProCard>
                        ))}
                      </Space>
                    </>
                  );
                }}
              </ProFormDependency>
            </StepsForm.StepForm>

            <StepsForm.StepForm<LearningPathFormValues>
              name="review"
              title="Review & publish"
            >
              <ProFormDependency
                name={["name", "description", "difficulty", "tags", "steps"]}
              >
                {({ name, description, difficulty, tags, steps }) => {
                  const stepList = (steps as LearningPathStepForm[]) ?? [];

                  return (
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <ProDescriptions
                        column={1}
                        title="Path summary"
                        dataSource={{
                          name,
                          description,
                          difficulty,
                          tags,
                        }}
                      >
                        <ProDescriptions.Item label="Name" dataIndex="name" />
                        <ProDescriptions.Item
                          label="Description"
                          dataIndex="description"
                        />
                        <ProDescriptions.Item
                          label="Difficulty"
                          dataIndex="difficulty"
                        />
                        <ProDescriptions.Item
                          label="Tags"
                          dataIndex="tags"
                          render={(_, record) => {
                            const value = (record as {
                              tags?: string[];
                            }).tags;

                            return value && value.length ? (
                              <Space wrap>
                                {value.map((t) => (
                                  <Tag key={t}>{t}</Tag>
                                ))}
                              </Space>
                            ) : (
                              <span>—</span>
                            );
                          }}
                        />
                      </ProDescriptions>

                      <ProCard title="Steps" bordered>
                        {stepList.length === 0 ? (
                          <Paragraph type="secondary">
                            No steps defined yet.
                          </Paragraph>
                        ) : (
                          <Space direction="vertical" style={{ width: "100%" }}>
                            {stepList.map((step, index) => (
                              <ProCard
                                key={index}
                                bordered
                                title={`Step ${index + 1}: ${
                                  step.title || "Untitled"
                                }`}
                              >
                                <Paragraph>
                                  <strong>Type:</strong> {step.type}
                                </Paragraph>
                                {step.objective && (
                                  <Paragraph>
                                    <strong>Objective:</strong> {step.objective}
                                  </Paragraph>
                                )}
                                <Paragraph>
                                  <strong>Resources:</strong>{" "}
                                  {step.resourceIds &&
                                  step.resourceIds.length > 0 ? (
                                    <Space wrap>
                                      {step.resourceIds.map((id) => (
                                        <Tag key={id}>{`Resource #${id}`}</Tag>
                                      ))}
                                    </Space>
                                  ) : (
                                    <span>None</span>
                                  )}
                                </Paragraph>
                              </ProCard>
                            ))}
                          </Space>
                        )}
                      </ProCard>

                      {submitMode === "published" && (
                        <Alert
                          type="warning"
                          showIcon
                          message="Publishing will make this path visible to eligible learners. Make sure steps and resources are complete."
                        />
                      )}
                    </Space>
                  );
                }}
              </ProFormDependency>
            </StepsForm.StepForm>
          </StepsForm>
        </ProCard>
      </PageContainer>

      <Drawer
        title="Select resources"
        width={720}
        open={resourceDrawerOpen}
        onClose={closeResourceDrawer}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={closeResourceDrawer}>Cancel</Button>
            <Button type="primary" onClick={handleResourceDrawerOk}>
              Attach selected
            </Button>
          </Space>
        }
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <Search
            placeholder="Search resources"
            allowClear
            onSearch={(value) => handleResourceSearch(value || undefined)}
            style={{ width: 260 }}
          />
          <Select
            style={{ width: 200 }}
            defaultValue="all"
            options={CONTENT_TYPE_OPTIONS}
            onChange={(value) =>
              handleResourceTypeChange(value as ResourceSearchParams["type"])
            }
          />
        </Space>

        {resourcesLoading ? (
          <Spin />
        ) : resources.length === 0 ? (
          <Empty description="No resources found." />
        ) : (
          <Table<KnowledgeResource>
            rowKey="id"
            dataSource={resources}
            columns={resourceColumns}
            rowSelection={{
              selectedRowKeys: selectedResourceIds,
              onChange: (keys) => setSelectedResourceIds(keys),
            }}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Drawer>
    </KonnectedPageShell>
  );
};

export default CreateLearningPathPage;