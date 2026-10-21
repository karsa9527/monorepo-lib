/** 树结构工具：菜单 / 部门 / 分类通用 */

export interface TreeNode {
  id?: string | number;
  parentId?: string | number | null;
  children?: TreeNode[];
  [key: string]: unknown;
}

type KeyOf<T> = keyof T;

interface TreeOptions<T> {
  idKey?: KeyOf<T>;
  parentKey?: KeyOf<T>;
  childrenKey?: string;
}

/** 扁平数组 -> 树 */
export function listToTree<T extends Record<string, unknown>>(
  list: T[],
  options: TreeOptions<T> = {},
): T[] {
  const {
    idKey = 'id' as KeyOf<T>,
    parentKey = 'parentId' as KeyOf<T>,
    childrenKey = 'children',
  } = options;

  const map = new Map<unknown, T>();
  const roots: T[] = [];

  list.forEach((item) => {
    map.set(item[idKey], { ...item, [childrenKey]: [] } as unknown as T);
  });

  map.forEach((node) => {
    const parentId = node[parentKey];
    const parent = parentId === undefined || parentId === null ? undefined : map.get(parentId);
    if (parent) {
      const children = (parent[childrenKey as keyof T] as unknown as T[]) ?? [];
      children.push(node);
      (parent as Record<string, unknown>)[childrenKey] = children;
    } else {
      roots.push(node);
    }
  });

  // 清理空的 children 字段
  const clean = (nodes: T[]) => {
    nodes.forEach((node) => {
      const children = node[childrenKey as keyof T] as unknown as T[];
      if (Array.isArray(children)) {
        if (children.length === 0) delete (node as Record<string, unknown>)[childrenKey];
        else clean(children);
      }
    });
  };
  clean(roots);
  return roots;
}

/** 树 -> 扁平数组 */
export function treeToList<T extends Record<string, unknown>>(
  tree: T[],
  childrenKey = 'children',
): T[] {
  const result: T[] = [];
  const walk = (nodes: T[]) => {
    nodes.forEach((node) => {
      const children = node[childrenKey] as unknown as T[] | undefined;
      const rest = { ...node };
      delete (rest as Record<string, unknown>)[childrenKey];
      result.push(rest as T);
      if (Array.isArray(children) && children.length) walk(children);
    });
  };
  walk(tree);
  return result;
}

/** 查找节点 */
export function findTreeNode<T extends Record<string, unknown>>(
  tree: T[],
  predicate: (node: T) => boolean,
  childrenKey = 'children',
): T | undefined {
  for (const node of tree) {
    if (predicate(node)) return node;
    const children = node[childrenKey] as unknown as T[] | undefined;
    if (Array.isArray(children)) {
      const found = findTreeNode(children, predicate, childrenKey);
      if (found) return found;
    }
  }
  return undefined;
}

/** 过滤树：保留命中节点及其祖先链路 */
export function filterTree<T extends Record<string, unknown>>(
  tree: T[],
  predicate: (node: T) => boolean,
  childrenKey = 'children',
): T[] {
  const result: T[] = [];
  tree.forEach((node) => {
    const children = node[childrenKey] as unknown as T[] | undefined;
    const filteredChildren = Array.isArray(children)
      ? filterTree(children, predicate, childrenKey)
      : [];
    if (predicate(node) || filteredChildren.length > 0) {
      result.push({
        ...node,
        ...(filteredChildren.length ? { [childrenKey]: filteredChildren } : {}),
      } as T);
    }
  });
  return result;
}

/** 获取从根到目标节点的路径 */
export function getTreePath<T extends Record<string, unknown>>(
  tree: T[],
  predicate: (node: T) => boolean,
  childrenKey = 'children',
): T[] {
  for (const node of tree) {
    if (predicate(node)) return [node];
    const children = node[childrenKey] as unknown as T[] | undefined;
    if (Array.isArray(children)) {
      const path = getTreePath(children, predicate, childrenKey);
      if (path.length) return [node, ...path];
    }
  }
  return [];
}

/** 映射树节点 */
export function mapTree<T extends Record<string, unknown>, R>(
  tree: T[],
  mapper: (node: T) => R,
  childrenKey = 'children',
): R[] {
  return tree.map((node) => {
    const children = node[childrenKey] as unknown as T[] | undefined;
    const mapped = mapper(node) as Record<string, unknown>;
    if (Array.isArray(children)) {
      mapped[childrenKey] = mapTree(children, mapper, childrenKey);
    }
    return mapped as R;
  });
}
