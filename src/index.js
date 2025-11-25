import './reset.css';
import Vtree from '../packages/vtree/index.vue';

const components = [
  Vtree
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
  version: '0.0.5',
  install,
  Vtree
}