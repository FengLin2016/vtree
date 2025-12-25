<!--
  virtualTree - 虚拟滚动树形选择器组件

  功能特性：
  - 支持虚拟滚动，处理大量数据
  - 支持单选/多选模式
  - 支持搜索过滤
  - 支持展开/收缩树形结构
  - 支持全选/取消全选
  - 支持父子级联动选择

  性能优化：
  - 使用 Set 数据结构优化查找性能
  - 使用 for 循环替代数组过滤方法
  - 虚拟滚动减少 DOM 节点数量
-->
<template>
  <!-- 虚拟滚动列表容器 -->
  <div class="list" ref="list">
    <!-- 占位空间：用于虚拟滚动计算总高度 -->
    <div
      class="space"
      ref="space"
      :style="'height:' + _listDataFilter.length * lineHeight + 'px'"
    ></div>
    <!-- 实际渲染的列表项 -->
    <ul ref="listUl" v-show="list.length">
      <li
        v-for="item in list"
        :style="'padding-left:' + 1.2 * item.level + 'em'"
        :class="item.checked && !multiple ? 'active-li' : ''"
        :key="item[nodeKey] + key"
      >
        <!-- 展开/收缩图标（仅父节点显示） -->
        <i
          v-if="item.children"
          @click.stop="_changeStatus(item)"
          :class="item.collapse ? 'hide' : ''"
          class="el-icon-caret-bottom"
        ></i>
        <!-- 子节点占位符 -->
        <i v-else>&nbsp;</i>
        <!-- 多选复选框 -->
        <el-checkbox
          v-if="multiple"
          @change="_changeBox(item, 'CHANGE')"
          :indeterminate="item.isIndeterminate"
          :checked="item.checked"
          >{{ item[props.label] }}</el-checkbox
        >
        <!-- 单选文本 -->
        <div v-else @click.exact="_nodeClick(item, 'CHANGE')">
          {{ item[props.label] }}
        </div>
      </li>
    </ul>
    <!-- 无数据提示 -->
    <p v-if="!list.length" class="no-data">暂无数据</p>
  </div>
</template>

<script>
/**
 * 全局树形结构映射表
 * 用于快速查找节点及其父级关系，避免重复遍历
 * key: 节点ID, value: 节点对象（包含level、collapse等扩展属性）
 */
const treeMap = {};

/**
 * 深度优先遍历将树形结构转换为扁平列表
 *
 * 功能说明：
 * - 将嵌套的树形结构转换为扁平数组，便于虚拟滚动
 * - 为每个节点添加层级、展开状态、选中状态等扩展属性
 * - 建立父子节点关系映射，支持快速查找
 *
 * @param {Array} tree 树形结构数组（根节点数组）
 * @param {boolean} defaultExpandAll 是否默认展开所有节点
 * @param {string} nodeKey 节点唯一标识字段名，默认 'id'
 * @param {string} childrenKey 子节点属性名，默认 'children'
 * @param {number} initialLevel 初始层级，默认 0
 * @returns {Array} 扁平化后的列表，每个节点包含扩展属性
 */
function treeToListDFS(
  tree,
  defaultExpandAll,
  nodeKey = "id",
  nodeLable = "lable",
  childrenKey = "children",
  initialLevel = 0
) {
  const result = [];

  /**
   * 递归遍历节点
   * @param {Object} node 当前节点
   * @param {number} currentLevel 当前层级
   * @param {number|string} pNodeId 父节点ID，根节点为 -1
   */
  const traverse = (node, currentLevel, pNodeId = -1) => {
    // 创建包含扩展属性的节点对象（不修改原对象）
    const nodeWithLevel = Object.seal({
      data: node,
      [nodeKey]: node[nodeKey],
      [nodeLable]: node[nodeLable],
      level: currentLevel, // 节点层级，用于缩进显示
      collapse: !defaultExpandAll, // 是否收缩，默认收缩状态
      isIndeterminate: false,
      checked: false, // 是否选中
      hide: currentLevel != 0 ? !defaultExpandAll : false, // 是否隐藏（非根节点在非全部展开时隐藏）
      children: !!(node[childrenKey] && node[childrenKey].length), // 是否有子节点
      idx: result.length, // 在扁平数组中的索引
      fatherId: pNodeId, // 父节点ID
    });
    // 将节点存入全局映射表，便于后续快速查找父级关系
    treeMap[node[nodeKey]] = nodeWithLevel;
    result.push(nodeWithLevel);

    // 若有子节点，递归遍历（子节点层级+1）
    if (node[childrenKey] && node[childrenKey].length) {
      node[childrenKey].forEach((child) => {
        traverse(child, currentLevel + 1, node[nodeKey]);
      });
    }
  };

  // 从根节点开始遍历
  tree.forEach((root) => traverse(root, initialLevel));
  return result;
}

