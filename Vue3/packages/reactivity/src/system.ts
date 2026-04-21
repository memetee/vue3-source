import { ReactiveEffect } from './effect'
/**
 * 发布者
 */
interface Dep {
  // 依赖项链表的头节点
  subs: Link | undefined

  // 依赖项链表的尾节点
  subsTail: Link | undefined
}

/**
 * 订阅者
 */
interface Sub {
  // 发布者链表的头节点
  deps: Link | undefined

  // 发布者链表的尾节点
  depsTail: Link | undefined
}

/**
 * 链表节点
 */
export interface Link {
  // 订阅者对象
  sub: Sub

  // 下一个节点,如果没有就是undefined
  nextSub: Link | undefined

  // 上一个节点,如果没有就是undefined
  prevSub: Link | undefined

  // 发布者对象
  dep: Dep

  // 下一个发布者节点
  nextDep: Link | undefined
}

/**
 * 链接ref和effect，建立ref和effect之间的链表关系
 * @param dep ref对象
 * @param sub effect函数（依赖项）
 */
export function link(dep, sub) {
  // region 尝试复用链表节点
  const currentDep = sub.depsTail

  // 分两种情况，如果头节点有，尾节点没有，那么尝试复用头节点
  // 如果尾节点还有nextDep,尝试复用尾节点的nextDep
  const nextDep = currentDep === undefined ? sub.deps : currentDep.nextDep
  // 如果当前的订阅者的头节点有值，尾节点为undefined，说明可以复用link
  if (nextDep && nextDep.dep === dep) {
    sub.depsTail = nextDep
    return
  }
  // 如果activeSub有，那就保存，等更新的时候触发
  const newLink: Link = {
    dep,
    sub,
    nextSub: undefined,
    prevSub: undefined,
    nextDep: undefined,
  }

  // 将链表节点和deep建立关联关系
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

  // 将链表节点和sub建立关联关系(这里是单向链表)
  /**
   * 把新的依赖项添加到链表的尾部
   1. 如果链表不为空，就把新的依赖项添加到链表的尾部
   2. 如果链表为空，就把新的依赖项作为链表的头节点和尾节点
   */
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink
    sub.depsTail = newLink
  } else {
    sub.deps = newLink
    sub.depsTail = newLink
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
