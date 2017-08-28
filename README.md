## Vuex从0开始学习源码 ##

## 前言 ##
尝试从0开始，写一个Vuex(主要是copy vuex的源代码)，从中学习下vuex的源代码.先来看下列子中是怎么使用store的。

```
import Vue from 'vue'
import Vuex from '../../src'

Vue.use(Vuex)

// mutation types
// optional if you don't like constants.
const INCREMENT = 'INCREMENT'
const DECREMENT = 'DECREMENT'

// root state object.
// each Vuex instance is just a single state tree.
const state = {
  count: 0
}

// actions are what components will be able to
// call as store.actions.xxx
// note these are not the final functions the
// components will be calling.
const actions = {

  // for simple actions that just dispatches a single mutation,
  // we can just provide the mutation type.
  increment: INCREMENT,
  decrement: DECREMENT,

  // for a normal action function, it always recieves the store
  // instance as the first argument, from which we can get the
  // dispatch function and the state object. Any additional
  // arguments will follow the store argument.
  incrementIfOdd: ({ dispatch, state }) => {
    if ((state.count + 1) % 2 === 0) {
      dispatch(INCREMENT)
    }
  },

  // Same thing for async actions.
  incrementAsync: ({ dispatch }) => {
    setTimeout(() => {
      dispatch(INCREMENT)
    }, 1000)
  }
}

// mutations are operations that actually mutates the state.
// each mutation handler gets the entire state tree as the
// first argument, followed by additional payload arguments.
// mutations must be synchronous and can be recorded by middlewares
// for debugging purposes.
const mutations = {
  [INCREMENT] (state) {
    state.count++
  },
  [DECREMENT] (state) {
    state.count--
  }
}

// A Vuex instance is created by combining the state, the actions,
// and the mutations. Because the actions and mutations are just
// functions that do not depend on the instance itself, they can
// be easily tested or even hot-reloaded (see counter-hot example).
// 
// You can also provide middlewares, which is just an array of
// objects containing some hooks to be called at initialization
// and after each mutation.
export default new Vuex.Store({
  state,
  actions,
  mutations
})

```

## 开始 第一步 ##
Vuex作为一个插件 先得实现install方法。同时我们在install方法里面在Vue组件注入$store,也就是为什么vue中各个子组件为什么能够通过this.$store访问到store这个对象

```

let Vue //存储Vue变量。一是为了注入$store到各个Vue组件，二是后续要用到Vue的双向绑定的功能
export class Store{

}
export function install (_Vue){
    Vue = _Vue
    const _init = Vue.prototype._init;
    Vue.prototype._init = function(options){
        options = options || {}
        if(options.store){
            this.$store = options.store
        }else if(options.parent && options.parent.$store){
            this.$store = options.parent.$store
        }
        _init.call(this,options)
    }
}
export default {
    Store,install
}
```
上述代码中。
先定义一个Vue变量。有两个作用
第一个作用就是给Vue各个组件注入$store变量，另外一个功能后面会说到
## 第二步 暴露state ##
我们使用vuex的时候,会传入state给页面访问，同时支持当页面中用到state里面的变量的时候。及时更新状态。这里就会Vue的另外一个功能，双向绑定。

```
let Vue //存储Vue变量。一是为了注入$store到各个Vue组件，二是后续要用到Vue的双向绑定的功能
export class Store{
    constructor ({
        state = {},
        actions = {},
        mutations = {}
        }){
        //依赖vue双向绑定
        this._vm = new Vue({
            data : state
        })

    }
    get state (){
        //页面中通过此方法获取state
        return this._vm._data;
    }
    set state (v){
        throw new Error('[Vuex] vuex root state is read only.')
    }
}
export function install (_Vue){
    Vue = _Vue
    const _init = Vue.prototype._init;
    Vue.prototype._init = function(options){
        options = options || {}
        if(options.store){
            this.$store = options.store
        }else if(options.parent && options.parent.$store){
            this.$store = options.parent.$store
        }
        _init.call(this,options)
    }
}
export default {
    Store,install
}
```

![clipboard.png](/img/bVTQtX)
可以看到页面中count的数值已经可以显示了
## 第三步实现actions ##
Vuex中的action是用来干嘛？是用来dispatch事件，从而来执行mutations的，中间可以穿插一些逻辑，所以我们封装下actions

