/**
 * Prettier 配置（ESM，遵循各 package.json 的 "type": "module"）
 * 根目录的这份是唯一事实来源；各子工程的 prettier.config.js 是同一份副本，
 * 目的是让每个包单独执行 `prettier --write .` 时也能拿到一致规则。
 *
 * 与 .eslintrc.json 配合：extends 中已放 "prettier" 关闭冲突的格式类规则
 * @type {import('prettier').Config}
 */
export default {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  jsxSingleQuote: false,
  quoteProps: 'as-needed',
  trailingComma: 'all',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
  endOfLine: 'lf',
  vueIndentScriptAndStyle: false,
  htmlWhitespaceSensitivity: 'css',
  embeddedLanguageFormatting: 'auto',
  overrides: [
    {
      // 样式文件统一用双引号，避免 Sass 中字符串与选择器属性引号混用
      files: ['*.css', '*.scss', '*.less'],
      options: {
        singleQuote: false,
      },
    },
    {
      files: ['*.md', '*.mdx'],
      options: {
        proseWrap: 'preserve',
      },
    },
    {
      files: ['*.json', '*.jsonc'],
      options: {
        trailingComma: 'none',
      },
    },
  ],
};
