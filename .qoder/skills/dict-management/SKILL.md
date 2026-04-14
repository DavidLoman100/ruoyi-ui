---
name: dict-management
description: 若依项目字典管理使用规范。从字典管理模块动态获取字典数据，禁止硬编码。适用于新增功能需要下拉选项、状态展示等场景。
---

# 若依字典管理规范

## 核心规范

**新功能的字典数据必须从字典管理模块获取，禁止硬编码。**

## API接口

```javascript
import { getDictDetail } from '@/api/person/dict'

// 调用方式
getDictDetail('字典code').then(response => {
  // response.data = [{ dictLabel: '显示文本', dictValue: '值' }, ...]
})
```

## 常用字典code

| 用途 | dictCode | 说明 |
|------|----------|------|
| 业务类型 | `import_biz_type` | 导入记录业务类型 |
| 导入状态 | `import_status` | 主记录状态 |
| 文件状态 | `import_file_status` | 导入明细文件状态 |

## 组件中使用步骤

### 1. 引入API和定义数据

```javascript
import { getDictDetail } from '@/api/person/dict'

export default {
  data() {
    return {
      // 下拉选项数组
      bizTypeOptions: [],
      statusOptions: []
    }
  },
  created() {
    this.loadDicts()
  },
  methods: {
    // 加载字典
    loadDicts() {
      Promise.all([
        getDictDetail('import_biz_type'),
        getDictDetail('import_status')
      ]).then(([bizTypeRes, statusRes]) => {
        this.bizTypeOptions = bizTypeRes.data || []
        this.statusOptions = statusRes.data || []
      }).catch(err => {
        console.error('加载字典失败:', err)
      })
    }
  }
}
```

### 2. 模板中动态渲染

```html
<el-select v-model="queryParams.bizType" placeholder="请选择">
  <el-option 
    v-for="item in bizTypeOptions" 
    :key="item.dictValue" 
    :label="item.dictLabel" 
    :value="item.dictValue" />
</el-select>
```

### 3. 显示文本转换

```javascript
// 从字典数据中查找对应文本
getBizTypeText(bizType) {
  const item = this.bizTypeOptions.find(opt => opt.dictValue === bizType)
  return item ? item.dictLabel : bizType
}
```

## 注意事项

- **字典code由后端在字典管理中配置**
- **首次加载后字典数据缓存在组件data中**，适合数据量小的场景
- 如需全局共享字典，考虑使用Vuex或Pinia状态管理
- 错误时降级处理：找不到对应字典项时返回原始值