```
import { createAction, mergeObjects } from './util'
let Vue //存储Vue变量。一是为了注入$store到各个Vue组件，二是后续要用到Vue的双向绑定的功能
export class Store{
    constructor ({
        state = {},
        actions = {},
        mutations = {}
        }){
        //依赖vue双向绑定
        this._vm = new Vue({
            data : state
        })
        this.actions = Object.create(null)
        //构造下action。兼容字符串和function两种模式
        this._setupActions(actions);
    }
    get state (){
        //页面中通过此方法获取state
        return this._vm._data;
    }
    set state (v){
        throw new Error('[Vuex] vuex root state is read only.')
    }
    _setupActions (actions){
        this._actions = Object.create(null);
        actions = Array.isArray(actions) ? mergeObjects(actions) : actions;
        Object.keys(actions).forEach(name =>{
            this._actions[name] = createAction(actions[name],this); //兼容string 和function的写法
            if(!this.actions[name]){
                this.actions[name] = (...args) =>this._actions[name](...args)
            }
        })
    }
}
export function install (_Vue){
    Vue = _Vue
    const _init = Vue.prototype._init;
    Vue.prototype._init = function(options){
        options = options || {}
        if(options.store){
            this.$store = options.store
        }else if(options.parent && options.parent.$store){
            this.$store = options.parent.$store
        }
        _init.call(this,options)
    }
}
export default {
    Store,install
}
```
utils.js中的代码

```
export function createAction (action, store) {
  if (typeof action === 'string') {
    // simple action string shorthand
    return (...payload) => store.dispatch(action, ...payload)
  } else if (typeof action === 'function') {
    // normal action
    return (...payload) => action(store, ...payload)
  }
}
```
## 第四步 构造下mutations ##
这步比较简单，直接看代码

```
import { createAction, mergeObjects } from './util'
let Vue //存储Vue变量。一是为了注入$store到各个Vue组件，二是后续要用到Vue的双向绑定的功能
export class Store{
    constructor ({
        state = {},
        actions = {},
        mutations = {}
        }){
        //依赖vue双向绑定
        this._vm = new Vue({
            data : state
        })
        this.actions = Object.create(null)
        //构造下action。兼容字符串和function两种模式
        this._setupActions(actions);
        //构造mutations
        this._setupMutations(mutations);
    }
    get state (){
        //页面中通过此方法获取state
        return this._vm._data;
    }
    set state (v){
        throw new Error('[Vuex] vuex root state is read only.')
    }
    _setupActions (actions){
        this._actions = Object.create(null);
        actions = Array.isArray(actions) ? mergeObjects(actions) : actions;
        Object.keys(actions).forEach(name =>{
            this._actions[name] = createAction(actions[name],this); //兼容string 和function的写法
            if(!this.actions[name]){
                this.actions[name] = (...args) =>this._actions[name](...args)
            }
        })
    }
    _setupMutations(mutations){
        this._mutations = Array.isArray(mutations) ? mergeObjects(mutations,true) : mutations
    }
}
export function install (_Vue){
    Vue = _Vue
    const _init = Vue.prototype._init;
    Vue.prototype._init = function(options){
        options = options || {}
        if(options.store){
            this.$store = options.store
        }else if(options.parent && options.parent.$store){
            this.$store = options.parent.$store
        }
        _init.call(this,options)
    }
}
export default {
    Store,install
}
```
## 第五步，实现dispatch方法 ##
我们知道我们在action里面dispatch事件了。这个就类似现在的commit。dispatch事件，是要执行mutations的

