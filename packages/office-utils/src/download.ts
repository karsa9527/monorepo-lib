/** 文件下载 / 导出工具 */

/** 通过 Blob 触发下载 */
export function downloadBlob(data: BlobPart, filename: string, mime = 'application/octet-stream') {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** 通过 URL 下载（同源可直接 download，跨域需后端设置 Content-Disposition） */
export function downloadByUrl(url: string, filename?: string) {
  const link = document.createElement('a');
  link.href = url;
  if (filename) link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** JSON 导出为文件 */
export function exportJson(data: unknown, filename = 'data.json') {
  downloadBlob(JSON.stringify(data, null, 2), filename, 'application/json');
}

/** 数组导出为 CSV（含 BOM 头，Excel 打开不乱码） */
export function exportCsv<T extends Record<string, unknown>>(
  rows: T[],
  filename = 'data.csv',
  columns?: Array<{ key: keyof T & string; title: string }>,
) {
  if (!rows.length) return;
  const cols =
    columns ??
    (Object.keys(rows[0]) as Array<keyof T & string>).map((key) => ({ key, title: key }));
  const header = cols.map((c) => `"${c.title}"`).join(',');
  const body = rows
    .map((row) =>
      cols
        .map((c) => {
          const v = row[c.key];
          const text = v === null || v === undefined ? '' : String(v);
          return `"${text.replace(/"/g, '""')}"`;
        })
        .join(','),
    )
    .join('\n');
  const csv = `${header}\n${body}`;
  // \uFEFF 解决 Excel 中文乱码
  downloadBlob(`\uFEFF${csv}`, filename, 'text/csv;charset=utf-8;');
}
