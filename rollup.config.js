import nodeResolve from 'rollup-plugin-node-resolve' 
import postcss from 'rollup-plugin-postcss'
import autoprefixer from 'autoprefixer'
import vue from "rollup-plugin-vue"
import babel from 'rollup-plugin-babel'
import commonjs from "@rollup/plugin-commonjs"
import scss from 'rollup-plugin-scss'
// import compiler from 'vue-template-compiler'

// import image from "@rollup/plugin-image"

export default {
  input: './src/index.js',
  output: [{
    file: './dist/index.esm.js',
    format: 'es',
    // globals: {
    //   vue: "Vue" // 告诉rollup全局变量Vue即是vue
    // }
  },{
  	name: 'v-tree-scroll',
    file: './dist/index.js',
    format: 'umd',
    // globals: {
    //   Vue: "Vue" // 告诉rollup全局变量Vue即是vue
    // }
  }],
  plugins: [
    nodeResolve(),
    commonjs(),
    vue({
      css: true,
      compileTemplate: true,
      // compiler
    }),
    scss(),
    postcss({
       plugins: [autoprefixer],
       extensions: [ '.css' ],
    }),
    babel({
      exclude: "**/node_modules/**"
    }),
    
    // image()
  ] 
};