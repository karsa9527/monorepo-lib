# monorepo-lib

Office 前端基础库单仓工程（npm workspaces）
这里只放**可独立发布到 npm** 的基础包，应用侧按版本号安装，而不是以源码直连。

## 结构

```
monorepo-lib/
├── packages/
│   └── office-utils/          @office/utils —— 工具函数 / 请求层 / useRequest
├── eslint.config.base.json    共享 ESLint 规则
├── tsconfig.base.json         共享 TS 编译选项
├── prettier.config.js         共享格式化规则
├── lint-staged.config.js
└── .husky/pre-commit
```

每个子包的约定：

- `src/` 源码，`tsc -p tsconfig.build.json` 输出 `dist/`（ESM + `.d.ts` + sourcemap）
- `package.json` 的 `exports` 全部指向 `dist`，`files` 只含 `dist`
- 版本号在各自 `package.json` 独立维护，互不牵连
- `prepublishOnly` 自动 `build + typecheck`，避免发出空包或类型坏的包

## 常用脚本

| 命令                              | 说明                                               |
| --------------------------------- | -------------------------------------------------- |
| `npm run build`                   | 构建所有包                                         |
| `npm run build:utils`             | 只构建 `@office/utils`                             |
| `npm run dev:utils`               | `tsc --watch` 增量构建                             |
| `npm run typecheck`               | 全 workspace 类型检查                              |
| `npm run lint` / `npm run format` | 代码检查 / 格式化                                  |
| `npm run pack:utils`              | 生成 tarball，用于检查发布内容                     |
| `npm run release:dry`             | `npm publish --dry-run`：构建 + 打印将要发布的文件 |
| `npm run release:utils`           | 发布 `@office/utils`                               |

## 发布流程（单包）

```bash
npm run typecheck                          # 1. 类型先过
npm run release:dry                        # 2. 预演，检查 tarball 文件清单与体积
npm version patch -w @office/utils         # 3. 升版本（自动打 tag）
npm run release:utils                      # 4. 发布到 npm
```

`npm publish -w <pkg>` 会触发该包的 `prepublishOnly`，因此不会漏构建。

注意事项：

- `publishConfig.access` 为 `public`（scope 包默认私有，必须显式声明）
- registry 不要写死在 `package.json`，统一由 `.npmrc` / CI 环境变量控制
- 发布前确认 `dist` 已加入 `.gitignore`，tarball 内容以 `npm pack --dry-run` 为准
- 若包内使用了 Vite 专属 API（如 `import.meta.glob`），必须在 README 写明消费约束

## 新增一个子包

1. `packages/<name>/` 下建 `src/`、`package.json`、`tsconfig.json`、`tsconfig.build.json`、`.eslintrc.json`
2. 复制 `prettier.config.js`、`.prettierignore`、`lint-staged.config.js`（与根保持同一份副本）
3. `package.json` 中 `name` 用 `@office/<name>`、`version` 从 `0.1.0` 起、`files: ["dist"]`
4. 根 `package.json` 追加 `<name>` 相关脚本（`build:<name>` / `release:<name>`）
5. `npm install` 建立 workspace 链接，再 `npm run build -w @office/<name>` 验证
