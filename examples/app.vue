<template>
  <div class="vtree">
    <el-input v-model="input"  placeholder="输入过滤值" />
    <vTreeScroll ref="tree" :defaultCheckedKeys="[100001]" :data="totalList" :filterNodeMethod="filterFn" />
    
    <div class="btn">
      <el-button @click="setCheck">设置选中</el-button>
      <el-button @click="clear">清空</el-button>
      <el-button @click="filter(input)">筛选</el-button>
      <el-button @click="filter()">筛选清空</el-button>
    </div>
    
  </div>
</template>

<script>
import axios from 'axios'
export default {
  data() {
    return {
        totalList: [],
        input: ''
    }
  },
  watch: {
   
  },
  created() {
    axios.get('http://rap2api.taobao.org/app/mock/16107/api/tree').then(res => {
        this.totalList = res.data.data
    })
  },
  methods: {
    filterFn(item, value){
      return item.name.indexOf(value) > -1
    },
    setCheck(){
      this.$refs.tree.setCheckedKeys([100001])
    },
    clear(){
      this.$refs.tree.clear()
    },
    filter(value){
      this.$refs.tree.filter(value)
    }
  }
}
</script>

<style scoped lang="scss">
.vtree{
  height: 100%;
  display: flex;
  flex-direction: column;
  height: 100vh;
}
</style>
