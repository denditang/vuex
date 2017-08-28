import { createAction, mergeObjects } from './util'
let Vue //�洢Vue������һ��Ϊ��ע��$store������Vue��������Ǻ���Ҫ�õ�Vue��˫��󶨵Ĺ���
export class Store{
    constructor ({
        state = {},
        actions = {},
        mutations = {}
        }){
        //���������������������dispatch������
        const dispatch = this.dispatch
        this.dispatch = (...args) =>{
            dispatch.apply(this,args)
        }
        //����vue˫���
        this._vm = new Vue({
            data : state
        })
        this.actions = Object.create(null)
        //������action�������ַ�����function����ģʽ
        this._setupActions(actions);
        //����mutations
        this._setupMutations(mutations);
    }
    get state (){
        //ҳ����ͨ���˷�����ȡstate

        return this._vm._data;
    }
    set state (v){
        throw new Error('[Vuex] vuex root state is read only.')
    }
    _setupActions (actions){
        this._actions = Object.create(null);
        actions = Array.isArray(actions) ? mergeObjects(actions) : actions;
        Object.keys(actions).forEach(name =>{
            this._actions[name] = createAction(actions[name],this); //����string ��function��д��
            if(!this.actions[name]){
                this.actions[name] = (...args) =>this._actions[name](...args)
            }
        })
    }
    _setupMutations(mutations){
        this._mutations = Array.isArray(mutations) ? mergeObjects(mutations,true) : mutations
    }
    /**
     * ִ��mutation
     */
    dispatch (type,...payload) {
        const mutation = this._mutations[type];
        const state = this.state;
        if(mutation){
            this._dispatching = true
            if(Array.isArray(mutation)){
                //����ִ��
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