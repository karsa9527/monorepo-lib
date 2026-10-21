/**
 * @office/utils 统一出口：基础工具库
 *
 * 分层说明：
 *  - is        : 类型判断
 *  - storage   : 本地存储（含过期时间与 token 专用分区）
 *  - format    : 金额 / 数字 / 脱敏 / 随机串
 *  - date      : 基于 dayjs 的日期处理
 *  - object    : 对象与数组处理
 *  - tree      : 树结构（菜单 / 部门）
 *  - function  : 防抖节流 / 重试 / 并行
 *  - validate  : 常用正则校验
 *  - url       : 查询参数与 URL 拼接
 *  - download  : 文件导出
 *  - dom       : 剪贴板 / 全屏 / 标题
 *  - env       : 环境变量
 *
 * 其余入口（避免把 axios / React 拖进只做纯计算的场景）：
 *  - @office/utils/request : axios 请求层
 *  - @office/utils/hooks   : useRequest
 */
export * from './is';
export * from './storage';
export * from './format';
export * from './date';
export * from './object';
export * from './tree';
export * from './function';
export * from './validate';
export * from './url';
export * from './download';
export * from './dom';
export * from './env';
