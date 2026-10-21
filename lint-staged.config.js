/**
 * lint-staged 配置（ESM）
 * 由 .husky/pre-commit 调用：只对暂存区文件做 lint + 格式化，避免全量扫描。
 *
 * 说明：
 * - eslint 先跑（--fix 自动修复可修项），再由 prettier 统一格式；
 *   eslint.config.base.json 已 extends "prettier"，两者不会互相打架
 * - 类型检查不在 pre-commit 跑（较慢），交给 `npm run typecheck` / CI
 * - 子工程里的同名文件是同一份副本，方便单独提交子工程时也能生效
 */
export default {
  // 脚本与组件：lint 自动修复 + 格式化
  '*.{js,cjs,mjs,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  // 其余文本类资源只做格式化
  '*.{json,jsonc,md,mdx,css,scss,less,html,yml,yaml}': ['prettier --write'],
};
