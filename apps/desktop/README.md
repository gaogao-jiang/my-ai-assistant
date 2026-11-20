# Pi 桌面助手

第一步：Electron + React + TypeScript 桌面界面骨架，尚未连接模型。

## 启动（PowerShell）

```powershell
cd D:\Vibe_coding\AI\pi-agent\apps\desktop
npm start
```

`npm start` 先构建本应用，再打开原生桌面窗口。修改源码后重新启动；本阶段不引入开发服务器或热更新。
也可在仓库根目录运行 `npm start --workspace=@pi/desktop`。

首次恢复依赖时，在仓库根目录按仓库规则运行：

```powershell
npm install --ignore-scripts
npm install --package-lock-only --ignore-scripts
npm run setup:electron --workspace=@pi/desktop
```

最后一条是 Electron 官方提供的显式二进制下载命令，不执行仓库或其他包的安装生命周期脚本。只下载当前平台的 Electron，不安装另一份 Pi。依赖由根工作区及根 `package-lock.json` 管理，没有独立锁文件。

如官方二进制下载缓慢，可按 Electron 官方文档，在当前 PowerShell 会话临时指定镜像后重试（仍校验包内 SHA-256）：

```powershell
$env:ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/'
$env:ELECTRON_CUSTOM_DIR = '{{ version }}'
npm run setup:electron --workspace=@pi/desktop
```

## 版本选择

- 本机 Node.js 24.14.0 满足根仓库要求 `>=22.19.0`，也满足 Electron 45.3.0 的 npm 包要求 `>=22.12.0`。
- Electron 固定为 **45.3.0**：稳定的 45 系列，支持 Windows 10/11；2026-11-11（北京时间）发布，满足仓库 `.npmrc` 的两天发布冷却期。查询时最新 45.4.1 于 2026-11-19 发布，尚未满足冷却期。本应用不升级现有 Node.js。Electron 内置自己的 Node.js 24.22.2，和构建工具使用的本机 Node.js 独立。
- React / React DOM **19.3.0**、类型包 **19.2.14 / 19.2.3**、esbuild **0.28.2** 复用现有 `apps/p2` 和根工作区版本；TypeScript **7.0.2**、Node 类型 **22.19.19** 与根仓库一致。全部固定精确版本。
- 沿用仓库已有 esbuild 构建方式，不再引入 Vite、额外包管理器或另一套编译工具。主进程输出 ESM，沙箱 preload 输出 CommonJS，符合 Electron 的加载约束。
- `apps/p3` 自身要求 Node.js 26.3.1，整仓安装可能报告其已有引擎警告；本桌面应用不依赖或启动 p3。

参考：[Electron 45.3.0 发布说明](https://releases.electronjs.org/release/v45.3.0)、[安装与二进制下载](https://www.electronjs.org/docs/latest/tutorial/installation)、[ESM 与 preload](https://www.electronjs.org/docs/latest/tutorial/esm)。

## 当前行为与边界

- 中文侧栏、会话列表、新建会话、设置对话框、消息列表、自适应高度输入框、发送和停止按钮。
- 输入 Enter 换行；点击发送会添加标有“仅本地 · 未发送”的消息，不伪造助手回复。切换会话保留各自草稿。停止按钮禁用，因为没有模型生成任务。
- 会话只保存在当前窗口内存，刷新或关闭窗口即丢失。未接入 API 密钥、模型、网络、Pi 引擎或磁盘持久化。
- 保留 Windows 原生标题栏、窗口缩放与系统窗口操作；最小窗口 640 × 540，侧栏和消息区分别滚动。
- `contextIsolation: true`、`nodeIntegration: false`、`sandbox: true`；preload 只暴露 `getAppInfo()`，不暴露 Node、文件系统、原始 IPC 或任意通道。
- 主进程校验 IPC 调用来自本地页面的主 frame；拒绝页面导航、新窗口、webview 和权限申请。CSP 禁止网络连接及内联脚本。

## 检查

在仓库根目录运行仓库规定检查，再检查并构建桌面应用：

```powershell
npm run check
npm run check --workspace=@pi/desktop
npm run build --workspace=@pi/desktop
```

根检查原本不包含 `apps`，因此桌面工作区提供独立 Biome 和 TypeScript 检查。未运行整仓测试套件。

本次已在 Windows 10 x64、Node.js 24.14.0 上运行上述检查，并实际启动桌面窗口。使用 Electron 运行时验证了界面无 Node 权限、有限 preload 接口、中文多行输入、本地消息标记、会话草稿切换、设置开关与 640 × 540 窗口布局。截图和断言结果保存在根目录忽略的 `.artifacts/desktop/`。使用临时入口测试时，应用版本会显示为 Electron 版本；正常从桌面工作区启动时读取本工作区的版本。

## 下一步（尚未实现）

后续在主进程或独立受控进程接入**本仓库** `packages/agent`、`packages/ai`（需要编码工具和会话管理时再考虑 `packages/coding-agent`），通过新增的有限 IPC 传递真实消息、流式事件与停止请求。密钥与工具执行留在界面进程之外。届时再实现模型配置、真实流式回答、取消生成、会话持久化与安装包。
