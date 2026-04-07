import { activeSub } from './effect'
import { Link, link, propagate } from './system'
enum ReactivityFlags {
  IS_REF = '__v_isRef',
}

/**
 * ref的类
 */
class RefImpl {
  // 保存实际的值
  _value;

  // ref标记，证明是一个ref对象
  [ReactivityFlags.IS_REF] = true

  /**
   * 订阅者链表的头节点
   */
  subs: Link

  /**
   * 订阅者链表的尾节点
   */
  subsTail: Link

  constructor(value) {
    this._value = value
  }

  get value() {
    if (activeSub) {
      trackRef(this)
    }

    // 依赖收集
    return this._value
  }

  set value(newValue) {
    // 触发更新
    this._value = newValue
    triggerRef(this)
  }
}

export function ref(value) {
  return new RefImpl(value)
}

/**
 * 判断是不是一个ref对象
 * @param value 对象
 * @returns
 */
export function isRef(value) {
  return !!(value && value[ReactivityFlags.IS_REF])
}

/**
 * 收集依赖，建立ref和effect之间的链表关系
 * @param dep ref对象
 */
export function trackRef(dep) {
  if (activeSub) {
    link(dep, activeSub)
  }
}

/**
 * 触发更新，遍历链表，执行所有的effect函数
 * @param dep ref对象
 */
export function triggerRef(dep) {
  if (dep.subs) {
    propagate(dep.subs)
  }
}
