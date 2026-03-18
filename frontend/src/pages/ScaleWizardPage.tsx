import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Steps,
  Table,
  Tag,
  message,
} from "antd";
import axios from "axios";

interface Environment {
  id: string;
  name: string;
}

interface MiddlewareInstance {
  id: string;
  name: string;
  type: string;
  environmentId: string;
}

interface ConcurrencyProfile {
  id: string;
  name: string;
  level: "million" | "ten_million" | "fifty_million" | "hundred_million";
  minTps: number;
  maxTps: number;
  description?: string;
}

interface PlanResponse {
  targetProfile: ConcurrencyProfile;
  middlewareCount: number;
  riskLevel: "high" | "medium" | "low";
  suggestions: {
    nginxLike: {
      instanceId: string;
      instanceName: string;
      params: {
        key: string;
        originalValue: string | number;
        suggestedValue: string | number;
        description: string;
      }[];
    }[];
    redisLike: {
      instanceId: string;
      instanceName: string;
      params: {
        key: string;
        originalValue: string | number;
        suggestedValue: string | number;
        description: string;
      }[];
    }[];
    mqLike: {
      instanceId: string;
      instanceName: string;
      params: {
        key: string;
        originalValue: string | number;
        suggestedValue: string | number;
        description: string;
      }[];
    }[];
  };
  message: string;
}

const api = axios.create({
  baseURL: "http://localhost:4000",
});

