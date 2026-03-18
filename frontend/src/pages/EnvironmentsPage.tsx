import { useEffect, useState } from "react";
import { Button, Form, Input, Modal, Select, Table, message } from "antd";
import axios from "axios";

interface Environment {
  id: string;
  name: string;
  type: "physical" | "docker" | "k8s";
  region?: string;
  description?: string;
}

const envTypeOptions = [
  { label: "物理机 / 虚机", value: "physical" },
  { label: "Docker", value: "docker" },
  { label: "Kubernetes", value: "k8s" },
];

const api = axios.create({
  baseURL: "http://localhost:4000",
});

function EnvironmentsPage() {
  const [data, setData] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get<Environment[]>("/api/environments");
      setData(res.data);
    } catch {
      message.error("获取环境列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await api.post("/api/environments", values);
      message.success("创建环境成功");
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch {
      // validation or request error already shown
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2>环境与资源</h2>
        <Button type="primary" onClick={() => setModalOpen(true)}>
          新建环境
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
            render: (v: Environment["type"]) =>
              v === "physical" ? "物理机" : v === "docker" ? "Docker" : "K8s",
          },
          { title: "区域", dataIndex: "region" },
          { title: "描述", dataIndex: "description" },
        ]}
      />

      <Modal
        title="新建环境"
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
            <Select options={envTypeOptions} />
          </Form.Item>
          <Form.Item name="region" label="区域">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default EnvironmentsPage;

