# @office/utils

Office 前端基础工具库，从 `monorepo-admin/packages/office-lib` 迁移而来，改为**构建产物 + 独立发布 npm** 的形态。

- 纯 ESM，TypeScript 编写，产物自带 `.d.ts`
- 入口按能力拆分，纯计算场景不会拖入 React / axios

## 安装

```bash
npm install @office/utils

# 只在使用 useRequest 时才需要（可选 peer）
npm install react
```

## 入口

| 入口                    | 内容                                                                                            | 运行时依赖 |
| ----------------------- | ----------------------------------------------------------------------------------------------- | ---------- |
| `@office/utils`         | is / storage / format / date / object / tree / function / validate / url / download / dom / env | dayjs      |
| `@office/utils/request` | axios 封装 `Request`、`http`、`createRequest`、`setupRequestHooks`、错误类型                    | axios      |
| `@office/utils/hooks`   | `useRequest`                                                                                    | react      |

```ts
import { formatMoney, formatDate, storage } from '@office/utils';
import { http, createRequest } from '@office/utils/request';
import { useRequest } from '@office/utils/hooks';
```

## 环境变量

`env` 与 `http` 的默认值读取 Vite 注入的 `import.meta.env`，非 Vite 宿主下自动降级为默认值（不会抛错）：

| 变量                   | 默认值         |
| ---------------------- | -------------- |
| `VITE_API_BASE_URL`    | `/api`         |
| `VITE_REQUEST_TIMEOUT` | `15000`        |
| `VITE_APP_TITLE`       | `后台管理系统` |
| `VITE_USE_MOCK`        | `false`        |
| `VITE_ROUTER_MODE`     | `hash`         |

## 本地开发

```bash
npm run build -w @office/utils   # 或根目录 npm run build:utils
npm run dev -w @office/utils     # tsc --watch
npm run typecheck
npm run lint
```

## 发布

单包独立发版，版本号在 `packages/office-utils/package.json` 里维护。

```bash
# 根目录执行
npm run release:dry    # 预演：构建 + npm pack 内容预览
npm run release:utils  # 真正发布（prepublishOnly 会先 build + typecheck）

# 或在包目录
npm version patch && npm publish
```

发布前请确认：

1. `npm whoami` 已登录，且账号对 `@office` scope 有发布权限（`publishConfig.access: public`）
2. 若使用私有 registry，在仓库根或用户级 `.npmrc` 配置，不要写进 `publishConfig`
3. `files` 只包含 `dist`，源码不会进入 tarball；`npm run release:dry` 会打印实际文件清单

## 与 monorepo-admin 版本的差异

- 包名 `@office/lib` → `@office/utils`；`exports` 指向 `dist/*.js|d.ts`（原为源码直连）
- **`router` 入口（约定式路由核心）已整体移除**，本包不再包含任何 Vite 专属宏与 react-router 相关代码
- `import.meta.env` 访问改为 `env` 统一兜底，避免非 Vite 宿主加载即报错
- `axios` / `dayjs` 为 `dependencies`；`react` 为可选 peer（仅 `/hooks` 需要）；`@ant-design/icons`、`react-router-dom` 已移除
