<template>
  <div class="xxx-page">
    <!-- 主内容卡片 -->
    <div class="content-card">
      <!-- 搜索表单区域 -->
      <div class="search-section" v-show="showSearch">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true">
          <el-form-item label="业务类型" prop="bizType">
            <el-select v-model="queryParams.bizType" placeholder="请选择" clearable class="select-custom">
              <el-option v-for="item in bizTypeOptions" :key="item.dictValue" :label="item.dictLabel" :value="item.dictValue" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="queryParams.status" placeholder="请选择" clearable class="select-custom">
              <el-option v-for="item in statusOptions" :key="item.dictValue" :label="item.dictLabel" :value="item.dictValue" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" @click="handleQuery">查询</el-button>
            <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 操作按钮区域 -->
      <div class="toolbar-section">
        <div class="toolbar-left">
          <el-button type="primary" plain icon="el-icon-plus" size="small" @click="handleAdd">
            新增
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-button circle icon="el-icon-refresh" @click="getList"></el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="dataList" border class="data-table">
        <el-table-column label="序号" type="index" width="60" align="center" />
        <el-table-column label="业务类型" align="center" prop="bizType" width="100">
          <template slot-scope="scope">
            <span class="biz-type-tag" :class="'biz-' + scope.row.bizType">
              {{ getBizTypeText(scope.row.bizType) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" width="110">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)" size="small">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="left" prop="remark" :show-overflow-tooltip="true" />
        <el-table-column label="创建者" align="center" prop="createBy" width="100" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="160">
          <template slot-scope="scope">
            <span class="time-text">{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="150">
          <template slot-scope="scope">
            <el-button size="small" type="text" icon="el-icon-view" @click="handleViewDetail(scope.row)">详情</el-button>
            <el-button size="small" type="text" icon="el-icon-edit" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="text" icon="el-icon-delete" class="btn-delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination 
          :background="true" 
          :current-page="queryParams.pageNum" 
          :page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]" 
          :total="total" 
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange" 
          @current-change="handlePageChange" />
      </div>
    </div>

    <!-- 详情弹窗 -->
    <detail ref="detail" @refresh="getList" />
  </div>
</template>

<script>
import { listXxx, deleteXxx } from '@/api/xxx/xxx'
import { getDictDetail } from '@/api/person/dict'
import Detail from './components/Detail'

export default {
  name: 'Xxx',
  components: {
    Detail
  },
  data() {
    return {
      // 遮罩层
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 表格数据
      dataList: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        bizType: undefined,
        status: undefined
      },
      // 字典数据
      bizTypeOptions: [],
      statusOptions: []
    }
  },
  created() {
    this.getList()
    this.loadDicts()
  },
  methods: {
    /** 加载字典数据 */
    loadDicts() {
      Promise.all([
        getDictDetail('xxx_biz_type'),
        getDictDetail('xxx_status')
      ]).then(([bizTypeRes, statusRes]) => {
        this.bizTypeOptions = bizTypeRes.data || []
        this.statusOptions = statusRes.data || []
      }).catch(err => {
        console.error('加载字典失败:', err)
      })
    },
    /** 查询数据列表 */
    getList() {
      this.loading = true
      listXxx(this.queryParams).then(response => {
        this.dataList = response.data.records
        this.total = response.data.total
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    /** 分页大小改变 */
    handleSizeChange(val) {
      this.queryParams.pageSize = val
      this.getList()
    },
    /** 页码改变 */
    handlePageChange(val) {
      this.queryParams.pageNum = val
      this.getList()
    },
    /** 新增 */
    handleAdd() {
      this.$refs.detail.open()
    },
    /** 查看详情 */
    handleViewDetail(row) {
      this.$refs.detail.show(row.id)
    },
    /** 编辑 */
    handleEdit(row) {
      this.$refs.detail.open(row.id)
    },
    /** 删除 */
    handleDelete(row) {
      this.$modal.confirm('是否确认删除？').then(() => {
        return deleteXxx(row.id)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    /** 获取状态类型 */
    getStatusType(status) {
      const statusMap = {
        '0': 'info',
        '1': 'success',
        '2': 'warning',
        '3': 'danger'
      }
      return statusMap[status] || 'info'
    },
    /** 获取状态文本 */
    getStatusText(status) {
      const item = this.statusOptions.find(opt => opt.dictValue === status)
      return item ? item.dictLabel : status
    },
    /** 获取业务类型文本 */
    getBizTypeText(bizType) {
      const item = this.bizTypeOptions.find(opt => opt.dictValue === bizType)
      return item ? item.dictLabel : bizType
    }
  }
}
</script>

<style scoped>
/* ========== 页面基础布局 ========== */
.xxx-page {
  padding: 16px;
  background: #f5f7fa;
}

/* ========== 主内容卡片 ========== */
.content-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

/* ========== 搜索区域 ========== */
.search-section {
  padding: 12px 16px;
  background: #fafbfc;
  border-radius: 6px;
  margin-bottom: 12px;
  border: 1px solid #e8ecef;
}

.search-section >>> .el-form-item {
  margin-bottom: 0;
}

.search-section >>> .el-input, 
.search-section >>> .el-select {
  width: 120px;
}

.search-section >>> .el-input__inner,
.search-section >>> .el-select__input {
  height: 28px;
  line-height: 28px;
}

/* ========== 工具栏 ========== */
.toolbar-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e8ecef;
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

/* ========== 数据表格 ========== */
.data-table {
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e8ecef;
  font-size: 13px;
}

.data-table::before {
  display: none;
}

.data-table >>> .el-table__header th {
  background-color: #fafbfc !important;
  color: #4a5568;
  font-weight: 600;
  font-size: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #e8ecef;
}

.data-table >>> .el-table__row:hover td {
  background-color: #f0f9ff !important;
}

.data-table >>> .el-table__row td {
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.data-table >>> .el-table__header th:first-child,
.data-table >>> .el-table__row td:first-child {
  padding-left: 8px;
}

.data-table >>> .el-table__header th:last-child,
.data-table >>> .el-table__row td:last-child {
  padding-right: 8px;
}

/* ========== 业务类型标签 ========== */
.biz-type-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.biz-electricity {
  background: #dbeafe;
  color: #1d4ed8;
}

.biz-stock {
  background: #dcfce7;
  color: #15803d;
}

/* ========== 时间文本 ========== */
.time-text {
  color: #6b7280;
  font-size: 12px;
}

/* ========== 删除按钮 ========== */
.btn-delete {
  color: #ef4444;
}

.btn-delete:hover {
  color: #dc2626;
}

/* ========== 分页 ========== */
.pagination-wrapper {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.pagination-wrapper >>> .el-pagination {
  font-size: 13px;
  padding: 0;
}

.pagination-wrapper >>> .el-pagination .el-pagination__total {
  margin-right: 8px;
}

.pagination-wrapper >>> .el-pagination .btn-prev,
.pagination-wrapper >>> .el-pagination .btn-next {
  padding: 0 6px;
  min-width: 28px;
  height: 28px;
  line-height: 28px;
}

.pagination-wrapper >>> .el-pagination .el-pager li {
  min-width: 28px;
  height: 28px;
  line-height: 28px;
  font-size: 13px;
  margin: 0 2px;
}

.pagination-wrapper >>> .el-pagination.is-background .el-pager li:not(.disabled).is-active {
  background: #3b82f6;
  border-radius: 4px;
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .toolbar-section {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .toolbar-left {
    flex-wrap: wrap;
  }
}
</style>
