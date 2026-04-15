<template>
  <el-dialog title="导入详情" :visible.sync="visible" width="1000px" append-to-body @close="handleClose" class="detail-dialog">
    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="detailQueryParams" ref="detailQueryForm" size="small" :inline="true">
        <el-form-item label="状态" prop="status">
          <el-select v-model="detailQueryParams.status" placeholder="请选择" clearable style="width: 120px">
            <el-option v-for="item in statusOptions" :key="item.dictValue" :label="item.dictLabel" :value="item.dictValue" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleDetailQuery">查询</el-button>
          <el-button icon="el-icon-refresh" @click="resetDetailQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <el-table v-loading="detailLoading" :data="detailList" border max-height="350" class="detail-table">
      <el-table-column label="序号" type="index" width="55" align="center">
        <template slot-scope="{$index}">
          <span class="index-badge">{{ (detailQueryParams.pageNum - 1) * detailQueryParams.pageSize + $index + 1 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="文件名" align="left" prop="fileName" min-width="180" :show-overflow-tooltip="true">
        <template slot-scope="scope">
          <div class="file-name-cell">
            <i class="el-icon-document"></i>
            <span>{{ scope.row.fileName }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="类型" align="center" prop="fileType" width="80">
        <template slot-scope="scope">
          <span class="type-tag">{{ scope.row.fileType || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="大小" align="center" prop="fileSize" width="90">
        <template slot-scope="scope">
          <span class="size-text">{{ formatFileSize(scope.row.fileSize) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template slot-scope="scope">
          <el-tag :type="getFileStatusType(scope.row.status)" size="small" effect="plain" class="status-tag">
            {{ getFileStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="错误信息" align="left" prop="errorMsg" :show-overflow-tooltip="true">
        <template slot-scope="scope">
          <span v-if="scope.row.errorMsg" class="error-text">{{ scope.row.errorMsg }}</span>
          <span v-else class="empty-text">-</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="140">
        <template slot-scope="scope">
          <span class="time-text">{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="70">
        <template slot-scope="scope">
          <el-button size="small" type="text" icon="el-icon-download" @click="handleDownload(scope.row)" class="download-btn">下载</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination 
        :background="true" 
        :current-page="detailQueryParams.pageNum" 
        :page-size="detailQueryParams.pageSize"
        :page-sizes="[10, 20, 50, 100]" 
        :total="detailTotal" 
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleDetailSizeChange" 
        @current-change="handleDetailPageChange" />
    </div>
  </el-dialog>
</template>

<script>
import { getImportRecord, listImportDetail } from '@/api/file/importRecord'
import { getDictDetail } from '@/api/person/dict'

export default {
  name: 'ImportDetail',
  data() {
    return {
      // 弹窗显示状态
      visible: false,
      // 导入记录ID
      importId: null,
      // 导入记录详情
      detailData: {},
      // 明细遮罩层
      detailLoading: false,
      // 明细总条数
      detailTotal: 0,
      // 导入明细表格数据
      detailList: [],
      // 明细查询参数
      detailQueryParams: {
        importId: null,
        pageNum: 1,
        pageSize: 10,
        status: undefined
      },
      // 字典数据
      statusOptions: []
    }
  },
  methods: {
    /** 显示弹窗 */
    show(importId) {
      this.importId = importId
      this.visible = true
      this.detailQueryParams.importId = importId
      this.loadDicts()
      this.getRecordDetail()
      this.getDetailList()
    },
    /** 加载字典数据 */
    loadDicts() {
      getDictDetail('import_file_status').then(response => {
        this.statusOptions = response.data || []
      }).catch(err => {
        console.error('加载字典失败:', err)
      })
    },
    /** 查询导入记录详情 */
    getRecordDetail() {
      getImportRecord(this.importId).then(response => {
        this.detailData = response.data
      })
    },
    /** 查询导入明细列表 */
    getDetailList() {
      this.detailLoading = true
      listImportDetail(this.detailQueryParams).then(response => {
        this.detailList = response.data.records
        this.detailTotal = response.data.total
        this.detailLoading = false
      })
    },
    /** 明细搜索按钮操作 */
    handleDetailQuery() {
      this.detailQueryParams.pageNum = 1
      this.getDetailList()
    },
    /** 明细重置按钮操作 */
    resetDetailQuery() {
      this.resetForm('detailQueryForm')
      this.handleDetailQuery()
    },
    /** 明细分页大小改变 */
    handleDetailSizeChange(val) {
      this.detailQueryParams.pageSize = val
      this.getDetailList()
    },
    /** 明细页码改变 */
    handleDetailPageChange(val) {
      this.detailQueryParams.pageNum = val
      this.getDetailList()
    },
    /** 关闭弹窗 */
    handleClose() {
      this.importId = null
      this.detailData = {}
      this.detailList = []
      this.detailTotal = 0
      this.detailQueryParams = {
        importId: null,
        pageNum: 1,
        pageSize: 10,
        status: undefined
      }
    },
    /** 获取状态类型 */
    getStatusType(status) {
      const statusMap = {
        'pending': 'info',
        'processing': 'warning',
        'success': 'success',
        'partial_fail': 'danger',
        'fail': 'danger'
      }
      return statusMap[status] || 'info'
    },
    /** 获取状态图标 */
    getStatusIcon(status) {
      const iconMap = {
        'pending': 'el-icon-time',
        'processing': 'el-icon-loading',
        'success': 'el-icon-circle-check',
        'partial_fail': 'el-icon-warning',
        'fail': 'el-icon-circle-close'
      }
      return iconMap[status] || 'el-icon-info'
    },
    /** 获取状态文本 */
    getStatusText(status) {
      const statusMap = {
        'pending': '待处理',
        'processing': '处理中',
        'success': '导入成功',
        'partial_fail': '部分失败',
        'fail': '导入失败'
      }
      return statusMap[status] || status
    },
    /** 获取文件状态类型 */
    getFileStatusType(status) {
      const statusMap = {
        'pending': 'info',
        'processing': 'warning',
        'success': 'success',
        'fail': 'danger'
      }
      return statusMap[status] || 'info'
    },
    /** 获取文件状态图标 */
    getFileStatusIcon(status) {
      const iconMap = {
        'pending': 'el-icon-time',
        'processing': 'el-icon-loading',
        'success': 'el-icon-circle-check',
        'fail': 'el-icon-circle-close'
      }
      return iconMap[status] || 'el-icon-info'
    },
    /** 获取文件状态文本 */
    getFileStatusText(status) {
      const item = this.statusOptions.find(opt => opt.dictValue === status)
      return item ? item.dictLabel : status
    },
    /** 获取业务类型文本 */
    getBizTypeText(bizType) {
      const typeMap = {
        'electricity': '电费',
        'stock': '股票'
      }
      return typeMap[bizType] || bizType
    },
    /** 格式化文件大小 */
    formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
    },
    /** 下载文件 */
    handleDownload(row) {
      // 拼接完整URL: {ossHost}/{filePath}
      // 注意：filePath已包含bucket前缀目录，无需再拼接bucketName
      const fileUrl = row.ossHost + '/' + row.filePath
      window.open(fileUrl, '_blank')
    }
  }
}
</script>

<style scoped>
/* ========== 对话框样式 ========== */
.detail-dialog >>> .el-dialog {
  margin: 5vh auto 0 !important;
}

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

.detail-dialog >>> .el-dialog__footer {
  display: none;
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

.search-section >>> .el-form-item__label {
  font-weight: 500;
  color: #4a5568;
  padding: 0 8px 0 0;
  line-height: 28px;
  font-size: 13px;
}

.search-section >>> .el-form-item__content {
  line-height: 28px;
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

/* 序号徽章 */
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

/* 文件名单元格 */
.file-name-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #374151;
}

.file-name-cell i {
  color: #3b82f6;
  font-size: 14px;
}

/* 类型标签 */
.type-tag {
  padding: 2px 6px;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 4px;
  font-size: 12px;
}

/* 大小文本 */
.size-text {
  color: #6b7280;
  font-size: 12px;
}

/* 状态标签 */
.status-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

/* 错误文本 */
.error-text {
  color: #dc2626;
  font-size: 12px;
}

.empty-text {
  color: #9ca3af;
}

/* 时间文本 */
.time-text {
  color: #6b7280;
  font-size: 12px;
}

/* 下载按钮 */
.download-btn {
  padding: 4px 8px;
  font-size: 12px;
  color: #3b82f6;
}

.download-btn:hover {
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
