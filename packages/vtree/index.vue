<template>
    <div class="list" ref="list" :style="'line-height:'+ lineHeight+'px'">
        <div class="space" ref="space"></div>
        <ul ref="listUl">
            <li v-for="(item) in list" :style="'text-indent:'+1.2*item.level+'em'"  :key="item[nodeKey]"> 
                <i @click="_changeStatus(item,$event)" :style="'left: '+Number(item.level*20+3)+'px;'"  v-if="item.haschildren" :class="item.expandStatus?'hide':''" class="el-icon-arrow-down"></i> 
                <el-checkbox v-if="showCheckbox" :indeterminate="item.isIndeterminate" @change="_checkBoxchange(item)" v-model="item.checked" /> {{item[props.label]}}
            </li>
        </ul>
    </div>
</template>


<script>
//偏移量
const LINES = 5
// 扁平化tree
/**
 * @param treeData  传入tree数据
 * @param listData  扁平后数据
 * @param level 等级
 * @param id    传值唯一值
 */
function treeTolist(treeData, key, defaultExpandAll, listData = [], level = 0, pNodeId = -1){
    treeData.map(item => {
        return (function(level){
            if(item.children && item.children.length){
                const {children} = item
                delete item.children
                listData.push({
                    ...item,
                    nodeId: item[key],
                    pNodeId,
                    level,
                    haschildren: true,
                    checked: false,
                    isIndeterminate: false,
                    expandStatus: defaultExpandAll?false:true,
                    data: item,
                    hide: (!defaultExpandAll && level != 0)?true:false,
                })
                treeTolist(children,key, defaultExpandAll, listData,++level, item[key])
            } else {
                listData.push({
                    ...item,
                    pNodeId,
                    nodeId: item[key],
                    level,
                    haschildren: false,
                    checked: false,
                    isIndeterminate: false,
                    expandStatus: defaultExpandAll?false:true,
                    data: item,
                    hide: (!defaultExpandAll && level != 0)?true:false,
                })
            }
        })(level)
        
    })
    
    return listData
}

