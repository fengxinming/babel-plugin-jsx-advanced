/**
 * 程序化跳转信号: useHashRoute (发起跳转) 与 useScrollSpy (算高亮) 之间的最小契约。
 *
 * 只传达「即将由代码平滑滚动到某个锚点」这一时机, 不传目标 id —— 目标就在
 * location.hash 里, 消费方自己取。
 *
 * 为什么需要这个信号: 跳转与手动滚动都会触发 scroll 事件, 且两者的 hash 写入
 * 都走 history API (既不触发 hashchange 也不触发 popstate), 滚动跟随无法自行
 * 区分「这次跳转是代码发起的」。用模块级订阅代替 window 事件, 不污染全局。
 */

type NavListener = () => void;

const listeners = new Set<NavListener>();

/**
 * 广播一次跳转开始 (由 scrollToHash 在滚动前调用)。
 */
export function notifyNavSignal(): void {
  for (const fn of listeners) {
    fn();
  }
}

/**
 * 订阅跳转开始。
 *
 * @param fn 收到信号后的处理
 * @returns 取消订阅
 */
export function onNavSignal(fn: NavListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