function ScaleWizardPage() {
  const [step, setStep] = useState(0);
  const [envs, setEnvs] = useState<Environment[]>([]);
  const [instances, setInstances] = useState<MiddlewareInstance[]>([]);
  const [profiles, setProfiles] = useState<ConcurrencyProfile[]>([]);

  const [form] = Form.useForm();
  const [selectedEnvId, setSelectedEnvId] = useState<string>();
  const [selectedMiddlewareIds, setSelectedMiddlewareIds] = useState<string[]>([]);
  const [planResult, setPlanResult] = useState<PlanResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedParams, setSelectedParams] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      try {
        const [envRes, mwRes, profRes] = await Promise.all([
          api.get<Environment[]>("/api/environments"),
          api.get<MiddlewareInstance[]>("/api/middleware"),
          api.get<ConcurrencyProfile[]>("/api/concurrency-profiles"),
        ]);
        setEnvs(envRes.data);
        setInstances(mwRes.data);
        setProfiles(profRes.data);
      } catch {
        message.error("初始化数据失败，请确认后端服务已启动");
      }
    })();
  }, []);

  const envOptions = envs.map((e) => ({ label: e.name, value: e.id }));
  const profileOptions = profiles.map((p) => ({
    label: `${p.name} (${p.minTps}~${p.maxTps} TPS)`,
    value: p.id,
  }));

  const filteredInstances = useMemo(
    () =>
      selectedEnvId
        ? instances.filter((i) => i.environmentId === selectedEnvId)
        : [],
    [instances, selectedEnvId]
  );

  const handleNext = async () => {
    if (step === 0) {
      try {
        const values = await form.validateFields(["environmentId", "targetProfileId"]);
        setSelectedEnvId(values.environmentId);
        setStep(1);
      } catch {
        // validation errors
      }
    } else if (step === 1) {
      if (selectedMiddlewareIds.length === 0) {
        message.warning("请至少选择一个中间件参与本次量级调整");
        return;
      }
      setStep(2);
    }
  };

  const handlePlan = async () => {
    try {
      const values = await form.validateFields(["environmentId", "targetProfileId"]);
      setSubmitting(true);
      const res = await api.post<PlanResponse>("/api/scale-plans", {
        environmentId: values.environmentId,
        targetProfileId: values.targetProfileId,
        middlewareIds: selectedMiddlewareIds,
      });
      setPlanResult(res.data);
      setSelectedParams({});
      message.success("生成配置建议成功");
    } catch {
      message.error("生成配置建议失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2>量级一键配置中心</h2>
      </div>
      <Steps
        current={step}
        items={[
          { title: "选择环境与目标量级" },
          { title: "选择中间件组合" },
          { title: "查看容量评估与建议" },
        ]}
        style={{ marginBottom: 24 }}
      />

      {step === 0 && (
        <Form form={form} layout="vertical">
          <Form.Item
            name="environmentId"
            label="目标环境"
            rules={[{ required: true, message: "请选择环境" }]}
          >
            <Select options={envOptions} placeholder="请选择环境" />
          </Form.Item>
          <Form.Item
            name="targetProfileId"
            label="目标并发量级"
            rules={[{ required: true, message: "请选择并发量级" }]}
          >
            <Select options={profileOptions} placeholder="请选择并发量级" />
          </Form.Item>
          <Form.Item name="note" label="变更说明（选填）">
            <Input.TextArea rows={3} placeholder="可简要说明本次提升并发的背景" />
          </Form.Item>
        </Form>
      )}

      {step === 1 && (
        <>
          <p>请选择本次需要一起调优的中间件组合（已按环境过滤）。</p>
          <Table
            rowKey="id"
            rowSelection={{
              selectedRowKeys: selectedMiddlewareIds,
              onChange: (keys) => setSelectedMiddlewareIds(keys as string[]),
            }}
            dataSource={filteredInstances}
            columns={[
              { title: "名称", dataIndex: "name" },
              { title: "类型", dataIndex: "type" },
            ]}
          />
        </>
      )}

      {step === 2 && (
        <>
          <Button type="primary" onClick={handlePlan} loading={submitting}>
            生成容量评估与参数建议
          </Button>
          {planResult && (
            <div style={{ marginTop: 24 }}>
              <h3>
                目标档位：{planResult.targetProfile.name}{" "}
                <Tag color={planResult.riskLevel === "high" ? "red" : "orange"}>
                  风险等级：{planResult.riskLevel === "high" ? "高" : "中"}
                </Tag>
              </h3>
              <p>{planResult.message}</p>

              <div style={{ marginTop: 16 }}>
                <h4>网关 / Nginx 参数建议</h4>
                {planResult.suggestions.nginxLike.map((s) => (
                  <div key={s.instanceId} style={{ marginBottom: 16 }}>
                    <b>{s.instanceName}</b>
                    <Table
                      size="small"
                      rowKey={(row) => `${s.instanceId}-${row.key}`}
                      pagination={false}
                      dataSource={s.params}
                      columns={[
                        { title: "参数名", dataIndex: "key" },
                        { title: "原值", dataIndex: "originalValue" },
                        { title: "建议值", dataIndex: "suggestedValue" },
                        { title: "说明", dataIndex: "description" },
                        {
                          title: "采用",
                          render: (_, row) => {
                            const key = `${s.instanceId}-${row.key}`;
                            const checked = selectedParams[key] ?? true;
                            return (
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  setSelectedParams((prev) => ({
                                    ...prev,
                                    [key]: e.target.checked,
                                  }))
                                }
                              />
                            );
                          },
                        },
                      ]}
                    />
                  </div>
                ))}

                <h4>Redis / 缓存 参数建议</h4>
                {planResult.suggestions.redisLike.map((s) => (
                  <div key={s.instanceId} style={{ marginBottom: 16 }}>
                    <b>{s.instanceName}</b>
                    <Table
                      size="small"
                      rowKey={(row) => `${s.instanceId}-${row.key}`}
                      pagination={false}
                      dataSource={s.params}
                      columns={[
                        { title: "参数名", dataIndex: "key" },
                        { title: "原值", dataIndex: "originalValue" },
                        { title: "建议值", dataIndex: "suggestedValue" },
                        { title: "说明", dataIndex: "description" },
                        {
                          title: "采用",
                          render: (_, row) => {
                            const key = `${s.instanceId}-${row.key}`;
                            const checked = selectedParams[key] ?? true;
                            return (
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  setSelectedParams((prev) => ({
                                    ...prev,
                                    [key]: e.target.checked,
                                  }))
                                }
                              />
                            );
                          },
                        },
                      ]}
                    />
                  </div>
                ))}

                <h4>MQ / Kafka 参数建议</h4>
                {planResult.suggestions.mqLike.map((s) => (
                  <div key={s.instanceId} style={{ marginBottom: 16 }}>
                    <b>{s.instanceName}</b>
                    <Table
                      size="small"
                      rowKey={(row) => `${s.instanceId}-${row.key}`}
                      pagination={false}
                      dataSource={s.params}
                      columns={[
                        { title: "参数名", dataIndex: "key" },
                        { title: "原值", dataIndex: "originalValue" },
                        { title: "建议值", dataIndex: "suggestedValue" },
                        { title: "说明", dataIndex: "description" },
                        {
                          title: "采用",
                          render: (_, row) => {
                            const key = `${s.instanceId}-${row.key}`;
                            const checked = selectedParams[key] ?? true;
                            return (
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  setSelectedParams((prev) => ({
                                    ...prev,
                                    [key]: e.target.checked,
                                  }))
                                }
                              />
                            );
                          },
                        },
                      ]}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 24 }}>
        {step > 0 && (
          <Button style={{ marginRight: 8 }} onClick={() => setStep(step - 1)}>
            上一步
          </Button>
        )}
        {step < 2 && (
          <Button type="primary" onClick={handleNext}>
            下一步
          </Button>
        )}
      </div>
    </div>
  );
}

export default ScaleWizardPage;

