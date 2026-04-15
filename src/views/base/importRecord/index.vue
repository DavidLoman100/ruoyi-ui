<template>
  <div class="import-record-page">
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
          <el-button type="warning" plain icon="el-icon-upload2" size="small" @click="handleUpload">
            <i class="el-icon-upload2"></i> 上传文件
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-button circle icon="el-icon-refresh" @click="getList"></el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="recordList" border class="data-table">
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
        <el-table-column label="错误信息" align="left" prop="errorMsg" :show-overflow-tooltip="true" />
        <el-table-column label="创建者" align="center" prop="createBy" width="100" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="160">
          <template slot-scope="scope">
            <span class="time-text">{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="80">
          <template slot-scope="scope">
            <el-button size="small" type="text" icon="el-icon-view" @click="handleViewDetail(scope.row)">详情</el-button>
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

    <!-- 导入详情弹窗 -->
    <import-detail ref="importDetail" />

    <!-- 上传文件弹窗 -->
    <el-dialog title="上传导入文件" :visible.sync="uploadDialogVisible" width="500px" append-to-body 
      class="upload-dialog" :close-on-click-modal="false">
      <div class="upload-content">
        <el-steps :active="uploadStep" finish-status="success" simple class="upload-steps">
          <el-step title="选择文件"></el-step>
          <el-step title="上传处理"></el-step>
          <el-step title="完成"></el-step>
        </el-steps>

        <div class="upload-area-wrapper">
          <el-form :model="uploadForm" ref="uploadForm" label-position="top" class="upload-form">
            <el-form-item label="业务类型" prop="bizType" :rules="[{ required: true, message: '请选择业务类型', trigger: 'change' }]">
              <el-select v-model="uploadForm.bizType" placeholder="请选择业务类型" style="width: 100%">
                <el-option v-for="item in bizTypeOptions" :key="item.dictValue" :label="item.dictLabel" :value="item.dictValue" />
              </el-select>
            </el-form-item>
            <el-form-item label="选择文件" prop="fileList" :rules="[{ required: true, message: '请选择文件', trigger: 'change' }]">
              <el-upload
                ref="upload"
                :action="ossUploadUrl"
                :headers="ossUploadHeaders"
                :data="ossUploadData"
                :on-success="handleOssUploadSuccess"
                :on-error="handleOssUploadError"
                :before-upload="beforeUpload"
                :on-change="handleFileChange"
                :on-remove="handleFileRemove"
                :auto-upload="false"
                :limit="1"
                :file-list="uploadForm.fileList"
                accept=".xlsx,.xls,.csv"
                class="upload-area"
              >
                <div class="upload-drag-wrapper">
                  <i class="el-icon-upload"></i>
                  <p class="upload-title">点击上传或拖拽文件到此处</p>
                  <p class="upload-hint">支持 .xlsx、.xls、.csv 格式，单个文件不超过 10MB</p>
                </div>
              </el-upload>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpload" :loading="uploadLoading">
          {{ uploadLoading ? '上传中...' : '开始上传' }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listImportRecord, getOssSignWithCache } from '@/api/file/importRecord'
import { getDictDetail } from '@/api/person/dict'
import ImportDetail from './components/ImportDetail'

export default {
  name: 'ImportRecord',
  components: {
    ImportDetail
  },
  data() {
    return {
      // 遮罩层
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 导入记录表格数据
      recordList: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        bizType: undefined,
        status: undefined,
        userId: undefined
      },
      // 上传对话框
      uploadDialogVisible: false,
      // 上传步骤
      uploadStep: 0,
      // 上传加载状态
      uploadLoading: false,
      // 上传表单
      uploadForm: {
        bizType: undefined,
        fileList: []
      },
      // OSS上传配置
      ossUploadUrl: '',
      ossUploadHeaders: {},
      ossUploadData: {},
      ossFileKey: '',
      // 字典数据
      bizTypeOptions: [],
      statusOptions: []
    }
  },
  created() {
    this.loadDicts()
    this.getList()
  },
  methods: {
    /** 加载字典数据 */
    loadDicts() {
      // 并行加载业务类型和状态字典
      Promise.all([
        getDictDetail('import_biz_type'),
        getDictDetail('import_status')
      ]).then(([bizTypeRes, statusRes]) => {
        this.bizTypeOptions = bizTypeRes.data || []
        this.statusOptions = statusRes.data || []
      }).catch(err => {
        console.error('加载字典失败:', err)
      })
    },
    /** 查询导入记录列表 */
    getList() {
      this.loading = true
      listImportRecord(this.queryParams).then(response => {
        this.recordList = response.data.records
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
    /** 查看详情 */
    handleViewDetail(row) {
      this.$refs.importDetail.show(row.importId)
    },
    /** 上传文件 */
    handleUpload() {
      this.uploadDialogVisible = true
      this.uploadStep = 0
      this.uploadForm = {
        bizType: undefined,
        fileList: []
      }
      this.ossUploadUrl = ''
      this.ossUploadHeaders = {}
      this.ossUploadData = {}
      this.ossFileKey = ''
      
      // 打开弹窗时预加载签名（提升用户体验）
      this.preloadOssSign()
    },
    /** 预加载OSS签名 */
    preloadOssSign() {
      // 使用默认业务类型预加载，或者直接检查缓存
      // 如果缓存已存在，无需重复请求
      // 如果缓存不存在或已过期，提前请求
      const { getOssSignWithCache } = require('@/api/file/importRecord')
      
      // 尝试获取签名（如果缓存有效则使用缓存，否则请求新的）
      getOssSignWithCache('electricity').then(signData => {
        console.log('[预加载] OSS签名已准备:', signData)
      }).catch(error => {
        // 预加载失败不提示用户，等点击确定时再提示
        console.warn('[预加载] OSS签名预加载失败:', error)
      })
    },
    /** 文件选择变化 */
    handleFileChange(file, fileList) {
      this.uploadForm.fileList = fileList
    },
    /** 文件移除 */
    handleFileRemove(file, fileList) {
      this.uploadForm.fileList = fileList
    },
    /** 上传前校验 */
    beforeUpload(file) {
      const isLt10M = file.size / 1024 / 1024 < 10
      if (!isLt10M) {
        this.$modal.msgError('上传文件大小不能超过 10MB!')
        return false
      }
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                      file.type === 'application/vnd.ms-excel' ||
                      file.type === 'text/csv'
      if (!isExcel) {
        this.$modal.msgError('只能上传 Excel 或 CSV 文件!')
        return false
      }
      return true
    },
    /** 提交上传 */
    submitUpload() {
      this.$refs.uploadForm.validate(valid => {
        if (valid) {
          if (this.uploadForm.fileList.length === 0) {
            this.$modal.msgError('请先选择文件')
            return
          }
          
          this.uploadLoading = true
          
          // 双重检测：点击确定时再次获取签名（确保签名有效）
          // 如果预加载已完成，这里会使用缓存，速度很快
          // 如果预加载失败或缓存过期，这里会重新获取
          getOssSignWithCache(this.uploadForm.bizType).then(signData => {
            // 打印调试信息，查看后端返回的数据结构
            console.log('OSS签名数据:', signData)
            
            // 2. 配置OSS上传信息
            // 确保URL格式正确，去掉末尾的斜杠
            let uploadUrl = signData.host || signData.url || ''
            if (uploadUrl.endsWith('/')) {
              uploadUrl = uploadUrl.slice(0, -1)
            }
            this.ossUploadUrl = uploadUrl
            this.ossUploadHeaders = signData.headers || {}
            
            console.log('上传URL:', this.ossUploadUrl)
            
            // 生成完整的文件路径：dir + uuid + ext
            // 重要：objectKey中的文件名必须使用UUID，禁止使用原始文件名（避免中文编码问题和同名覆盖）
            const originalFileName = this.uploadForm.fileList[0].name
            const ext = originalFileName.substring(originalFileName.lastIndexOf('.')) // 文件后缀，如 .xlsx
            const uuid = this.generateUUID()
            const dir = signData.dir || signData.prefix || ''
            const fileKey = dir + uuid + ext  // 如：uploads/stock/20260413/a1b2c3d4.xlsx
            
            // 按照文档规范组装表单数据
            // 文档定义：{accessId, policy, signature, dir, host, expire}
            this.ossUploadData = {
              key: fileKey,
              OSSAccessKeyId: signData.accessId,  // 文档中的字段名是 accessId
              policy: signData.policy,
              signature: signData.signature,
              success_action_status: '200'
            }
            
            this.ossFileKey = fileKey
            
            console.log('OSS上传配置:', {
              url: this.ossUploadUrl,
              headers: this.ossUploadHeaders,
              data: this.ossUploadData,
              key: this.ossFileKey
            })
            
            // 3. 执行OSS上传
            this.uploadStep = 1
            this.$nextTick(() => {
              this.$refs.upload.submit()
            })
          }).catch(error => {
            console.error('获取OSS签名错误:', error)
            this.$modal.msgError('获取上传签名失败')
            this.uploadLoading = false
          })
        }
      })
    },
    /** OSS上传成功回调 */
    handleOssUploadSuccess(response, file, fileList) {
      // OSS上传成功后，构建文件完整URL
      // 如果ossFileKey包含完整路径，直接使用；否则拼接
      let fileUrl = ''
      if (this.ossFileKey) {
        // 判断ossUploadUrl是否已经包含bucket域名
        if (this.ossUploadUrl.startsWith('http')) {
          fileUrl = this.ossUploadUrl + '/' + this.ossFileKey
        } else {
          // ossUploadUrl是bucket名称，需要拼接完整域名
          fileUrl = `https://dv-gulimall.oss-cn-shenzhen.aliyuncs.com/${this.ossFileKey}`
        }
      }
      
      import('@/api/file/importRecord').then(module => {
        module.createImportRecord({
          bizType: this.uploadForm.bizType,
          objectKey: this.ossFileKey,  // OSS上的完整路径（含UUID文件名）
          fileName: this.uploadForm.fileList[0].name  // 用户选择的原始文件名
        }).then(response => {
          if (response.code === 200) {
            this.uploadStep = 2
            this.$modal.msgSuccess('文件上传成功')
            setTimeout(() => {
              this.uploadDialogVisible = false
              this.uploadLoading = false
              this.uploadStep = 0
              this.getList()
            }, 1500)
          } else {
            this.$modal.msgError(response.message || '创建导入记录失败')
            this.uploadLoading = false
          }
        }).catch(error => {
          this.$modal.msgError('创建导入记录失败')
          this.uploadLoading = false
        })
      })
    },
    /** OSS上传失败回调 */
    handleOssUploadError(err, file, fileList) {
      this.$modal.msgError('文件上传到OSS失败')
      this.uploadLoading = false
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
      const item = this.statusOptions.find(opt => opt.dictValue === status)
      return item ? item.dictLabel : status
    },
    /** 生成UUID */
    generateUUID() {
      // 生成不带横杠的UUID
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      }).replace(/-/g, '')
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
.import-record-page {
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

.search-item .el-form-item {
  margin-bottom: 0;
}

.search-item .el-form-item__label {
  font-weight: 500;
  color: #4a5568;
  padding: 0 8px 0 0;
  line-height: 32px;
}

.search-item .el-form-item__content {
  line-height: 32px;
}

.select-custom {
  width: 120px;
}

.search-actions {
  margin-left: 8px;
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

.btn-search,
.btn-reset {
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 13px;
}

.btn-search {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}

.btn-reset {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #6b7280;
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

.btn-action {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-icon-only {
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 4px;
  border: 1px solid #e8ecef;
  color: #6b7280;
  background: #fff;
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

.index-cell {
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

.creator-text {
  color: #6b7280;
  font-size: 12px;
}

.time-text {
  color: #6b7280;
  font-size: 12px;
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

.pagination-wrapper >>> .el-pagination__sizes {
  margin: 0 8px 0 0;
}

.pagination-wrapper >>> .el-pagination__jump {
  margin-left: 8px;
}

/* ========== 上传对话框 ========== */
.upload-dialog >>> .el-dialog__header {
  padding: 16px 20px;
  background: #fafbfc;
  border-bottom: 1px solid #e8ecef;
}

.upload-dialog >>> .el-dialog__title {
  color: #1f2937;
  font-weight: 600;
  font-size: 15px;
}

.upload-dialog >>> .el-dialog__body {
  padding: 20px;
}

.upload-steps {
  margin-bottom: 16px;
  padding: 8px 16px;
  background: #fafbfc;
  border-radius: 6px;
  font-size: 13px;
}

.upload-form >>> .el-form-item {
  margin-bottom: 12px;
}

.upload-form >>> .el-form-item__label {
  font-weight: 500;
  color: #4a5568;
  padding-bottom: 4px !important;
  font-size: 13px;
}

.upload-form >>> .el-select {
  width: 100%;
}

.upload-area {
  width: 100%;
}

.upload-area >>> .el-upload {
  width: 100%;
}

.upload-area >>> .el-upload-dragger {
  width: 100%;
  height: 100px;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  background: #fafbfc;
}

.upload-area >>> .el-upload-dragger:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.upload-drag-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.upload-drag-wrapper i {
  font-size: 24px;
  color: #94a3b8;
  margin-bottom: 6px;
}

.upload-title {
  margin: 0 0 4px 0;
  font-size: 13px;
  font-weight: 500;
  color: #4a5568;
}

.upload-hint {
  margin: 0;
  font-size: 11px;
  color: #9ca3af;
}

.dialog-footer {
  padding: 12px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel,
.btn-confirm {
  padding: 8px 18px;
  border-radius: 4px;
  font-size: 13px;
}

.btn-confirm {
  background: #3b82f6;
  border: none;
  color: #fff;
}

.btn-confirm:hover {
  background: #2563eb;
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
