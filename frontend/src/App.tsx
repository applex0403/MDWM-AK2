import { Layout, Menu, Typography } from "antd";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import EnvironmentsPage from "./pages/EnvironmentsPage";
import MiddlewarePage from "./pages/MiddlewarePage";
import ScaleWizardPage from "./pages/ScaleWizardPage";
import "./App.css";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

function App() {
  return (
    <BrowserRouter>
      <Layout style={{ minHeight: "100vh" }}>
        <Sider theme="dark">
          <div
            style={{
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            MUMP 控制台
          </div>
          <Menu theme="dark" mode="inline">
            <Menu.Item key="env">
              <Link to="/environments">环境与资源</Link>
            </Menu.Item>
            <Menu.Item key="mw">
              <Link to="/middleware">中间件实例</Link>
            </Menu.Item>
            <Menu.Item key="scale">
              <Link to="/scale">量级一键配置</Link>
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout>
          <Header
            style={{
              background: "#fff",
              padding: "0 24px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Title level={4} style={{ margin: 0 }}>
              中间件统一管理平台（MUMP）
            </Title>
          </Header>
          <Content style={{ padding: 24 }}>
            <Routes>
              <Route path="/" element={<EnvironmentsPage />} />
              <Route path="/environments" element={<EnvironmentsPage />} />
              <Route path="/middleware" element={<MiddlewarePage />} />
              <Route path="/scale" element={<ScaleWizardPage />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
