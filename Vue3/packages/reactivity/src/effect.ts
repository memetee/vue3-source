// 用来保存当前正在执行的effect函数
export let activeSub

export class ReactiveEffect {
  fn: Function
  constructor(fn) {
    this.fn = fn
  }
  run() {
    // 先将当前的effect保存起来，用来处理嵌套的逻辑
    const prevSub = activeSub
    // 每次执行之前把this放到activeSub上，这样在依赖收集的时候就能知道当前正在执行的effect函数了
    activeSub = this // 这里保存的是对象了
    try {
      return this.fn()
    } finally {
      // 执行完成之后把activeSub置空，这样在依赖收集的时候就知道没有正在执行的effect函数了
      activeSub = undefined
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
