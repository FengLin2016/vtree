<template>
  <div class="vtree">
    <el-input v-model="input" placeholder="输入过滤值" />
    <vTreeScroll
      ref="tree"
      multiple
      :props="{
        children: 'children',
        label: 'nodetext',
      }"
      node-key="nodeid"
      v-model="defaultCheckedKeys"
      :data="totalList"
      :filterNodeMethod="filterFn"
    />

    <div class="btn">
      <el-button @click="setCheck">设置选中</el-button>
      <el-button @click="clear">清空</el-button>
      <el-button @click="filter(input)">筛选</el-button>
      <el-button @click="filter()">筛选清空</el-button>
    </div>
  </div>
</template>

<script>
import './reset.css';
import axios from "axios";
export default {
  data() {
    return {
      defaultCheckedKeys: [ "b0a660bafe0cad2d7c36810d94438c68/34c9d55cef021fe90bbd4ebbd60d6a5a", "b0a660bafe0cad2d7c36810d94438c68/34c9d55cef021fe90bbd4ebbd60d6a5a/301c1eb2d8b24cb59c726adf629c2578" ],
      totalList: [],
      input: "",
    };
  },
  watch: {},
  created() {
    axios
      .post(
        "http://192.168.9.202:30001/dzjz-service/api/dzjzsystem/getDzjzTree",
        { bmsah: "光明检刑诉受[2025]980102000005号", dwbm: "980102" }
      )
      .then((res) => {
        this.totalList = Object.freeze(this.getTreeData(
          res.data.data,
          "nodeid",
          "pnodeid",
          ""
        ));
      });
  },
  methods: {
    getTreeData(data, id, pid, pvalue, defaultChild = []) {
      if (defaultChild === "undefined") defaultChild = undefined;
      const _data = {};
      data.map((item) => {
        if (!_data[item[pid]]) _data[item[pid]] = [];
        _data[item[pid]].push(item);
      });
      const root = _data[pvalue];
      function inner(temp = [], defaultChild) {
        return temp.map((item) => {
          item.children = _data[item[id]] || defaultChild;
          if (_data[item[id]]) inner(_data[item[id]], defaultChild);
          return item;
        });
      }
      return inner(root, defaultChild);
    },
    filterFn(item, value) {
      return item.name.indexOf(value) > -1;
    },
    setCheck() {
      this.$refs.tree.setCheckedKeys(["b0a660bafe0cad2d7c36810d94438c68/34c9d55cef021fe90bbd4ebbd60d6a5a"]);
    },
    clear() {
      this.$refs.tree.clear();
    },
    filter(value) {
      this.$refs.tree.filter(value);
    },
  },
};
</script>

<style scoped lang="scss">
.vtree {
  height: 100%;
  display: flex;
  flex-direction: column;
  height: 100vh;
}
</style>
