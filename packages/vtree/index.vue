<template>
  <div class="list" ref="list" :style="'line-height:' + lineHeight + 'px'">
    <div class="space" ref="space"></div>
    <ul ref="listUl">
      <li
        v-for="item in list"
        :style="
          'height:' + lineHeight + 'px;padding-left:' + 1.2 * item.level + 'em'
        "
        :key="item[nodeKey]"
      >
        <i
          @click="_changeStatus(item, $event)"
          v-if="item.children"
          :class="item.expand ? 'hide' : ''"
          class="el-icon-arrow-down"
        ></i>
        <i v-else>&nbsp;</i>
        <el-checkbox
          v-if="showCheckbox"
          :indeterminate="item.isIndeterminate"
          @change="_checkBoxchange(item)"
          v-model="item.checked"
        />
        {{ item[props.label] }}
      </li>
    </ul>
  </div>
</template>


<script>
//偏移量
const LINES = 5;
/* 深度优先遍历将树转为列表
 * @param {Array} tree 树形结构数组（根节点数组）
 * @param {string} childrenKey 子节点属性名，默认 'children'
 * @returns {Array} 扁平化后的列表
 */
const treeMap = {};
function treeToListDFS(
  tree,
  defaultExpandAll,
  selectedId,
  nodeKey = "id",
  childrenKey = "children",
  initialLevel = 0
) {
  const result = [];

  const traverse = (node, currentLevel, pNodeId = -1) => {
    // 复制节点并添加level字段（不修改原对象）
    const nodeWithLevel = {
      ...node,
      nodeId: node[nodeKey],
      pNodeId,
      level: currentLevel,
      expand: !defaultExpandAll,
      checked: selectedId.includes(node[nodeKey]),
      hide: currentLevel != 0 ? !defaultExpandAll : false,
      children: !!node[childrenKey],
      idx: result.length,
      fatherId: pNodeId,
    };
    // 存一份结构 后续父级
    treeMap[node[nodeKey]] = nodeWithLevel;
    result.push(nodeWithLevel);
    // 若有子节点，递归遍历（子节点层级+1）
    if (node[childrenKey] && node[childrenKey].length) {
      node[childrenKey].forEach((child) => {
        traverse(child, currentLevel + 1, node[nodeKey]);
      });
    }
  };
  // 根节点从初始层级开始遍历
  tree.forEach((root) => traverse(root, initialLevel));
  return result;
}

