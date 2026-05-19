# Assets Web UI

资产管理平台前端应用，基于 [Vben Admin](https://github.com/vbenjs/vue-vben-admin) 模板构建，提供 IT 资产全生命周期管理的可视化操作界面。

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Vue 3 | ^3.5.32 |
| 构建工具 | Vite | ^8.0.10 |
| UI 组件库 | Ant Design Vue | ^4.2.6 |
| 状态管理 | Pinia | ^3.0.4 |
| 路由 | Vue Router | ^5.0.4 |
| HTTP 客户端 | Axios (@vben/request) | ^1.15.0 |
| CSS 框架 | Tailwind CSS | ^4.2.2 |
| 类型系统 | TypeScript | ^6.0.3 |
| 图表 | ECharts | ^6.0.0 |
| 表格 | VXE Table | ^4.18.11 |
| 包管理 | pnpm (workspaces) + Turborepo | pnpm 10.33.0 |
| 认证 | Casdoor (casdoor-js-sdk) | ^0.19.0 |

## 功能特性

### 资产管理工作台 (`/assets`)

提供四个功能标签页，覆盖资产管理全流程：

- **资产台账**：资产列表的搜索、筛选（编码/名称/分类/状态）、分页展示；侧边栏支持"快速入库"和业务操作（领用、归还、调拨、维修、故障退库、报废）
- **流转记录**：资产状态变更时间线，侧边栏展示维修历史
- **资产分类**：分类列表与折旧设置管理，侧边栏支持新增分类
- **盘点折旧**：盘点任务管理，侧边栏支持折旧计算与记录查询

### 看板统计

资产总量、价值汇总、状态/分类/部门分布、趋势图表。

### 认证

- **本地模式**：用户名密码登录
- **Casdoor SSO**：OAuth2 单点登录，自动提取用户角色与权限

## 项目结构

```
web/
├── apps/web-antd/                  # 主应用
│   ├── src/
│   │   ├── api/                    # API 接口层
│   │   │   ├── core/              # 认证、菜单、用户 API
│   │   │   └── asset.ts           # 资产管理 API
│   │   ├── auth/                   # Casdoor SSO 集成
│   │   ├── layouts/               # 布局组件
│   │   ├── router/                # 路由配置
│   │   │   └── routes/modules/    # 业务路由（assets、dashboard）
│   │   ├── store/                 # Pinia 状态管理
│   │   ├── views/
│   │   │   ├── assets/index.vue   # 资产管理工作台（核心页面）
│   │   │   ├── home/index.vue     # 首页
│   │   │   └── _core/             # 登录、错误页等
│   │   ├── main.ts                # 应用入口
│   │   └── bootstrap.ts           # 启动引导
│   ├── .env                       # 基础环境变量
│   ├── .env.development           # 开发环境配置
│   ├── .env.production            # 生产环境配置
│   └── vite.config.ts             # Vite 配置
├── packages/                       # 共享运行时包
│   └── @core/                     # Vben 核心包（UI 组件、状态、工具等）
├── internal/                       # 本地构建与 lint 工具
└── scripts/                        # 脚本工具
```

## 快速启动

### 环境要求

- Node.js ^20.19.0 || ^22.18.0 || ^24.0.0
- pnpm >= 10.0.0

### 安装依赖

```bash
cd web
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

前端开发服务器启动后访问 `http://localhost:5666`，API 请求自动代理到 `http://localhost:8080`（后端服务）。

### 生产构建

```bash
pnpm build
```

构建产物位于 `apps/web-antd/dist/`，同时生成 `dist.zip` 压缩包。

### 预览构建结果

```bash
pnpm preview
```

### 代码检查

```bash
pnpm lint          # ESLint + Oxlint 检查
pnpm format        # 自动格式化
pnpm typecheck     # TypeScript 类型检查
```

### 测试

```bash
pnpm test:unit     # 单元测试 (Vitest)
pnpm test:e2e      # E2E 测试 (Playwright)
```

## 配置说明

### 开发环境 (`apps/web-antd/.env.development`)

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_PORT` | 开发服务器端口 | `5666` |
| `VITE_PROXY_TARGET` | API 代理目标地址 | `http://localhost:8080` |
| `VITE_GLOB_AUTH_MODE` | 认证模式 | `local` |

### 认证配置

本地模式下，通过登录页面调用 `/api/auth/login` 获取 token。

Casdoor SSO 模式需在 `.env` 文件中配置：

```env
VITE_GLOB_AUTH_MODE=casdoor
VITE_GLOB_CASDOOR_SERVER_URL=https://your-casdoor-server
VITE_GLOB_CASDOOR_CLIENT_ID=your-client-id
VITE_GLOB_CASDOOR_APP_NAME=your-app
VITE_GLOB_CASDOOR_ORG_NAME=your-org
VITE_GLOB_CASDOOR_REDIRECT_PATH=/auth/casdoor-callback
```

在 Casdoor 中添加回调地址：`http://localhost:5666/auth/casdoor-callback`

### 请求加密（可选）

```env
VITE_GLOB_ENABLE_ENCRYPT=true
VITE_GLOB_ENCRYPT_HEADER_KEY=encrypt-key
VITE_GLOB_RSA_PUBLIC_KEY=your-rsa-public-key
```

## License

MIT