export default {
  name: "virtualTree",

  data() {
    return {
      popoverWidth: 150, // 弹出层宽度
      start: 0,
      filterKey: "filter",
      key: "key", //
      list: [], // 当前渲染的列表数据
      listData: [], // 完整的扁平化列表数据
      searchText: "", // 搜索关键字
      ids: {}, // 搜索匹配的节点ID数组
    };
  },
  model: {
    prop: "selectedId",
    event: "model",
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
      default() {
        return [];
      },
    },
    props: {
      type: Object,
      default() {
        return {
          label: "label",
          children: "children",
        };
      },
    },
    nodeKey: {
      type: String,
      default: "id",
    },
    defaultExpandAll: {
      type: Boolean,
      default: false,
    },
    lines: {
      type: Number,
      default: 40,
    },
    lineHeight: {
      type: Number,
      default: 30,
    },
    // 配置是否可多选
    multiple: {
      type: Boolean,
      default() {
        return false;
      },
    },
    checkStrictly: {
      type: Boolean,
      default: false,
    },
    showAllSelection: {
      type: Boolean,
      default: false,
    },
    remoteSearch: {
      type: Boolean,
      default: false,
    },
  },
  created() {},
  computed: {
    selectedArr() {
      if (this.key) {
        return this.listData
          .filter((item) => item.checked)
          .map((item) => item);
      }
    },
    _listDataFilter() {
      if (this.filterKey) {
        if (this.searchText) {
          let arr = this.listData.filter(
            (item) => this.ids[item[this.nodeKey]]
          );
          return arr;
        }
        return this.listData.filter((item) => !item.hide);
      }
    },
    // 实际行数
    _totalLine() {
      return this.listData.length;
    },
  },
  mounted() {
    this.$refs.list &&
      this.$refs.list.addEventListener("scroll", this._wheelFn);
    document.addEventListener("click", this.handleClickOutside);
  },
  destroyed() {
    document.removeEventListener("click", this.handleClickOutside);
    this.$refs.list &&
      this.$refs.list.removeEventListener("scroll", this._wheelFn);
  },
  methods: {
    // 返回选中节点
    getCheckedNodes() {
      return this.selectedArr.map((item) => item.data);
    },
    // 返回选中节点key
    getCheckedKeys() {
      return this.selectedArr.map((item) => item[this.nodeKey]);
    },
    // 返回指定节点
    getNode(id) {
      return treeMap[id].data;
    },
    // 返回半选中节点
    getHalfCheckedNodes() {
      return this.listData
        .filter((item) => item.isIndeterminate)
        .map((item) => item.data);
    },
    // 设置选中节点
    setCheckedKeys(vals, type) {
      for (let index = 0; index < this.listData.length; index++) {
        const item = this.listData[index];
        item.checked = false;
        if (vals.includes(item[this.nodeKey])) {
          this._changeBox(item, type);
        }
      }
    },
    // 清空
    clear() {
      for (let index = 0; index < this.listData.length; index++) {
        const item = this.listData[index];
        item.checked = false;
        item.isIndeterminate = false;
      }
      this._emitChange('CHANGE')
    },
    // 搜索
    filter(value) {
      this.searchText = value;
    },
    _emitChange(type) {
      this.key = Math.random();
      if (this.multiple) {
        this.$emit(
          "model",
          this.selectedArr.map((item) => item[this.nodeKey])
        );
        if(type === 'CHANGE') {
          this.$emit("change", this.selectedArr.map((item) => item[this.nodeKey]), this.selectedArr);
        }
      } else {
        this.$emit("model", this.selectedArr[0]?this.selectedArr[0][this.nodeKey]:'');
        if(type === 'CHANGE') {
          this.$emit("change", this.selectedArr[0]?this.selectedArr[0][this.nodeKey]:'', this.selectedArr[0]);
        }
      }
    },
    // 全选
    allChange(value) {
      for (let index = 0; index < this.listData.length; index++) {
        const item = this.listData[index];
        item.checked = value;
        item.isIndeterminate = false;
      }
      this._emitChange('CHANGE')
    },
    /**
     * @data 选择的数据
     * @type 事件类型 init 初始化 change 改变
     */
    _nodeClick(data, type) {
      if (!this.multiple) {
        if (this.selectedArr[0]) {
          this.selectedArr[0].checked = false;
        }
        data.checked = true;
      }
      this._emitChange(type)
    },
    _changeBox(item, type) {
      const startIndex = item.idx;
      const currentNode = this.listData[startIndex];
      item.isIndeterminate = false;
      item.checked = !item.checked;
      // 如果不需要父子级联动，直接返回
      if (this.checkStrictly) {
        this._nodeClick(item, type);
        return;
      }
      // 1. 更新所有子节点状态（向下传播）
      this._updateChildrenStatus(currentNode, currentNode.checked);

      // 2. 更新所有父节点状态（向上传播）
      this._updateParentStatus(item);
      this._nodeClick(item, type);
      this.key = Math.random();
    },
    /**
     * 更新所有子节点状态（向下传播）
     * @param {Object} parentNode 父节点
     * @param {Boolean} checked 选中状态
     */
    _updateChildrenStatus(parentNode, checked) {
      const startIndex = parentNode.idx;
      const parentLevel = parentNode.level;

      // 遍历所有子节点
      for (let i = startIndex + 1; i < this.listData.length; i++) {
        const node = this.listData[i];

        // 如果层级小于等于父级层级，说明已经超出子节点范围
        if (node.level <= parentLevel) break;

        // // 搜索模式下只更新可见的子节点
        // if (this.searchText && this.ids && !this.ids[node[this.nodeKey]]) {
        //   continue
        // }

        // 更新子节点状态
        node.checked = checked;
        node.isIndeterminate = false;
      }
    },

    /**
     * 更新所有父节点状态（向上传播）
     * @param {Object} childNode 子节点
     */
    _updateParentStatus(childNode) {
      let currentNode = childNode;

      // 逐级向上更新父节点
      while (currentNode && currentNode.fatherId !== -1) {
        const parentNode = treeMap[currentNode.fatherId];
        if (!parentNode) break;

        // 计算父节点的状态
        const parentStatus = this._calculateParentStatus(parentNode);

        // 更新父节点状态
        parentNode.checked = parentStatus.checked;
        parentNode.isIndeterminate = parentStatus.isIndeterminate;

        // 继续向上更新
        currentNode = parentNode;
      }
    },

    /**
     * 计算父节点应该的状态
     * @param {Object} parentNode 父节点
     * @returns {Object} { checked: boolean, isIndeterminate: boolean }
     */
    _calculateParentStatus(parentNode) {
      const startIndex = parentNode.idx;
      const parentLevel = parentNode.level;
      let checkedCount = 0;
      let totalCount = 0;
      let hasIndeterminate = false;

      // 遍历所有直接子节点
      for (let i = startIndex + 1; i < this.listData.length; i++) {
        const node = this.listData[i];

        // 如果层级小于等于父级层级，说明已经超出子节点范围
        if (node.level <= parentLevel) break;

        // 只统计直接子节点（层级为父级+1）
        if (node.level === parentLevel + 1) {
          totalCount++;

          if (node.isIndeterminate) {
            hasIndeterminate = true;
          } else if (node.checked) {
            checkedCount++;
          }
        }
      }

      // 根据统计结果确定父节点状态
      if (totalCount === 0) {
        // 没有子节点，保持原状态
        return {
          checked: parentNode.checked,
          isIndeterminate: false,
        };
      }

      if (hasIndeterminate) {
        // 有子节点处于半选状态，父节点也应该是半选
        return {
          checked: false,
          isIndeterminate: true,
        };
      }

      if (checkedCount === 0) {
        // 所有子节点都未选中
        return {
          checked: false,
          isIndeterminate: false,
        };
      }

      if (checkedCount === totalCount) {
        // 所有子节点都选中
        return {
          checked: true,
          isIndeterminate: false,
        };
      }

      // 部分子节点选中
      return {
        checked: false,
        isIndeterminate: true,
      };
    },
    _showFilter() {
      for (let index = 0; index < this.listData.length; index++) {
        const item = this.listData[index];
        item.collapse = !this.defaultExpandAll;
        item.hide = item.level != 0 ? !this.defaultExpandAll : false;
      }
    },
    // 点击展开收缩
    _changeStatus(item) {
      const startIndex = item.idx;
      const currentNode = this.listData[startIndex];
      const isExpanding = !currentNode.collapse;
      currentNode.collapse = isExpanding;
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
          node.collapse = isExpanding;
          node.hide = isExpanding;
        }
      }
      this._wheelFn();
    },
    // 滚动监听
    _wheelFn() {
      const top = this.$refs.list ? this.$refs.list.scrollTop : 0;
      this.filterKey = Math.random();
      const arr = this._listDataFilter;
      // 如果滚动条已经滚动到最底部，则显示最后
      this.start = top ? Math.ceil(top / this.lineHeight) : 0;
      // 从0开始
      if (this.start < 0) {
        this.start = 0;
      }
      if (this.$refs.listUl) {
        this.$refs.listUl.style.top = top + "px";
      }
      // 末行不足一行 如果上次显示的就已经是所有了 则不更新
      if (arr.length - this.start >= 0) {
        this.list = arr.slice(this.start, this.start + this.lines);
      }
    },
  },
  watch: {
    searchText(v) {
      if (v) {
        let ids = {};
        let arr = this.listData.filter(
          (item) => item[this.props.label].indexOf(this.searchText) > -1
        );
        const that = this;
        function deepFn(citem) {
          let ditem = treeMap[citem["fatherId"]];
          while (ditem) {
            ditem.collapse = false;
            ditem.hide = false;
            ids[ditem[that.nodeKey]] = true;
            ditem = treeMap[ditem["fatherId"]];
          }
        }
        arr.forEach((item) => {
          item.collapse = false;
          item.hide = false;
          ids[item[that.nodeKey]] = true;
          deepFn(item);
        });
        this.ids = ids;
      } else {
        // 将过滤出来的节点如果有子级就全部显示出来
        this._showFilter();
        this.ids = null;
      }
      setTimeout(() => {
        this.$refs.list.scrollTop = 0;
        this._wheelFn();
      });
    },

    data: {
      handler(v, oldv) {
        if (v && v.length) {
          this.listData = treeToListDFS(
            v,
            this.defaultExpandAll,
            this.nodeKey,
            this.props.label
          );
          // 如果是单选
          let selectedIdArr = this.selectedId
          if(!Array.isArray(selectedIdArr)) {
            selectedIdArr = [selectedIdArr];
          }
          // 选中默认
          if (selectedIdArr && selectedIdArr.length) {
            this.setCheckedKeys(selectedIdArr, 'init');
          }
          this._wheelFn();
        }
      },
      immediate: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.list {
  overflow: auto;
  flex: 1;
  position: relative;
  height: 100%;
  ul {
    list-style: none;
    user-select: none;
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    li {
      line-height: 30px;
      white-space: nowrap;
      display: flex;
      align-items: center;
      font-size: 16px;
      height: 30px;
      cursor: pointer;
      &.active-li {
        background: #d7e5f9;
        color: #165ac6;
      }

      i {
        display: inline-block;
        width: 14px;
        color: #a9c4df;
        margin-right: 5px;
        margin-top: 2px;
        &.el-icon-caret-bottom {
          cursor: pointer;
        }
        &.hide {
          transform-origin: 50% 50%;
          transform: rotate(-90deg);
        }
      }
    }
    >>> .el-checkbox {
      display: flex;
      overflow: hidden;
      align-items: center;
      flex: 1;
      .el-checkbox__input {
        position: relative;
        top: 1px;
        margin: 0;
      }
      .el-checkbox__label {
        text-overflow: ellipsis;
        overflow: hidden;
        font-size: 16px;
        color: #606266 !important;
        line-height: 16px !important;
      }
      .el-checkbox__input.is-checked + .el-checkbox__label {
        color: #606266;
      }
    }
  }

  .no-data {
    text-align: center;
    line-height: 50px;
    color: #999;
  }
}
</style>
