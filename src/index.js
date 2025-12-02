import virtualTree from '../packages/vtree/index.vue';
const packageInfo = require('../package.json');
const components = [
  virtualTree
]

const install = function(Vue, opts = {}) {
  components.forEach(component => {
    Vue.component(component.name, component);
  })
}

/* istanbul ignore if */
if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue);
}

export default {
  version: packageInfo.version,
  install,
  virtualTree
}
// 单独导出组件
export {
  virtualTree
}