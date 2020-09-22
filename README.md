# v-tree-scroll

> 一个虚拟滚动树组件。针对数据量太大会造成渲染 dom 太多，造成页面卡顿，虚拟列表应运而生，而开发过程中还有一种树的结构形式，所以制作了虚拟滚动树，解决 dom 节点过多造成的卡顿。

## 使用步骤

```bash
# 安装组件
npm i v-tree-scroll -S

# 引入组件
import  vTreeScroll  from 'v-tree-scroll'

Vue.use(vTreeScroll)

# 使用
<vTreeScroll  :data="totalList" />

```

## 效果
![效果图](https://xiayulin.top/aaaa.gif)

## 属性

| 属性名             |                                   默认值(类型) |       备注       |
| ------------------ | ---------------------------------------------: | :--------------: |
| lines              |                                     20(Number) |   显示默认行数   |
| lineHeight         |                                     30(Number) |    默认每行高    |
| nodeKey            |                                     id(String) |       key        |
| props              | \{ <br/>label: 'name', <br/> children: 'children' <br/>}(Object) | 默认数据级联结构 |
| filterNodeMethod   |                                 Null(Function) |   默认过滤函数   |
| defaultExpandAll   |                                 false(Boolean) |   是否默认展开   |
| showCheckbox       |                                 true (Boolean) |  是否显示选择框  |
| checkStrictly      |                                false (Boolean) | 是否父子级不关联 |
| defaultCheckedKeys |                                     \[](Array) |   默认选中节点   |
| filterNodeMethod   |                                 Null(Function) |   默认过滤函数   |

## 方法

| 方法名             |       备注       |
| ------------------ |:--------------: |
| doLayout()          |   强制刷新布局   |
| getNode(key)        |   获取指定节点   |
| getCheckedNodes(half)           |   返回选中节点(half是否返回半选)   |
| getCheckedKeys(half)           |   返回选中节点key(half是否返回半选)   |
| setCheckedKeys(keys, leafOnly)      |   设置节点选中(keys 设置的节点key数组;leafOnly 只是改变状态不涉及逻辑)   |
| clear()           |   清空选中   |
| filter(value)      |   过滤数据(需要配合filterNodeMethod使用)   |

