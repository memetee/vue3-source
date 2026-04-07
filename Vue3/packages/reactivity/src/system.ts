import { ReactiveEffect } from './effect'
/**
 * 链表节点
 */
export interface Link {
  // 保存effect
  sub: ReactiveEffect

  // 下一个节点,如果没有就是undefined
  nextSub: Link | undefined

  // 上一个节点,如果没有就是undefined
  prevSub: Link | undefined
}

/**
 * 链接ref和effect，建立ref和effect之间的链表关系
 * @param dep ref对象
 * @param sub effect函数（依赖项）
 */
export function link(dep, sub) {
  // 如果activeSub有，那就保存，等更新的时候触发
  const newLink: Link = {
    sub,
    nextSub: undefined,
    prevSub: undefined,
  }

  /**
       * 把新的订阅者添加到链表的尾部
        1. 如果链表不为空，就把新的订阅者添加到链表的尾部
        2. 如果链表为空，就把新的订阅者作为链表的头节点和尾节点
       */
  if (dep.subsTail) {
    dep.subsTail.nextSub = newLink
    newLink.prevSub = dep.subsTail
    dep.subsTail = newLink
  } else {
    dep.subs = newLink
    dep.subsTail = newLink
  }
}

/**
 * 传播更新
 * @param subs 依赖项
 */
export function propagate(subs) {
  let link = subs
  const queueEffect = []
  while (link) {
    queueEffect.push(link.sub)
    link = link.nextSub
  }
  queueEffect.forEach(effect => effect.notify())
}
