# Toonflow 启动指南

## 前置条件

- **Node.js**: 版本要求 23.11.1 及以上
- **Yarn**: 推荐作为项目包管理器
- **Python**: 如果需要重新编译原生模块（如 better-sqlite3），需要 Python 环境

## 安装依赖

首次运行前，需要安装项目依赖：

```bash
yarn install
```

如果遇到原生模块编译问题，可能需要安装 Python 和构建工具。

## 启动方式

### 1. 开发模式 - 后端服务

仅启动后端 API 服务（端口 10588），不包含前端页面：

```bash
yarn dev
```

**说明**：此命令仅启动后端 API 服务，直接访问 `http://localhost:10588` 只能调用 API 接口，无法看到完整的网页界面。如需同时使用前端页面，请配合前端项目单独启动，或使用下方的 GUI 模式。

### 2. 开发模式 - Electron 桌面客户端（推荐）

同时启动后端服务和 Electron 桌面窗口，自带内置前端页面：

```bash
yarn dev:gui
```

**说明**：此命令会同时启动后端服务和 Electron 桌面窗口，自带内置前端页面，开箱即用，无需额外配置。适合想要完整体验所有功能的开发者。

### 3. 开发模式 - Electron 桌面客户端（带 Vite）

启动带 Vite 开发服务器的 Electron 桌面客户端：

```bash
yarn dev:gui-vite
```

**说明**：此命令会启动 Vite 开发服务器，适合前端开发调试。

### 4. 生产模式

以生产模式直接运行编译后的服务（需先执行 `yarn build`）：

```bash
yarn build
yarn start
```

**说明**：先编译 TypeScript 代码，然后启动生产环境服务。

## VS Code 调试配置

如果需要在 VS Code 中调试，可以创建 `.vscode/launch.json` 文件：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "启动后端服务",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "yarn",
      "runtimeArgs": ["dev"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "启动 Electron 桌面客户端",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "yarn",
      "runtimeArgs": ["dev:gui"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "启动生产服务",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "yarn",
      "runtimeArgs": ["start"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

## 常见问题

### 1. 登录失败

如果遇到登录失败，可能是数据库模块版本不匹配问题。

**解决方案**：
- 检查后端日志，查看是否有 `better-sqlite3` 相关错误
- 如果有原生模块版本不匹配错误，需要重新编译或切换到 `sqlite3`

### 2. 原生模块编译失败

如果 `electron-rebuild` 失败，提示缺少 Python：

**解决方案**：
- 安装 Python 3.x
- 安装 Visual Studio Build Tools（Windows）
- 运行 `yarn electron-rebuild`

### 3. 端口占用

如果端口 10588 被占用：

**解决方案**：
- 修改环境变量 `PORT` 为其他端口
- 或者关闭占用该端口的进程

## 默认账号

首次登录使用以下默认账号：

- **账号**: `admin`
- **密码**: `admin123`

登录后可以在设置中心修改密码。

## 项目结构

```
📂 build/                    # 编译产物
📂 data/                     # 运行时数据
│  ├─ 📂 models/            # 本地推理模型（ONNX）
│  ├─ 📂 oss/               # 对象存储（素材/角色/场景）
│  ├─ 📂 serve/             # 生产环境入口
│  ├─ 📂 skills/            # Agent 技能提示词
│  └─ 📂 web/               # 前端编译产物（内置）
📂 src/
├─ 📂 agents/               # AI Agent 模块
├─ 📂 lib/                  # 公共库（数据库初始化、响应格式）
├─ 📂 middleware/            # 中间件
├─ 📂 routes/               # 路由模块
├─ 📂 socket/               # WebSocket 实时通信
├─ 📂 types/                # TypeScript 类型声明
├─ 📂 utils/                # 工具函数
└─ 📄 app.ts                # 应用入口
```

## 其他命令

### 代码检查

进行全局语法和规范检查：

```bash
yarn lint
```

### 项目打包

编译并生成 TypeScript 文件：

```bash
yarn build
```

打包为 Windows 平台可执行程序：

```bash
yarn dist:win
```

打包为 Mac 平台可执行程序：

```bash
yarn dist:mac
```

打包为 Linux 平台可执行程序：

```bash
yarn dist:linux
```

### AI 调试面板

启动 AI SDK 的可视化调试工具：

```bash
yarn debug:ai
```

## 供应商配置

首次使用需要配置 AI 供应商：

1. 登录后进入设置中心
2. 添加供应商，填写 TypeScript 代码文件的 GitHub 链接
3. 推荐供应商链接：
   - Toonflow官方中转平台：`https://raw.githubusercontent.com/HBAI-Ltd/Toonflow-app/master/data/vendor/toonflow.ts`
   - 火山引擎(豆包)：`https://raw.githubusercontent.com/HBAI-Ltd/Toonflow-app/master/data/vendor/volcengine.ts`
   - OpenAI标准接口：`https://raw.githubusercontent.com/HBAI-Ltd/Toonflow-app/master/data/vendor/openai.ts`
4. 填写对应的 API 密钥即可使用

## 技术支持

- **邮箱**: [ltlctools@outlook.com](mailto:ltlctools@outlook.com?subject=Toonflow咨询)
- **GitHub**: https://github.com/HBAI-Ltd/Toonflow-app
- **文档**: README.md
