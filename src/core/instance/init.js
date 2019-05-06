/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // a uid
    vm._uid = uid++

    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to avoid this being observed
    vm._isVue = true
    // merge options
    // options 上的 _isComponent 用来判断是否是组件，如果是组件就调用 
    // initInternalComponent(vm, options) 方法
    // 
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } else {
      // 初始的时候是走的这一个分支
      // 将 Vue 构造函数上的 options 和 自定义的 options 进行合并
      vm.$options = mergeOptions(
        // 有父类 super 的话讲父类的 options 也合并进来
        resolveConstructorOptions(vm.constructor), 
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    initLifecycle(vm)
    initEvents(vm)
    initRender(vm) // vm 实例上添加 $createElement 
    callHook(vm, 'beforeCreate')
    initInjections(vm) // resolve injections before data/props
    initState(vm) // initProps, initMethods, initData 然后进行响应式绑定
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    if (vm.$options.el) {
      // 查看 dom 是如何由 render 中的配置形式转成 dom 并最终挂在到 el 上的，需要看这里的 $mount 方法
      // 它的实质调用的是 lifecycle.js 中的 mountComponent 方法，mountComponent 是重点
      // $mount 的绑定在路径为 web/runtime/index.js 文件中
      // mountComponent 在 lifecycle.js 文件内，其中就有执行了时间钩子 beforeMount 和 mounted
      vm.$mount(vm.$options.el)
    }
  }
}

export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

// 在 _init 方法中 vm.$options = mergeOptions(resolveConstructorOptions(vm.constructor), options || {}, vm)
// Vue 构造函数上有 options 的静态属性，在 global-api 目录中
// 静态的 options 上有如 _base, 'component', 'directive', 'filter', 即 vue 内部会提供一些组件，directive，和过滤器
export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  // 后面只要是涉及到 super , 不理解的地方可以查看 global-api 目录的 extend.js 文件，即该文件涉及到 vue 的拓展及继承
  // 这里也是添加 super 的地方
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        // 这里用到时工具函数 extend，它的实质是运用 for in 循环，将第二个对象参数的属性添加到
        // 第一个对象参数上，即补充第一个参数的属性
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
