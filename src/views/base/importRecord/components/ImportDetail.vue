<template>
  <el-dialog title="导入详情" :visible.sync="visible" width="1200px" append-to-body @close="handleClose">
    <!-- 导入记录信息 -->
    <el-descriptions :column="3" border class="mb20">
      <el-descriptions-item label="导入ID">{{ detailData.importId }}</el-descriptions-item>
      <el-descriptions-item label="文件ID">{{ detailData.fileId }}</el-descriptions-item>
      <el-descriptions-item label="用户ID">{{ detailData.userId }}</el-descriptions-item>
      <el-descriptions-item label="数据类型">{{ getAssetTypeText(detailData.assetType) }}</el-descriptions-item>
      <el-descriptions-item label="总行数">{{ detailData.totalRows }}</el-descriptions-item>
      <el-descriptions-item label="成功行数">
        <span style="color: #67C23A">{{ detailData.successRows }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="失败行数">
        <span style="color: #F56C6C">{{ detailData.failRows }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="成功率">{{ detailData.successRate }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="getStatusType(detailData.status)">
          {{ getStatusText(detailData.status) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ parseTime(detailData.createTime) }}</el-descriptions-item>
      <el-descriptions-item label="错误信息" :span="3" v-if="detailData.errorMsg">
        <span style="color: #F56C6C">{{ detailData.errorMsg }}</span>
      </el-descriptions-item>
    </el-descriptions>

    <!-- 导入明细搜索 -->
    <el-form :model="detailQueryParams" ref="detailQueryForm" size="small" :inline="true" label-width="80px" class="mb8">
      <el-form-item label="业务状态" prop="businessStatus">
        <el-select v-model="detailQueryParams.businessStatus" placeholder="请选择业务状态" clearable>
          <el-option label="待处理" value="0" />
          <el-option label="处理中" value="1" />
          <el-option label="成功" value="2" />
          <el-option label="失败" value="3" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleDetailQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetDetailQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 导入明细表格 -->
    <el-table v-loading="detailLoading" :data="detailList" border max-height="500">
      <el-table-column label="明细ID" align="center" prop="detailId" width="100" />
      <el-table-column label="行号" align="center" prop="rowIndex" width="80" />
      <el-table-column label="原始数据" align="center" prop="rawData" width="300">
        <template slot-scope="scope">
          <pre style="margin: 0; text-align: left;">{{ JSON.stringify(scope.row.rawData, null, 2) }}</pre>
        </template>
      </el-table-column>
      <el-table-column label="业务状态" align="center" prop="businessStatus" width="120">
        <template slot-scope="scope">
          <el-tag :type="getBusinessStatusType(scope.row.businessStatus)">
            {{ getBusinessStatusText(scope.row.businessStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="业务错误" align="center" prop="businessError" :show-overflow-tooltip="true" />
      <el-table-column label="处理后数据" align="center" prop="processedData" width="300">
        <template slot-scope="scope">
          <pre style="margin: 0; text-align: left;">{{ JSON.stringify(scope.row.processedData, null, 2) }}</pre>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 明细分页 -->
    <pagination
      v-show="detailTotal > 0"
      :total="detailTotal"
      :page.sync="detailQueryParams.pageNum"
      :limit.sync="detailQueryParams.pageSize"
      @pagination="getDetailList"
    />

    <div slot="footer" class="dialog-footer">
      <el-button @click="visible = false">关 闭</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { getImportRecord, listImportDetail } from '@/api/file/importRecord'

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
        pageNum: 1,
        pageSize: 10,
        businessStatus: undefined
      }
    }
  },
  methods: {
    /** 显示弹窗 */
    show(importId) {
      this.importId = importId
      this.visible = true
      this.getRecordDetail()
      this.getDetailList()
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
      listImportDetail(this.importId, this.detailQueryParams).then(response => {
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
    /** 关闭弹窗 */
    handleClose() {
      this.importId = null
      this.detailData = {}
      this.detailList = []
      this.detailTotal = 0
      this.detailQueryParams = {
        pageNum: 1,
        pageSize: 10,
        businessStatus: undefined
      }
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
    /** 获取业务状态类型 */
    getBusinessStatusType(status) {
      const statusMap = {
        '0': 'info',
        '1': 'warning',
        '2': 'success',
        '3': 'danger'
      }
      return statusMap[status] || 'info'
    },
    /** 获取业务状态文本 */
    getBusinessStatusText(status) {
      const statusMap = {
        '0': '待处理',
        '1': '处理中',
        '2': '成功',
        '3': '失败'
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
.mb20 {
  margin-bottom: 20px;
}
.mb8 {
  margin-bottom: 8px;
}
</style>