```
import { createAction, mergeObjects } from './util'
let Vue //存储Vue变量。一是为了注入$store到各个Vue组件，二是后续要用到Vue的双向绑定的功能
export class Store{
    constructor ({
        state = {},
        actions = {},
        mutations = {}
        }){
        //依赖vue双向绑定
        this._vm = new Vue({
            data : state
        })
        this.actions = Object.create(null)
        //构造下action。兼容字符串和function两种模式
        this._setupActions(actions);
        //构造mutations
        this._setupMutations(mutations);
    }
    get state (){
        //页面中通过此方法获取state
        return this._vm._data;
    }
    set state (v){
        throw new Error('[Vuex] vuex root state is read only.')
    }
    _setupActions (actions){
        this._actions = Object.create(null);
        actions = Array.isArray(actions) ? mergeObjects(actions) : actions;
        Object.keys(actions).forEach(name =>{
            this._actions[name] = createAction(actions[name],this); //兼容string 和function的写法
            if(!this.actions[name]){
                this.actions[name] = (...args) =>this._actions[name](...args)
            }
        })
    }
    _setupMutations(mutations){
        this._mutations = Array.isArray(mutations) ? mergeObjects(mutations,true) : mutations
    }
    /**
     * 执行mutation
     */
    dispatch (type,...payload) {
        const mutation = this._mutations[type];
        const state = this.state;
        if(mutation){
            this._dispatching = true
            if(Array.isArray(mutation)){
                //遍历执行
                mutation.forEach(m =>m(state,...payload))
            }else{
                mutation(state,...payload)
            }
            this._dispatching = false
        }else{
            console.warn("[vuex] unknown mutation:${type}")
        }
    }
}
export function install (_Vue){
    Vue = _Vue
    const _init = Vue.prototype._init;
    Vue.prototype._init = function(options){
        options = options || {}
        if(options.store){
            this.$store = options.store
        }else if(options.parent && options.parent.$store){
            this.$store = options.parent.$store
        }
        _init.call(this,options)
    }
}
export default {
    Store,install
}
```
到此为止 测试页面的+ -count功能应该是没有问题了

![clipboard.png](/img/bVTQBf)

当点击后面两个方法，发现会有报错

![clipboard.png](/img/bVTQBG)

这个什么原因呢？ 调试也可以发现，作用域的问题，调用不了vuex里面的对象

```
    const dispatch = this.dispatch
        this.dispatch = (...args) =>{
            dispatch.apply(this,args)
        }
```
完整代码

```
import { createAction, mergeObjects } from './util'
let Vue //存储Vue变量。一是为了注入$store到各个Vue组件，二是后续要用到Vue的双向绑定的功能
export class Store{
    constructor ({
        state = {},
        actions = {},
        mutations = {}
        }){
        //加上这个，解决在外面调用dispatch的问题
        const dispatch = this.dispatch
        this.dispatch = (...args) =>{
            dispatch.apply(this,args)
        }
        //依赖vue双向绑定
        this._vm = new Vue({
            data : state
        })
        this.actions = Object.create(null)
        //构造下action。兼容字符串和function两种模式
        this._setupActions(actions);
        //构造mutations
        this._setupMutations(mutations);
    }
    get state (){
        //页面中通过此方法获取state
        return this._vm._data;
    }
    set state (v){
        throw new Error('[Vuex] vuex root state is read only.')
    }
    _setupActions (actions){
        this._actions = Object.create(null);
        actions = Array.isArray(actions) ? mergeObjects(actions) : actions;
        Object.keys(actions).forEach(name =>{
            this._actions[name] = createAction(actions[name],this); //兼容string 和function的写法
            if(!this.actions[name]){
                this.actions[name] = (...args) =>this._actions[name](...args)
            }
        })
    }
    _setupMutations(mutations){
        this._mutations = Array.isArray(mutations) ? mergeObjects(mutations,true) : mutations
    }
    /**
     * 执行mutation
     */
    dispatch (type,...payload) {
        const mutation = this._mutations[type];
        const state = this.state;
        if(mutation){
            this._dispatching = true
            if(Array.isArray(mutation)){
                //遍历执行
                mutation.forEach(m =>m(state,...payload))
            }else{
                mutation(state,...payload)
            }
            this._dispatching = false
        }else{
            console.warn("[vuex] unknown mutation:${type}")
        }
    }
}
export function install (_Vue){
    Vue = _Vue
    const _init = Vue.prototype._init;
    Vue.prototype._init = function(options){
        options = options || {}
        if(options.store){
            this.$store = options.store
        }else if(options.parent && options.parent.$store){
            this.$store = options.parent.$store
        }
        _init.call(this,options)
    }
}
export default {
    Store,install
}
```
只此。VUEX的基本功能已完成了

以上代码都来至vuex 0.3
我不生成代码，只做代码的搬运工

