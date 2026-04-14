---
name: form-page
description: 若依项目表单页面开发规范与模板。包含标准UI风格、组件化架构、API层设计。适用于新增业务模块的列表页面、搜索表单、数据表格等场景。
---

# 若依表单页面开发规范

## 核心设计理念

**组件化 + 扁平化 + 统一UI风格**

本规范基于 importRecord 模块的最佳实践总结，强调：
- 主页面与详情弹窗分离
- API层独立封装
- 字典数据动态获取
- 统一视觉风格

---

## UI风格规范

### 设计语言

| 元素 | 规范 | 示例 |
|-----|------|-----|
| 主题色 | `#3b82f6` | 按钮、高亮、选中状态 |
| 成功色 | `#10b981` | 成功状态 |
| 警告色 | `#f59e0b` | 警告、处理中状态 |
| 危险色 | `#ef4444` | 错误、失败状态 |
| 背景色 | `#f5f7fa` | 页面背景 |
| 卡片背景 | `#ffffff` | 内容卡片 |
| 边框色 | `#e8ecef` | 分割线、边框 |
| 文字主色 | `#1f2937` | 标题 |
| 文字次色 | `#4a5568` | 标签 |
| 文字辅助 | `#6b7280` | 表格内容 |
| 圆角 | `6px ~ 8px` | 卡片、按钮、输入框 |

### 组件尺寸规范

| 组件 | 尺寸规范 |
|-----|---------|
| 搜索区域内边距 | `12px 16px` |
| 卡片内边距 | `16px` |
| 按钮内边距 | `6px 12px` ~ `8px 18px` |
| 表格行高 | `padding: 8px 0` |
| 表单项宽度 | `120px ~ 160px` |
| 分页器高度 | `28px ~ 32px` |

---

## 页面结构规范

```
┌─────────────────────────────────────────────────────────┐
│  import-record-page (页面容器)                           │
│  ├── padding: 16px                                      │
│  └── background: #f5f7fa                               │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ content-card (主内容卡片)                          │   │
│  │ ├── background: #fff                             │   │
│  │ ├── border-radius: 8px                           │   │
│  │ ├── padding: 16px                                │   │
│  │ └── box-shadow: 0 1px 4px rgba(0,0,0,0.05)        │   │
│  │                                                  │   │
│  │  ┌────────────────────────────────────────────┐ │   │
│  │  │ search-section (搜索区域)                    │ │   │
│  │  │ ├── background: #fafbfc                    │ │   │
│  │  │ ├── border: 1px solid #e8ecef              │ │   │
│  │  │ └── border-radius: 6px                     │ │   │
│  │  └────────────────────────────────────────────┘ │   │
│  │                                                  │   │
│  │  ┌────────────────────────────────────────────┐ │   │
│  │  │ toolbar-section (工具栏)                   │ │   │
│  │  │ ├── display: flex                         │ │   │
│  │  │ └── justify-content: space-between        │ │   │
│  │  └────────────────────────────────────────────┘ │   │
│  │                                                  │   │
│  │  ┌────────────────────────────────────────────┐ │   │
│  │  │ data-table (数据表格)                        │ │   │
│  │  │ ├── border-radius: 6px                    │ │   │
│  │  │ └── font-size: 13px                       │ │   │
│  │  └────────────────────────────────────────────┘ │   │
│  │                                                  │   │
│  │  ┌────────────────────────────────────────────┐ │   │
│  │  │ pagination-wrapper (分页)                  │ │   │
│  │  │ └── justify-content: flex-end             │ │   │
│  │  └────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 组件化架构

```
src/views/业务模块/
├── index.vue           # 主页面（列表 + 搜索 + 操作）
├── components/
│   └── Detail.vue      # 详情弹窗组件
└── api/
    └── xxx.js          # API接口封装（可选）
```

### 主页面职责
- 搜索表单
- 工具栏按钮
- 数据表格展示
- 分页控制
- 调用详情组件

### 详情组件职责
- 弹窗展示
- 详情数据查询
- 明细列表
- 操作按钮（下载、编辑等）

---

## API层设计规范

### 目录结构
```
src/api/业务/
├── xxx.js          # 主模块API
└── xxxDetail.js    # 详情模块API（可选）
```

### 标准API方法

```javascript
// 命名规范：动词 + 资源名
export function listXxx(data) {}        // 分页列表
export function getXxx(id) {}           // 获取详情
export function addXxx(data) {}         // 新增
export function updateXxx(data) {}       // 修改
export function deleteXxx(id) {}         // 删除
```

### 分页查询参数规范

```javascript
queryParams: {
  pageNum: 1,
  pageSize: 10,
  // 业务查询参数...
}
```

---

## 字典使用规范

**必须从字典管理模块获取，禁止硬编码。**

```javascript
import { getDictDetail } from '@/api/person/dict'

// 加载多个字典
Promise.all([
  getDictDetail('dict_code_1'),
  getDictDetail('dict_code_2')
]).then(([res1, res2]) => {
  this.options1 = res1.data || []
  this.options2 = res2.data || []
})
```

---

## 模板文件

| 文件 | 说明 |
|-----|------|
| [templates/page.vue](/.qoder/skills/form-page/templates/page.vue) | 主页面完整模板 |
| [templates/components/detail.vue](/.qoder/skills/form-page/templates/components/detail.vue) | 详情弹窗模板 |
| [templates/api.js](/.qoder/skills/form-page/templates/api.js) | API层模板 |

---

## 快速开始

1. **复制模板文件**到目标目录
2. **替换占位符**：
   - `Xxx` → 业务名称（如 ImportRecord）
   - `xxx` → 业务简称（如 importRecord）
   - `业务类型` → 实际业务名称
3. **对接API接口**
4. **配置字典code**
5. **调整表格列**

---

## 最佳实践

### 1. 搜索表单
- 使用 `inline` 模式紧凑排列
- 表单项宽度统一（120px ~ 160px）
- 查询/重置按钮靠右

### 2. 数据表格
- 序号列居中，宽60px
- 状态使用 Tag 组件
- 文字超长使用 `show-overflow-tooltip`
- 行hover高亮

### 3. 分页器
- 使用 `background` 属性
- 靠右对齐
- 合适的尺寸（28px ~ 32px）

### 4. 弹窗
- `append-to-body` 避免层级问题
- `close-on-click-modal="false"` 防止误关闭
- 统一的header背景色
