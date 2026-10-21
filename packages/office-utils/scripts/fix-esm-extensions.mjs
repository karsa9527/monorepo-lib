/**
 * 构建后处理：给 dist 里的相对导入补全 .js 后缀
 *
 * 背景：tsc 输出会原样保留源码中的 `from './is'`，这类「无扩展名」相对导入
 * 只有打包器（Vite / webpack / Rollup）能解析，Node 原生 ESM 会抛
 * ERR_MODULE_NOT_FOUND。补成 `./is.js` 后两种消费方式都能工作，
 * 且 TS 在 nodenext / bundler 下都支持 `.js` 映射到同名 `.d.ts`。
 *
 * 只处理相对导入（以 . 开头），裸包名与 import.meta.glob 的字符串参数不受影响。
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const distDir = join(root, '..', 'dist');

/** 匹配 `from './x'`、`import './x'`、`import('./x')` */
const IMPORT_RE = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])(\.[^'"]*)\2/g;

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/** 把无扩展名的相对路径解析成带 .js 的写法 */
function withExtension(file, spec) {
  if (extname(spec)) return spec;
  const base = join(dirname(file), spec);
  if (existsSync(`${base}.js`)) return `${spec}.js`;
  if (existsSync(join(base, 'index.js'))) return `${spec}/index.js`;
  // 解析不到就不动，交给消费方（例如 assets、JSON 等非 TS 产物）
  return spec;
}

let changedFiles = 0;

for (const file of walk(distDir)) {
  if (!/\.(js|d\.ts)$/.test(file)) continue;

  const source = readFileSync(file, 'utf8');
  const next = source.replace(IMPORT_RE, (match, prefix, quote, spec) => {
    const patched = withExtension(file, spec);
    return patched === spec ? match : `${prefix}${quote}${patched}${quote}`;
  });

  if (next !== source) {
    writeFileSync(file, next);
    changedFiles += 1;
  }
}

// eslint-disable-next-line no-console -- 构建脚本需要在命令行输出处理结果
console.log(`[build] 已补全相对导入扩展名：${changedFiles} 个文件`);
