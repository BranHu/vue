import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'


/**
 *
 *
 * @param {*} options
 * @description vue 的构造函数
 */
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

initMixin(Vue) // Vue 的原型上添加 _init 方法
stateMixin(Vue) // Vue 原型上添加 $watch, $set, $delete 方法
eventsMixin(Vue) // Vue 原型上添加了 $emit, $on, $off 等方法
lifecycleMixin(Vue) // Vue 原型上添加了 _update, $forceUpdate, $destroy 方法
renderMixin(Vue) // Vue 原型上添加了 $nextTick、_render 方法

export default Vue
