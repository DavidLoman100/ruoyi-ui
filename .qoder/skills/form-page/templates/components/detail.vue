<template>
  <el-dialog 
    :title="dialogTitle" 
    :visible.sync="visible" 
    width="900px" 
    append-to-body 
    @close="handleClose"
    class="detail-dialog"
    :close-on-click-modal="false">
    
    <!-- 搜索区域 -->
    <div class="search-section" v-if="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true">
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择" clearable style="width: 120px">
            <el-option v-for="item in statusOptions" :key="item.dictValue" :label="item.dictLabel" :value="item.dictValue" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleQuery">查询</el-button>
          <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="dataList" border max-height="350" class="detail-table">
      <el-table-column label="序号" type="index" width="55" align="center">
        <template slot-scope="{$index}">
          <span class="index-badge">{{ (queryParams.pageNum - 1) * queryParams.pageSize + $index + 1 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="名称" align="left" prop="name" min-width="150" :show-overflow-tooltip="true" />
      <el-table-column label="类型" align="center" prop="type" width="80">
        <template slot-scope="scope">
          <span class="type-tag">{{ scope.row.type || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="大小" align="center" prop="size" width="90">
        <template slot-scope="scope">
          <span class="size-text">{{ formatFileSize(scope.row.size) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template slot-scope="scope">
          <el-tag :type="getStatusType(scope.row.status)" size="small" effect="plain" class="status-tag">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="left" prop="remark" :show-overflow-tooltip="true" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="140">
        <template slot-scope="scope">
          <span class="time-text">{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="100" v-if="showActions">
        <template slot-scope="scope">
          <el-button size="small" type="text" icon="el-icon-download" @click="handleDownload(scope.row)" class="action-btn">下载</el-button>
          <el-button size="small" type="text" icon="el-icon-edit" @click="handleEdit(scope.row)" class="action-btn">编辑</el-button>
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
  </el-dialog>
</template>

<script>
import { getXxx, listXxxDetail } from '@/api/xxx/xxx'
import { getDictDetail } from '@/api/person/dict'

export default {
  name: 'XxxDetail',
  props: {
    // 是否显示搜索区域
    showSearch: {
      type: Boolean,
      default: true
    },
    // 是否显示操作列
    showActions: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      // 弹窗显示状态
      visible: false,
      // 弹窗标题
      dialogTitle: '详情',
      // 当前记录ID
      currentId: null,
      // 详情数据
      detailData: {},
      // 遮罩层
      loading: false,
      // 总条数
      total: 0,
      // 表格数据
      dataList: [],
      // 查询参数
      queryParams: {
        id: null,
        pageNum: 1,
        pageSize: 10,
        status: undefined
      },
      // 字典数据
      statusOptions: []
    }
  },
  methods: {
    /** 显示弹窗（查看详情模式） */
    show(id) {
      this.currentId = id
      this.dialogTitle = '详情'
      this.visible = true
      this.queryParams.id = id
      this.getDetail()
      this.getList()
      this.loadDicts()
    },
    /** 打开弹窗（新增/编辑模式） */
    open(id) {
      this.currentId = id
      this.dialogTitle = id ? '编辑' : '新增'
      this.visible = true
      if (id) {
        this.getDetail()
      }
      this.loadDicts()
    },
    /** 加载字典数据 */
    loadDicts() {
      getDictDetail('xxx_status').then(response => {
        this.statusOptions = response.data || []
      }).catch(err => {
        console.error('加载字典失败:', err)
      })
    },
    /** 查询详情 */
    getDetail() {
      getXxx(this.currentId).then(response => {
        this.detailData = response.data
      })
    },
    /** 查询列表 */
    getList() {
      this.loading = true
      listXxxDetail(this.queryParams).then(response => {
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
    /** 编辑 */
    handleEdit(row) {
      this.$emit('edit', row)
    },
    /** 下载 */
    handleDownload(row) {
      const fileUrl = row.ossHost + '/' + row.filePath
      window.open(fileUrl, '_blank')
    },
    /** 关闭弹窗 */
    handleClose() {
      this.currentId = null
      this.detailData = {}
      this.dataList = []
      this.total = 0
      this.queryParams = {
        id: null,
        pageNum: 1,
        pageSize: 10,
        status: undefined
      }
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
    /** 格式化文件大小 */
    formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
    }
  }
}
</script>

<style scoped>
/* ========== 对话框样式 ========== */
.detail-dialog >>> .el-dialog__header {
  padding: 14px 20px;
  background: #fafbfc;
  border-bottom: 1px solid #e8ecef;
}

.detail-dialog >>> .el-dialog__title {
  color: #1f2937;
  font-weight: 600;
  font-size: 15px;
}

.detail-dialog >>> .el-dialog__body {
  padding: 16px 20px;
}

/* ========== 搜索区域 ========== */
.search-section {
  padding: 10px 16px;
  background: #fafbfc;
  border-radius: 6px;
  margin-bottom: 12px;
  border: 1px solid #e8ecef;
}

.search-section >>> .el-form-item {
  margin-bottom: 0;
}

.search-section >>> .el-select {
  width: 120px;
}

.search-section >>> .el-button {
  padding: 5px 12px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 6px;
}

.search-section >>> .el-button--primary {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}

.search-section >>> .el-button {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #6b7280;
}

/* ========== 数据表格 ========== */
.detail-table {
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e8ecef;
  font-size: 13px;
}

.detail-table >>> .el-table__header th {
  background-color: #fafbfc !important;
  color: #4a5568;
  font-weight: 600;
  font-size: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #e8ecef;
}

.detail-table >>> .el-table__row:hover td {
  background-color: #f0f9ff !important;
}

.detail-table >>> .el-table__row td {
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.detail-table >>> .el-table__header th:first-child,
.detail-table >>> .el-table__row td:first-child {
  padding-left: 8px;
}

.detail-table >>> .el-table__header th:last-child,
.detail-table >>> .el-table__row td:last-child {
  padding-right: 8px;
}

/* ========== 序号徽章 ========== */
.index-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: #e8ecef;
  color: #6b7280;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

/* ========== 类型标签 ========== */
.type-tag {
  padding: 2px 6px;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 4px;
  font-size: 12px;
}

/* ========== 大小文本 ========== */
.size-text {
  color: #6b7280;
  font-size: 12px;
}

/* ========== 状态标签 ========== */
.status-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

/* ========== 时间文本 ========== */
.time-text {
  color: #6b7280;
  font-size: 12px;
}

/* ========== 操作按钮 ========== */
.action-btn {
  padding: 4px 8px;
  font-size: 12px;
  color: #3b82f6;
}

.action-btn:hover {
  color: #2563eb;
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

.pagination-wrapper >>> .el-pagination .btn-prev,
.pagination-wrapper >>> .el-pagination .btn-next {
  padding: 0 4px;
  min-width: 26px;
  height: 26px;
  line-height: 26px;
}

.pagination-wrapper >>> .el-pagination .el-pager li {
  min-width: 26px;
  height: 26px;
  line-height: 26px;
  font-size: 12px;
  margin: 0 1px;
}

.pagination-wrapper >>> .el-pagination.is-background .el-pager li:not(.disabled).is-active {
  background: #3b82f6;
  border-radius: 4px;
}
</style>
