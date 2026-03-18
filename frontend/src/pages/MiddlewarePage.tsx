import { useEffect, useState } from "react";
import { Button, Form, Input, Modal, Select, Table, message } from "antd";
import axios from "axios";

interface EnvironmentOption {
  label: string;
  value: string;
}

interface MiddlewareInstance {
  id: string;
  name: string;
  type:
    | "nginx"
    | "gateway"
    | "redis"
    | "kafka"
    | "mq"
    | "database"
    | "cache"
    | "search"
    | "task"
    | "observability";
  environmentId: string;
  node: string;
  version?: string;
  status: "running" | "stopped" | "error";
}

const api = axios.create({
  baseURL: "http://localhost:4000",
});

const typeOptions = [
  { label: "Nginx / 网关", value: "nginx" },
  { label: "注册网关", value: "gateway" },
  { label: "Redis / 缓存", value: "redis" },
  { label: "Kafka", value: "kafka" },
  { label: "消息队列", value: "mq" },
  { label: "数据库中间件", value: "database" },
  { label: "通用缓存", value: "cache" },
  { label: "搜索 / 日志", value: "search" },
  { label: "定时任务", value: "task" },
  { label: "监控可观测", value: "observability" },
];

function MiddlewarePage() {
  const [data, setData] = useState<MiddlewareInstance[]>([]);
  const [envOptions, setEnvOptions] = useState<EnvironmentOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchInstances = async () => {
    setLoading(true);
    try {
      const res = await api.get<MiddlewareInstance[]>("/api/middleware");
      setData(res.data);
    } catch {
      message.error("获取中间件实例失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchEnvironments = async () => {
    try {
      const res = await api.get<{ id: string; name: string }[]>("/api/environments");
      setEnvOptions(res.data.map((e) => ({ label: e.name, value: e.id })));
    } catch {
      message.error("获取环境列表失败");
    }
  };

  useEffect(() => {
    fetchInstances();
    fetchEnvironments();
  }, []);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await api.post("/api/middleware", values);
      message.success("创建实例成功");
      setModalOpen(false);
      form.resetFields();
      fetchInstances();
    } catch {
      // ignore
    }
  };

  const envNameById = (id: string) =>
    envOptions.find((e) => e.value === id)?.label ?? id;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2>中间件实例</h2>
        <Button type="primary" onClick={() => setModalOpen(true)}>
          新建实例
        </Button>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={[
          { title: "名称", dataIndex: "name" },
          {
            title: "类型",
            dataIndex: "type",
            render: (v: MiddlewareInstance["type"]) =>
              typeOptions.find((t) => t.value === v)?.label ?? v,
          },
          {
            title: "环境",
            dataIndex: "environmentId",
            render: (v: string) => envNameById(v),
          },
          { title: "节点 / 宿主", dataIndex: "node" },
          { title: "版本", dataIndex: "version" },
          {
            title: "状态",
            dataIndex: "status",
            render: (v: MiddlewareInstance["status"]) =>
              v === "running" ? "运行中" : v === "stopped" ? "已停止" : "异常",
          },
        ]}
      />

      <Modal
        title="新建中间件实例"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: "请输入名称" }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: "请选择类型" }]}
          >
            <Select options={typeOptions} />
          </Form.Item>
          <Form.Item
            name="environmentId"
            label="环境"
            rules={[{ required: true, message: "请选择环境" }]}
          >
            <Select options={envOptions} />
          </Form.Item>
          <Form.Item
            name="node"
            label="节点 / 宿主"
            rules={[{ required: true, message: "请输入节点信息" }]}
          >
            <Input placeholder="如 10.0.0.1 或 pod-name" />
          </Form.Item>
          <Form.Item name="version" label="版本">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default MiddlewarePage;

