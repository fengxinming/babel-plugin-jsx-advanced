const hasOwn = Object.prototype.hasOwnProperty;

/** class 值: 已有 className 与指令值合并时可能出现的任意输入形态 */
type ClassValue
  = | string
    | number
    | boolean
    | null
    | undefined
    | ClassValue[]
    | Record<string, unknown>;

/**
 * 递归收集可用的 class 名, 返回串接后的结果。
 *
 * 与 classnames 的常用子集保持一致: 字符串原样、非 0 数字转字符串、数组递归、
 * 对象取值为真的 key; 其余 falsy 一律跳过。不做去重, 也不调用函数 —— 产物与
 * 用户书写的绑定表达式一一对应。
 *
 * 这里用字符串串接而不是「数组 + join」: 常见场景只有几个 class, 省掉数组分配
 * 和一次 join 遍历; V8 对 + 产生的 ConsString 是惰性合并, 短串场景开销更低。
 * 分隔符拼接内联在各分支里, 省掉每次追加的一层函数调用。
 *
 * @param value 单个 class 值
 * @param out 已收集的 class 串
 * @returns 追加后的 class 串
 */
function collect(value: ClassValue, out: string): string {
  if (!value) {
    return out;
  }

  const type = typeof value;
  if (type === 'string' || type === 'number') {
    out && (out += ' ');
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    out += value;
  }
  else if (type === 'object') {
    if (Array.isArray(value)) {
      for (let i = 0, len = value.length; i < len; i++) {
        out = collect(value[i], out);
      }
    }
    else {
      for (const key in value as Record<string, unknown>) {
        if (hasOwn.call(value, key) && value[key]) {
          out && (out += ' ');
          out += key;
        }
      }
    }
  }
  return out;
}

/**
 * 合并 class 值。
 *
 * x-class 会编译成 `classHelper(已有 className 值, 指令值)` —— 已有值在前、
 * 指令值在后, 与元素上的书写顺序一致。为兼容 React 的 className, 结果统一为
 * 空格分隔的字符串; 全部为空时返回空字符串。
 *
 * @param args 任意个 class 值
 * @returns 空格分隔的 className
 */
export default function classHelper(...args: ClassValue[]): string;

export default function classHelper(): string {
  let out = '';
  for (let i = 0, len = arguments.length; i < len; i++) {
    out = collect(arguments[i], out);
  }
  return out;
}
