/** DOM / 剪贴板 / 视口相关工具 */

/** 复制到剪贴板，成功返回 true */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/** 全屏切换 */
export function toggleFullscreen(element?: HTMLElement) {
  const el = element ?? document.documentElement;
  if (!document.fullscreenElement) {
    void el.requestFullscreen?.();
  } else {
    void document.exitFullscreen?.();
  }
}

/** 滚动到页面顶部 */
export function scrollToTop(smooth = true) {
  window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
}

/** 获取元素相对视口的位置 */
export function getBoundingRect(el: Element) {
  return el.getBoundingClientRect();
}

/** 监听窗口尺寸（返回取消函数） */
export function onResize(handler: (width: number, height: number) => void) {
  const listener = () => handler(window.innerWidth, window.innerHeight);
  window.addEventListener('resize', listener);
  listener();
  return () => window.removeEventListener('resize', listener);
}

/** 设置页面标题 */
export function setDocumentTitle(title: string) {
  document.title = title;
}
