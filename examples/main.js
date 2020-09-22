import Vue from 'vue'
import App from './App.vue'
import { Button, Input } from 'element-ui';
 


// 导入组件库
import  vtree  from '../src'

// 注册组件库
Vue.use(vtree)
Vue.use(Button)
Vue.use(Input)

Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app') 