import { Link } from './system'

// 用来保存当前正在执行的effect函数
export let activeSub

export class ReactiveEffect {
  /**
   * 依赖链表的头节点
   */
  deps: Link | undefined

  /**
   * 依赖链表的尾节点
   */
  depsTail: Link | undefined

  fn: Function
  constructor(fn) {
    this.fn = fn
  }
  run() {
    // 先将当前的effect保存起来，用来处理嵌套的逻辑
    const prevSub = activeSub
    // 每次执行之前把this放到activeSub上，这样在依赖收集的时候就能知道当前正在执行的effect函数了
    activeSub = this // 这里保存的是对象了

    /**
     *  这里设置为undefined是做一个标记。如果头节点为undefined，
     * 尾节点也是undefined表示，可以复用link，
     * 但凡头节点不是undefined表示可以复用link了
     */
    this.depsTail = undefined
    try {
      return this.fn()
    } finally {
      endTrack(this)

      // 执行完成之后把activeSub置空，这样在依赖收集的时候就知道没有正在执行的effect函数了
      activeSub = prevSub // 这里恢复之前的effect函数，这样在处理嵌套的逻辑的时候就能正确地收集依赖了
    }
  }

  /**
   * 通知更新，如果依赖的数据发生了变化，会调用这个函数
   */
  notify() {
    this.scheduler()
  }

  /**
   * 默认调用run，如果用户传入了scheduler，就调用用户传入的scheduler，默认调用run方法
   */
  scheduler() {
    this.run()
  }
}

// 依赖收集和触发更新的函数
export function effect(fn, options) {
  const e = new ReactiveEffect(fn)
  // scheduler
  Object.assign(e, options)

  e.run()

  const runner = () => e.run()
  runner.effect = e
  return runner
}

function endTrack(sub) {
  const depsTail = sub.depsTail

  if (depsTail) {
    /**
     * depsTail有，并且depsTail还有nextDep，清理掉依赖关系
     */
    if (depsTail.nextDep) {
      clearTracking(depsTail.nextDep)
      depsTail.nextDep = undefined
    }
  } else if (sub.deps) {
    /**
     * 进入这里的场景是：
     * let e = effect(() => {
     *  if (count > 0) return
     *  count++
     *  if (flag.value) {
     *    app.innerHTML = name.value
     *  } else {
     *    app.innerHTML = age.value
     *  }
     * })
     * 在第一次的时候effect里面会收集到依赖，但是count发生变化的时候，这里的依赖都应该删掉
     */
    clearTracking(sub.deps)
    sub.deps = undefined
  }
}

/**
 * 清理依赖
 * @param link
 */
function clearTracking(link: Link) {
  while (link) {
    const { dep, nextSub, nextDep, prevSub } = link
    /**
     * 如果上一个节点有，那就把上一个prevSub的下一个节点指向当前节点的下一个
     * 如果没有，那就是头节点，把subs指向下一个就行
     */
    if (prevSub) {
      prevSub.nextSub = nextSub
      link.nextSub = undefined
    } else {
      dep.subs = nextSub
    }

    /**
     * 如果下一个有，那就把next的上一个节点，指向当前节点的上一个节点
     * 如果下一个节点没有，他就是尾节点，那把dep的depsTail指向上一个
     */
    if (nextSub) {
      nextSub.prevSub = prevSub
      link.prevSub = undefined
    } else {
      dep.subsTail = undefined
    }
    link.dep = link.sub = undefined
    link.nextDep = undefined
    link = nextDep
  }
}
