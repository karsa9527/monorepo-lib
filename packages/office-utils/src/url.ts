/** URL / 查询参数工具 */

/** 对象 -> query string（自动丢弃空值） */
export function stringifyQuery(params: Record<string, unknown> = {}): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(key, String(v)));
    } else {
      search.append(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/** query string -> 对象 */
export function parseQuery<T extends Record<string, string> = Record<string, string>>(
  search = typeof window !== 'undefined' ? window.location.search : '',
): T {
  const result: Record<string, string> = {};
  new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).forEach((v, k) => {
    result[k] = v;
  });
  return result as T;
}

/** 拼接 URL（自动处理斜杠） */
export function joinUrl(base: string, ...paths: string[]): string {
  return [base, ...paths]
    .map((p) => String(p).replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
}

/** 给 URL 追加/覆盖查询参数 */
export function appendQuery(url: string, params: Record<string, unknown> = {}): string {
  const [path, search = ''] = url.split('?');
  const merged = { ...parseQuery(search ? `?${search}` : ''), ...params };
  return `${path}${stringifyQuery(merged)}`;
}

/** 解析 hash 路由中的路径与参数（#/user?id=1） */
export function parseHash(hash = window.location.hash): {
  path: string;
  query: Record<string, string>;
} {
  const raw = hash.replace(/^#/, '') || '/';
  const [path, search = ''] = raw.split('?');
  return { path: path || '/', query: parseQuery(search ? `?${search}` : '') };
}
