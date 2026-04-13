<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="数据类型" prop="dataType">
        <el-select v-model="queryParams.dataType" placeholder="请选择数据类型" clearable>
          <el-option label="股票" value="stock" />
          <el-option label="基金" value="fund" />
          <el-option label="默认" value="default" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option label="待处理" value="0" />
          <el-option label="处理中" value="1" />
          <el-option label="成功" value="2" />
          <el-option label="失败" value="3" />
          <el-option label="部分成功" value="4" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮区域 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-upload2"
          size="mini"
          @click="handleUpload"
        >上传文件</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-refresh"
          size="mini"
          @click="getList"
        >刷新</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="recordList" border>
      <el-table-column label="导入ID" align="center" prop="importId" width="100" />
      <el-table-column label="文件ID" align="center" prop="fileId" width="100" />
      <el-table-column label="用户ID" align="center" prop="userId" width="100" />
      <el-table-column label="数据类型" align="center" prop="assetType" width="120">
        <template slot-scope="scope">
          <span>{{ getAssetTypeText(scope.row.assetType) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="总行数" align="center" prop="totalRows" width="100" />
      <el-table-column label="成功行数" align="center" prop="successRows" width="100">
        <template slot-scope="scope">
          <span style="color: #67C23A">{{ scope.row.successRows }}</span>
        </template>
      </el-table-column>
      <el-table-column label="失败行数" align="center" prop="failRows" width="100">
        <template slot-scope="scope">
          <span style="color: #F56C6C">{{ scope.row.failRows }}</span>
        </template>
      </el-table-column>
      <el-table-column label="成功率" align="center" prop="successRate" width="100" />
      <el-table-column label="状态" align="center" prop="status" width="120">
        <template slot-scope="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="错误信息" align="center" prop="errorMsg" :show-overflow-tooltip="true" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="150">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleViewDetail(scope.row)"
          >查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 导入详情弹窗 -->
    <import-detail ref="importDetail" />

    <!-- 上传文件弹窗 -->
    <el-dialog title="上传导入文件" :visible.sync="uploadDialogVisible" width="500px" append-to-body>
      <el-form ref="uploadForm" :model="uploadForm" label-width="100px">
        <el-form-item label="数据类型" prop="dataType" :rules="[{ required: true, message: '请选择数据类型', trigger: 'change' }]">
          <el-select v-model="uploadForm.dataType" placeholder="请选择数据类型" style="width: 100%">
            <el-option label="股票" value="stock" />
            <el-option label="基金" value="fund" />
            <el-option label="默认" value="default" />
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
          >
            <el-button size="small" type="primary">选择文件</el-button>
            <div slot="tip" class="el-upload__tip">只能上传xlsx/xls/csv文件，且不超过10MB</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitUpload" :loading="uploadLoading">确 定</el-button>
        <el-button @click="uploadDialogVisible = false">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listImportRecord } from '@/api/file/importRecord'
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
        dataType: undefined,
        status: undefined,
        userId: undefined
      },
      // 上传对话框
      uploadDialogVisible: false,
      // 上传加载状态
      uploadLoading: false,
      // 上传表单
      uploadForm: {
        dataType: undefined,
        fileList: []
      },
      // OSS上传配置
      ossUploadUrl: '',
      ossUploadHeaders: {},
      ossUploadData: {},
      ossFileKey: ''
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询导入记录列表 */
    getList() {
      this.loading = true
      listImportRecord(this.queryParams).then(response => {
        this.recordList = response.data.records
        this.total = response.data.total
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
    /** 查看详情 */
    handleViewDetail(row) {
      this.$refs.importDetail.show(row.importId)
    },
    /** 上传文件 */
    handleUpload() {
      this.uploadDialogVisible = true
      this.uploadForm = {
        dataType: undefined,
        fileList: []
      }
      this.ossUploadUrl = ''
      this.ossUploadHeaders = {}
      this.ossUploadData = {}
      this.ossFileKey = ''
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
          
          // 1. 先获取OSS上传签名
          import('@/api/file/importRecord').then(module => {
            module.getOssSign(this.uploadForm.dataType).then(response => {
              if (response.code === 200 && response.data) {
                const signData = response.data
                
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
                
                // 生成完整的文件路径：dir + filename
                const fileName = this.uploadForm.fileList[0].name
                const dir = signData.dir || signData.prefix || ''
                const fileKey = dir + fileName
                
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
                this.$nextTick(() => {
                  this.$refs.upload.submit()
                })
              } else {
                this.$modal.msgError(response.message || '获取上传签名失败')
                this.uploadLoading = false
              }
            }).catch(error => {
              console.error('获取OSS签名错误:', error)
              this.$modal.msgError('获取上传签名失败')
              this.uploadLoading = false
            })
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
          fileUrl: fileUrl,
          dataType: this.uploadForm.dataType
        }).then(response => {
          if (response.code === 200) {
            this.$modal.msgSuccess('文件上传成功')
            this.uploadDialogVisible = false
            this.uploadLoading = false
            this.getList()
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
        '0': 'info',
        '1': 'warning',
        '2': 'success',
        '3': 'danger',
        '4': 'warning'
      }
      return statusMap[status] || 'info'
    },
    /** 获取状态文本 */
    getStatusText(status) {
      const statusMap = {
        '0': '待处理',
        '1': '处理中',
        '2': '成功',
        '3': '失败',
        '4': '部分成功'
      }
      return statusMap[status] || status
    },
    /** 获取数据类型文本 */
    getAssetTypeText(assetType) {
      const typeMap = {
        'stock': '股票',
        'fund': '基金',
        'default': '默认'
      }
      return typeMap[assetType] || assetType
    }
  }
}
</script>

<style scoped>
</style>
