# Personal Workspace

一个本地优先的个人工作台，用来集中管理每日计划、开发项目、健身、饮食、笔记、附件与每周复盘。

## 功能

- 每日任务规划、完成状态与优先级管理
- 开发项目、进度和项目笔记管理
- 健身训练与动作记录
- 饮食、热量和营养素记录
- 每周复盘与数据概览
- 项目附件上传和下载
- 数据备份、导出与恢复
- 浅色、深色界面
- Windows 桌面启动程序与快捷方式

## 技术栈

- React 19 + TypeScript
- Vinext + Vite
- Tailwind CSS
- Cloudflare Workers、D1 和 R2
- Drizzle ORM
- Microsoft WebView2 桌面外壳

## 本地开发

### 环境要求

- Node.js 22.13 或更高版本
- npm

### 启动开发环境

```bash
npm install
npm run dev
```

浏览器访问 <http://localhost:3000>。

### 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生成生产构建 |
| `npm run start` | 启动本地生产服务 |
| `npm run lint` | 检查代码 |
| `npm run format` | 格式化代码 |
| `npm run db:generate` | 生成数据库变更 |

## Windows 桌面使用

- 可运行 `启动个人工作台.cmd` 启动应用。
- 可运行 `创建桌面快捷方式.ps1` 创建桌面快捷方式。
- 仓库内包含桌面启动程序、图标和 WebView2 运行依赖。

## 数据与隐私

个人数据库和附件保存在项目目录下的 `.wrangler` 本地状态中，该目录不会提交到 Git。环境变量、依赖目录和构建产物同样已排除。

备份文件可能包含任务、笔记、健康记录及附件，请勿上传到公开仓库。目前应用接口没有用户登录保护，因此建议仅在本机使用，不要直接部署到公开网络。

## 目录概览

- `app/`：页面和 API
- `components/`：界面组件
- `db/`：数据库结构与初始化
- `public/`：图标和静态资源
- `vendor/`：WebView2 运行依赖

## 项目状态

项目仍在持续开发中，功能和数据结构可能发生变化。