import { Checkbox } from 'element-ui';
export default {
    name: 'vTreeScroll',
    components: {
        'el-checkbox': Checkbox
    },
    data(){
        return{
            listData: [],
            list: [],
            linesNum: this.lines,
            selectNodes: new Set()
        }
    },
    props: {
        data:{
            type: Array,
            default:() => {
                return []
            } 
        },
        defaultExpandAll: {
            type: Boolean,
            default: false
        },
        showCheckbox: {
            type: Boolean,
            default: true
        },
        checkStrictly:{
            type: Boolean,
            default: false
        },
        defaultCheckedKeys:{
            type: Array,
            default:() => {
                return []
            } 
        },
        filterNodeMethod:{
            type: Function
        },
        lines: {
            type: Number,
            default: 20
        },
        lineHeight: {
            type: Number,
            default: 30
        },
        nodeKey: {
            type: String,
            default: 'id'
        },
        props: {
            type: Object,
            default: () => {
                return {
                    label: 'name',
                    children: 'children',
                }
            }
        }
    },
    created(){
        
    },
    computed:{
        // 总高度
        _totalHeight(){
            return this._listDataFilter.length * this.lineHeight
        },
        // 列表高度
        _listHeight(){
            return this.$refs.list.offsetHeight
        },
        _listDataFilter(){
            return this.listData.filter(item => !item.hide).filter(item => item.visible!==false)
        }
    },
    mounted(){
        // 监听这个dom的scroll事件
        window.addEventListener('scroll', this._wheelFn, true)

        // 动态计算需要展示多少行
        this.$nextTick(() => {
            this.linesNum = parseInt(this.$refs.list.offsetHeight)/this.lineHeight + LINES 
        })
        window.onresize = () => {
            this.linesNum = parseInt(this.$refs.list.offsetHeight)/this.lineHeight + LINES
            this._wheelFn()
        }
  
    },
    methods:{
        // 滚动监听
        _wheelFn(){
            let top = this.$refs.list.scrollTop
            // 总数高度减去列表实际高度（如果小于0说明不需要滚动）
            let num = this._totalHeight - this._listHeight
            this.$refs.listUl.style.top = Math.min(num>0?num:0,Math.max(top, 0)) + 'px'
            let start = parseInt(top/this.lineHeight)
            this.list = this.listData.filter(item => !item.hide).filter(item => item.visible !== false).slice(start, start+this.linesNum)
        },
        // 点击展开收缩
        _changeStatus(node,e){
            let i = this.listData.indexOf(node)
            for (let index = i+1; index < this.listData.length; index++) {
                if(this.listData[i].level >= this.listData[index].level){
                    break;
                }
                // 打开的时候 this.listData[i].level >= this.listData[index].level - 1 && 
                if(this.listData[i].expandStatus){
                    // 展开的时候就是hide为false
                    if(this.listData[i].expandStatus &&  
                    this.listData[i].haschildren){
                        if(this.listData[i].level == this.listData[index].level - 1){
                            this.listData[index].hide = false
                        }
                    } 
                    if(this.listData[i].level == this.listData[index].level - 1){
                        this.listData[index].hide = false
                    }
                } else {
                    this.listData[index].hide = true
                }
            }
            // 保存选择按钮状态
            this.listData[i].expandStatus = !this.listData[i].expandStatus
            // 左侧按钮显示切换
            if(this.listData[i+1].hide){
                e.target.className += ' hide';
            } else {
                e.target.className = 'el-icon-arrow-down';
            }
            this.$refs.space.style.height = this._totalHeight + 'px'
            this._wheelFn()
        },

        // 设置父级选中
        _setcheckbox(index, all, none){
            if(all){
                this.listData[index].isIndeterminate = false
                this.listData[index].checked = true
            }
            if(none){
                this.listData[index].isIndeterminate = false
                this.listData[index].checked = false
            }
            if(!all && !none){
                this.listData[index].isIndeterminate = true
                this.listData[index].checked = false
            }
        },

        // 点击切换box
        /**
         * @param node 选中节点
         * @param status 设置选中
         */
        _checkBoxchange(node, status){
            // 当前选中节点顺序
            console.time("选择时间")
            let i = this.listData.indexOf(node)
            let all = {}   // 全选
            let none = {}  // 没有选中
            
            // 判断是否选中
            this._changeNodes(node)

            // 如果不是级联
            if(this.checkStrictly){
                // 触发上层check
                this.$emit('check-change', node)
                return
            }
            // 向下递归
            this._deepDown(i, all, none, status)
            // 当前点击的不是半选 
            if(!this.listData[i].isIndeterminate){
                // 向上递归
                this._deepUp(i, all, none)
            }
            
            // 触发上层check
            this.$emit('check-change', node)
            console.timeEnd("选择时间")
            
        },
        // 向下递归
        /**
        * @param i 点击node的序号
        * @param all 全选对象
        * @param none 全不选对象
        * @param status 设置状态
        */
        _deepDown(i, all, none, status){
            let ischild = true // 子级是否循环完成
            // 向下递归 父级->子级
            for (let index = i+1; index < this.listData.length; index++) {
                    if(!this.listData[index-1].checked){
                        all[this.listData[index-1].pNodeId]  = false
                    }
                    if(this.listData[index-1].checked){
                        none[this.listData[index-1].pNodeId] = false
                    }
                // 递归到下一个一级目录
                if(this.listData[index].level == 0){
                    break;
                }
                if(this.listData[i].level == this.listData[index].level){
                     ischild = false;
                }
                // 选父级 选中子级
                if(this.listData[i].level < this.listData[index].level && ischild){
                    if(status){
                        this.listData[index].checked = true
                    } else {
                        this.listData[index].checked = !this.listData[index].checked
                    }
                    if(this.listData[index].checked){
                        // 延后执行 下一次事件循环执行 因为后面还需要用到这个值 用过后才能修改
                        this.$nextTick(() => {
                            this.listData[index].isIndeterminate = false
                        })
                    }
                    // 如果是半选 就赋值所有为选中
                    if(this.listData[i].isIndeterminate){
                        // 同上
                        this.$nextTick(() => {
                            this.listData[i].checked = true
                            this.listData[i].isIndeterminate = false
                            this._deepUp(i, all, none)
                        })
                        this.listData[index].checked = true
                    }
                }
                this._changeNodes(this.listData[index])
            }
        },

        // 向上递归
        /**
        * @param i 点击node的序号
        * @param all 全选对象
        * @param none 全不选对象
        */
        _deepUp(i, all, none){
            // 父子级联 子->父 
            // 向上递归
            let level = 0  // 层级控制
            for (let index = i-1; index >= 0; index--) {
                if((!this.listData[index+1].checked || this.listData[index+1].isIndeterminate)){
                    all[this.listData[index+1].pNodeId] = false
                }
                if((this.listData[index+1].checked || this.listData[i].checked || this.listData[index+1].isIndeterminate || this.listData[i].isIndeterminate)){
                    none[this.listData[index+1].pNodeId] = false
                }
                // 如果跨级别了
                if(this.listData[i].level > this.listData[index].level + level){
                    ++level
                    this._setcheckbox(index, this._checkAllorNone(all[this.listData[index].nodeId]), this._checkAllorNone(none[this.listData[index].nodeId]))
                }
                this._changeNodes(this.listData[index])
                // 如果到根节点了
                if(this.listData[index].level == 0){
                    break;
                }
            }
        },
        // 判断undfined情况为真
        _checkAllorNone(obj){
            if(obj === false){
                return false
            }
            return true
        },

        // 维护选择的node
        _changeNodes(node){
            if(node.checked || node.isIndeterminate){
                this.selectNodes.add(node)
            } else if(this.selectNodes.has(node)){
                this.selectNodes.delete(node)
            }
        },

        // 向上递归父级设置可选中
        _setVisible(node){
            // 父子级联 子->父 
            // 向上递归
            let i = this.listData.indexOf(node)
            let level = 0  // 层级控制
            for (let index = i-1; index >= 0; index--) {
                // 如果跨级别了
                if(this.listData[i].level > this.listData[index].level + level){
                    ++level
                    this.listData[index].visible = true
                    this.listData[index].hide = false
                    this.listData[index].expandStatus = false
                }
                // 如果到根节点了
                if(this.listData[index].level == 0){
                    break;
                }
            }
        },

        // 刷新布局
        doLayout(){
            this.linesNum = parseInt(this.$refs.list.offsetHeight)/this.lineHeight + LINES 
            this._wheelFn()
        },
        // 获取指定节点
        getNode(key){
            let data = null
            this.listData.some(item => {
                if(item.nodeId == key){
                    data = item
                    return true
                }
            })
            return data
        },
        //返回选中节点
        getCheckedNodes(half){
            let arr = Array.from(this.selectNodes)
            if(half){
                return arr
            }
            // 不包含半选
            return  arr.filter(item => {
                return item.checked
            })
        },

        //返回选中节点key
        getCheckedKeys(half){
            return this.getCheckedNodes(half).map(item => {
                return item.nodeId
            })
        },

        // 设置节点选中
        /**
         * @param keys 设置的节点key数组
         * @param leafOnly 只是改变状态不涉及逻辑
         */
        setCheckedKeys(keys, leafOnly){
            console.time("设置key时间")
            let arr = keys
            this.listData.some((item) => {
                if(!keys){
                    return true
                }
                if(!keys.length){
                    return true
                }
                let i = keys.indexOf(item.nodeId)
                if( i > -1){
                    // 不是数组
                    if(keys.splice){
                        keys.splice(i,1)
                    } else {
                        keys = null
                    }
                    item.checked = true
                    this.$set(item,'checked', true)
                    this._checkBoxchange(item, true)
                }
            })
            console.timeEnd("设置key时间")
        },
        // 清空选中
        clear(){
            this.selectNodes.forEach((v) =>{
                this.$set(v,'checked', false)
                if(v.isIndeterminate){
                    this.$set(v,'isIndeterminate', false)
                }
            })
            this.selectNodes.clear()
        },
        
        // 过滤数据
        filter(value){
            if(!this.filterNodeMethod){
                return
            }
            if(!value){
                this.listData.map(item => {
                    this.$set(item, 'visible', undefined)
                })
            } else {
                 this.listData.map(item => {
                    if(this.filterNodeMethod(item, value)){
                        this.$set(item, 'visible', true)
                        this.$set(item, 'hide', false)
                        // 设置父级为显示状态
                        this._setVisible(item)
                    } else {
                        this.$set(item, 'visible', false)
                    }
                })
            }
           
            this.$set(this, 'list', this._listDataFilter.slice(0, this.linesNum))
            this.$refs.space.style.height = this._totalHeight + 'px'
            this.$refs.list.scrollTop = 0
        }
    },
    watch:{
        data(v){
            console.log('vvvvv',v)
            this.listData = treeTolist(v, this.nodeKey, this.defaultExpandAll)
            this.list = this._listDataFilter.slice(0, this.linesNum)
            this.$refs.space.style.height = this._totalHeight + 'px'
            this._wheelFn()
            // 默认选中设置
            this.setCheckedKeys(this.defaultCheckedKeys)
        }
    }
}
</script>

<style scoped lang="scss">
.list{
    position: relative;
    height: 100%;
    overflow: auto;
    .space,ul{
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
    }
    ul{
        li{
            position: relative;
            padding-left: 20px;
            /deep/ .el-checkbox{
                top: -1px;
                position: relative;
                text-indent: 0;
            }
            i{
                font-size: 12px;
                cursor: pointer;
                user-select: none;
                transition: all .5s;
                position: absolute;
                text-indent: 0;
                left: 5px;
                top: 50%;
                margin-top: -4px;
                &.hide{
                    transform-origin: 50% 50%;
                    transform: rotate(-90deg);
                }
            }
        }
    }
   
}
</style>