import { Checkbox } from "element-ui";
export default {
  name: "vTreeScroll",
  components: {
    "el-checkbox": Checkbox,
  },
  model: {
    prop: "selectedId",
    event: "checkChange",
  },
  data() {
    return {
      listData: [],
      list: [],
      linesNum: this.lines,
      selectNodes: new Set(),
    };
  },
  props: {
    selectedId: {
      type: [String, Array],
      default() {
        return "";
      },
    },
    data: {
      type: Array,
      default: () => {
        return [];
      },
    },
    defaultExpandAll: {
      type: Boolean,
      default: false,
    },
    showCheckbox: {
      type: Boolean,
      default: false,
    },
    checkStrictly: {
      type: Boolean,
      default: false,
    },
    defaultCheckedKeys: {
      type: Array,
      default: () => {
        return [];
      },
    },
    filterNodeMethod: {
      type: Function,
    },
    lines: {
      type: Number,
      default: 20,
    },
    lineHeight: {
      type: Number,
      default: 30,
    },
    nodeKey: {
      type: String,
      default: "id",
    },
    props: {
      type: Object,
      default: () => {
        return {
          label: "name",
          children: "children",
        };
      },
    },
  },
  created() {},
  computed: {
    // 总高度
    _totalHeight() {
      return this._listDataFilter.length * this.lineHeight;
    },
    // 列表高度
    _listHeight() {
      return this.$refs.list.offsetHeight;
    },
    _listDataFilter() {
      return this.listData
        .filter((item) => !item.hide)
        .filter((item) => item.visible !== false);
    },
  },
  mounted() {
    // 监听这个dom的scroll事件
    window.addEventListener("scroll", this._wheelFn, true);

    // 动态计算需要展示多少行
    this.$nextTick(() => {
      this.linesNum =
        parseInt(this.$refs.list.offsetHeight / this.lineHeight) + LINES;
    });
    window.onresize = () => {
      this.linesNum =
        parseInt(this.$refs.list.offsetHeight / this.lineHeight) + LINES;
      this._wheelFn();
    };
  },
  methods: {
    // 滚动监听
    _wheelFn() {
      let top = this.$refs.list.scrollTop;
      // 总数高度减去列表实际高度（如果小于0说明不需要滚动）
      let num = this._totalHeight - this._listHeight;
      this.$refs.listUl.style.top =
        Math.min(num > 0 ? num : 0, Math.max(top, 0)) + "px";
      let start = parseInt(top / this.lineHeight);
      let arr = this.listData
        .filter((item) => !item.hide)
        .filter((item) => item.visible !== false);
      let end = Math.min(start + this.linesNum, arr.length);
      // 处理边界问题 #issues1
      if (end - start < this.linesNum) {
        let a = end - this.linesNum;
        start = a < 0 ? 0 : a;
      }
      this.list = arr.slice(start, end);
    },
    // 点击展开收缩
    _changeStatus(item) {
      const startIndex = item.idx;
      const currentNode = this.listData[startIndex];
      const isExpanding = !currentNode.expand;
      currentNode.expand = isExpanding;
      // 优化遍历逻辑
      const currentLevel = currentNode.level;
      for (let index = startIndex + 1; index < this.listData.length; index++) {
        const node = this.listData[index];
        const nodeLevel = node.level;
        // 如果当前节点层级大于等于当前操作节点层级，说明已经超出子节点范围
        if (nodeLevel <= currentLevel) break;
        // 展开时只显示直接子级，收缩时隐藏所有子级
        if (!isExpanding) {
          // 只展开直接子级
          if (nodeLevel === currentLevel + 1) {
            node.hide = isExpanding;
          }
        } else {
          // 收缩时隐藏所有子级
          node.expand = isExpanding;
          node.hide = isExpanding;
        }
      }
      this._wheelFn();
    },

    // 设置父级选中
    _setcheckbox(index, all, none) {
      if (all) {
        this.listData[index].isIndeterminate = false;
        this.listData[index].checked = true;
      }
      if (none) {
        this.listData[index].isIndeterminate = false;
        this.listData[index].checked = false;
      }
      if (!all && !none) {
        this.listData[index].isIndeterminate = true;
        this.listData[index].checked = false;
      }
    },

    // 点击切换box
    /**
     * @param node 选中节点
     * @param status 设置选中
     */
    _checkBoxchange(node, status) {
      // 当前选中节点顺序
      console.time("选择时间");
      let i = this.listData.indexOf(node);
      let all = {}; // 全选
      let none = {}; // 没有选中

      // 判断是否选中
      this._changeNodes(node);

      // 如果不是级联
      if (this.checkStrictly) {
        // 触发上层check
        this.$emit("check-change", node);
        return;
      }
      // 向下递归
      this._deepDown(i, all, none, status);
      // 当前点击的不是半选
      if (!this.listData[i].isIndeterminate) {
        // 向上递归
        this._deepUp(i, all, none);
      }

      // 触发上层check
      this.$emit("check-change", node);
      console.timeEnd("选择时间");
    },
    // 向下递归
    /**
     * @param i 点击node的序号
     * @param all 全选对象
     * @param none 全不选对象
     * @param status 设置状态
     */
    _deepDown(i, all, none, status) {
      let ischild = true; // 子级是否循环完成
      // 向下递归 父级->子级
      for (let index = i + 1; index < this.listData.length; index++) {
        if (!this.listData[index - 1].checked) {
          all[this.listData[index - 1].pNodeId] = false;
        }
        if (this.listData[index - 1].checked) {
          none[this.listData[index - 1].pNodeId] = false;
        }
        // 递归到下一个一级目录
        if (this.listData[index].level == 0) {
          break;
        }
        if (this.listData[i].level == this.listData[index].level) {
          ischild = false;
        }
        // 选父级 选中子级
        if (this.listData[i].level < this.listData[index].level && ischild) {
          if (status) {
            this.listData[index].checked = true;
          } else {
            this.listData[index].checked = !this.listData[index].checked;
          }
          if (this.listData[index].checked) {
            // 延后执行 下一次事件循环执行 因为后面还需要用到这个值 用过后才能修改
            this.$nextTick(() => {
              this.listData[index].isIndeterminate = false;
            });
          }
          // 如果是半选 就赋值所有为选中
          if (this.listData[i].isIndeterminate) {
            // 同上
            this.$nextTick(() => {
              this.listData[i].checked = true;
              this.listData[i].isIndeterminate = false;
              this._deepUp(i, all, none);
            });
            this.listData[index].checked = true;
          }
        }
        this._changeNodes(this.listData[index]);
      }
    },

    // 向上递归
    /**
     * @param i 点击node的序号
     * @param all 全选对象
     * @param none 全不选对象
     */
    _deepUp(i, all, none) {
      // 父子级联 子->父
      // 向上递归
      let level = 0; // 层级控制
      for (let index = i - 1; index >= 0; index--) {
        if (
          !this.listData[index + 1].checked ||
          this.listData[index + 1].isIndeterminate
        ) {
          all[this.listData[index + 1].pNodeId] = false;
        }
        if (
          this.listData[index + 1].checked ||
          this.listData[i].checked ||
          this.listData[index + 1].isIndeterminate ||
          this.listData[i].isIndeterminate
        ) {
          none[this.listData[index + 1].pNodeId] = false;
        }
        // 如果跨级别了
        if (this.listData[i].level > this.listData[index].level + level) {
          ++level;
          this._setcheckbox(
            index,
            this._checkAllorNone(all[this.listData[index].nodeId]),
            this._checkAllorNone(none[this.listData[index].nodeId])
          );
        }
        this._changeNodes(this.listData[index]);
        // 如果到根节点了
        if (this.listData[index].level == 0) {
          break;
        }
      }
    },
    // 判断undfined情况为真
    _checkAllorNone(obj) {
      if (obj === false) {
        return false;
      }
      return true;
    },

    // 维护选择的node
    _changeNodes(node) {
      if (node.checked || node.isIndeterminate) {
        this.selectNodes.add(node);
      } else if (this.selectNodes.has(node)) {
        this.selectNodes.delete(node);
      }
    },

    // 向上递归父级设置可选中
    _setVisible(node) {
      // 父子级联 子->父
      // 向上递归
      let i = this.listData.indexOf(node);
      let level = 0; // 层级控制
      for (let index = i - 1; index >= 0; index--) {
        // 如果跨级别了
        if (this.listData[i].level > this.listData[index].level + level) {
          ++level;
          this.listData[index].visible = true;
          this.listData[index].hide = false;
          this.listData[index].expand = false;
        }
        // 如果到根节点了
        if (this.listData[index].level == 0) {
          break;
        }
      }
    },

    // 刷新布局
    doLayout() {
      this.linesNum =
        parseInt(this.$refs.list.offsetHeight / this.lineHeight) + LINES;
      this._wheelFn();
    },
    // 获取指定节点
    getNode(key) {
      let data = null;
      this.listData.some((item) => {
        if (item.nodeId == key) {
          data = item;
          return true;
        }
      });
      return data;
    },
    //返回选中节点
    getCheckedNodes(half) {
      let arr = Array.from(this.selectNodes);
      if (half) {
        return arr;
      }
      // 不包含半选
      return arr.filter((item) => {
        return item.checked;
      });
    },

    //返回选中节点key
    getCheckedKeys(half) {
      return this.getCheckedNodes(half).map((item) => {
        return item.nodeId;
      });
    },

    // 设置节点选中
    /**
     * @param keys 设置的节点key数组
     * @param leafOnly 只是改变状态不涉及逻辑
     */
    setCheckedKeys(keys, leafOnly) {
      console.time("设置key时间");
      let arr = keys;
      this.listData.some((item) => {
        if (!keys) {
          return true;
        }
        if (!keys.length) {
          return true;
        }
        let i = keys.indexOf(item.nodeId);
        if (i > -1) {
          // 不是数组
          if (keys.splice) {
            keys.splice(i, 1);
          } else {
            keys = null;
          }
          item.checked = true;
          this.$set(item, "checked", true);
          this._checkBoxchange(item, true);
        }
      });
      console.timeEnd("设置key时间");
    },
    // 清空选中
    clear() {
      this.selectNodes.forEach((v) => {
        this.$set(v, "checked", false);
        if (v.isIndeterminate) {
          this.$set(v, "isIndeterminate", false);
        }
      });
      this.selectNodes.clear();
    },

    // 过滤数据
    filter(value) {
      if (!this.filterNodeMethod) {
        return;
      }
      if (!value) {
        this.listData.map((item) => {
          this.$set(item, "visible", undefined);
        });
      } else {
        this.listData.map((item) => {
          if (this.filterNodeMethod(item, value)) {
            this.$set(item, "visible", true);
            this.$set(item, "hide", false);
            // 设置父级为显示状态
            this._setVisible(item);
          } else {
            this.$set(item, "visible", false);
          }
        });
      }

      this.$set(this, "list", this._listDataFilter.slice(0, this.linesNum));
      this.$refs.space.style.height = this._totalHeight + "px";
      this.$refs.list.scrollTop = 0;
    },
  },
  watch: {
    data: {
      handler(v, oldv) {
        if (v && v.length) {
          this.listData = treeToListDFS(
            v,
            this.defaultExpandAll,
            this.multiple ? this.selectedId : [this.selectedId],
            this.nodeKey
          );
          this.list = this._listDataFilter.slice(0, this.linesNum);
          this.$refs.space.style.height = this._totalHeight + "px";
          this._wheelFn();
          // 默认选中设置
          this.setCheckedKeys(this.defaultCheckedKeys);
        }
      },
      immediate: true,
    },
  },
};
</script>

<style scoped lang="scss">
.list {
  position: relative;
  height: 100%;
  overflow: auto;
  .space,
  ul {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
  }
  ul {
    li {
      position: relative;
      padding-left: 20px;
      list-style: none;
      ::v-deep .el-checkbox {
        top: -1px;
        position: relative;
        text-indent: 0;
      }
      i {
        font-size: 12px;
        cursor: pointer;
        user-select: none;
        transition: all 0.5s;
        text-indent: 0;
        left: 5px;
        top: 50%;
        width: 12px;
        display: inline-block;
        margin-top: -6px;
        z-index: 9;
        &.hide {
          transform-origin: 50% 50%;
          transform: rotate(-90deg);
        }
      }
    }
  }
}
</style>