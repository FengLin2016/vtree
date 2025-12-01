import Vue from 'vue'
import App from './App.vue'
import element from 'element-ui';
import 'element-ui/lib/theme-chalk/icon.css';


// 导入组件库
import  vtree  from '../src'

// 注册组件库
Vue.use(vtree)
Vue.use(element)

Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')