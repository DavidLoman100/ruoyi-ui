<template>
  <div class="electricity-page">
    <!-- 页面标题区 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <i class="el-icon-s-data"></i>
          电费管理
        </h2>
        <p class="page-desc">管理日常用电记录与费用统计</p>
      </div>
    </div>

    <!-- 统计卡片区 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card stat-primary">
          <div class="stat-icon">
            <i class="el-icon-document"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">记录总数</span>
            <span class="stat-value">{{ total }}</span>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card stat-success">
          <div class="stat-icon">
            <i class="el-icon-circle-check"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">本月记录</span>
            <span class="stat-value">{{ monthCount }}</span>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card stat-warning">
          <div class="stat-icon">
            <i class="el-icon-warning"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">待处理</span>
            <span class="stat-value">0</span>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card stat-info-card">
          <div class="stat-icon">
            <i class="el-icon-info"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">更新时间</span>
            <span class="stat-value time-value">{{ lastUpdateTime }}</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 主内容卡片 -->
    <div class="content-card">
      <!-- 搜索表单区域 -->
      <div class="search-section">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
          <el-form-item label="日期范围" prop="dateRange" class="search-item">
            <el-date-picker v-model="dateRange" type="daterange" unlink-panels range-separator="至"
              start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd" :picker-options="pickerOptions"
              clearable class="date-picker" />
          </el-form-item>
          <el-form-item class="search-actions">
            <el-button type="primary" icon="el-icon-search" @click="handleQuery" class="btn-search">
              <span>查询</span>
            </el-button>
            <el-button icon="el-icon-refresh" @click="resetQuery" class="btn-reset">
              <span>重置</span>
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 操作按钮区域 -->
      <div class="toolbar-section">
        <div class="toolbar-left">
          <el-button type="primary" plain icon="el-icon-plus" size="medium" @click="handleAdd" class="btn-action">
            <i class="el-icon-plus"></i> 新增
          </el-button>
          <el-button type="success" plain icon="el-icon-edit" size="medium" :disabled="single" @click="handleUpdate"
            class="btn-action">
            <i class="el-icon-edit"></i> 修改
          </el-button>
          <el-button type="warning" plain icon="el-icon-upload2" size="medium" @click="openUploadDialog" class="btn-action">
            <i class="el-icon-upload2"></i> 导入
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-tooltip content="刷新数据" placement="top">
            <el-button circle icon="el-icon-refresh" @click="getList" class="btn-icon-only"></el-button>
          </el-tooltip>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="electricityCostList" @selection-change="handleSelectionChange"
        stripe border class="data-table" :header-cell-style="{ background: '#f8fafc', color: '#475569', fontWeight: '600' }">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="序号" type="index" width="70" align="center">
          <template slot-scope="{$index}">
            <span class="index-badge">{{ (queryParams.pageNum - 1) * queryParams.pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="日期" prop="lifeDate" min-width="120" align="center">
          <template slot-scope="{ row }">
            <div class="date-cell">
              <i class="el-icon-calendar"></i>
              {{ row.lifeDate }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="单价" prop="pricePerKwh" min-width="130" align="right">
          <template slot-scope="{ row }">
            <span class="value-cell money">{{ formatMoney(row.pricePerKwh) }}</span>
            <span class="unit-tag">元/kWh</span>
          </template>
        </el-table-column>
        <el-table-column label="用电量" prop="totalKwh" min-width="130" align="right">
          <template slot-scope="{ row }">
            <span class="value-cell number">{{ formatNumber(row.totalKwh) }}</span>
            <span class="unit-tag">kWh</span>
          </template>
        </el-table-column>
        <el-table-column label="费用" prop="cost" min-width="120" align="right">
          <template slot-scope="{ row }">
            <el-tag type="warning" effect="dark" class="cost-tag">
              <i class="el-icon-coin"></i>
              {{ formatMoney(row.cost) }} 元
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="180" align="left" :show-overflow-tooltip="true">
          <template slot-scope="{ row }">
            <span class="remark-text">{{ row.remark || '-' }}</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <div class="pagination-wrapper">
        <el-pagination :background="true" :current-page="queryParams.pageNum" :page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]" :total="total" layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </div>

    <!-- 添加或修改对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body class="form-dialog" 
      :close-on-click-modal="false" center>
      <div class="dialog-body">
        <el-form ref="form" :model="form" :rules="rules" label-position="top" class="electricity-form">
          <el-form-item label="用电日期" prop="lifeDate">
            <el-date-picker v-model="form.lifeDate" type="date" placeholder="选择日期" value-format="yyyy-MM-dd"
              format="yyyy年MM月dd日" :default-time="['00:00:00']" class="full-width" />
          </el-form-item>
          <el-form-item label="电价（元/kWh）" prop="pricePerKwh">
            <el-input-number v-model="form.pricePerKwh" :min="0" :precision="4" :controls="false"
              placeholder="请输入电价" class="full-width" />
          </el-form-item>
          <el-form-item label="用电量（kWh）" prop="totalKwh">
            <el-input-number v-model="form.totalKwh" :min="0" :precision="2" :controls="false"
              placeholder="请输入用电量" class="full-width" />
          </el-form-item>
        </el-form>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel" class="btn-cancel">取消</el-button>
        <el-button type="primary" @click="submitForm" class="btn-confirm">确认保存</el-button>
      </div>
    </el-dialog>

    <!-- 上传文件弹框 -->
    <el-dialog title="导入用电数据" :visible.sync="uploadDialogVisible" width="480px" append-to-body 
      class="upload-dialog" :close-on-click-modal="false" center>
      <div class="upload-content">
        <el-steps :active="uploadStep" finish-status="success" simple class="upload-steps">
          <el-step title="选择文件"></el-step>
          <el-step title="上传处理"></el-step>
          <el-step title="完成"></el-step>
        </el-steps>

        <div class="upload-area-wrapper">
          <el-upload ref="upload" class="upload-area" action="#" :auto-upload="false"
            :on-change="handleFileChange" :on-remove="handleFileRemove" accept=".xlsx,.xls" :limit="1" drag>
            <div class="upload-icon-wrapper">
              <i class="el-icon-upload"></i>
            </div>
            <div class="upload-text-wrapper">
              <p class="upload-title">拖拽文件到此处或点击上传</p>
              <p class="upload-hint">支持 .xlsx、.xls 格式，单个文件不超过 5MB</p>
            </div>
          </el-upload>

          <div v-if="uploadFile" class="file-info-card">
            <div class="file-icon">
              <i class="el-icon-document"></i>
            </div>
            <div class="file-details">
              <p class="file-name">{{ uploadFile.name }}</p>
              <p class="file-meta">
                <span class="file-size">{{ formatFileSize(uploadFile.size) }}</span>
                <span class="file-status">待上传</span>
              </p>
            </div>
            <el-button type="danger" icon="el-icon-delete" circle @click="handleFileRemove" class="file-delete-btn"></el-button>
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="uploadDialogVisible = false" class="btn-cancel">取消</el-button>
        <el-button type="primary" @click="confirmUpload" :disabled="!uploadFile" class="btn-confirm" :loading="uploading">
          <span v-if="!uploading"><i class="el-icon-upload2"></i> 开始上传</span>
          <span v-else>上传中...</span>
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { pageQryElectricityCost, addElectricityCost, updElectricityCost, uploadElectricityCost } from '@/api/cost/electricity'
import { Loading } from 'element-ui'

export default {
  name: "Electricity",
  dicts: ['sys_normal_disable'],
  data() {
    return {
      loading: true,
      uploading: false,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      monthCount: 0,
      lastUpdateTime: '-',
      roleList: [],
      title: "",
      open: false,
      openDataScope: false,
      uploadStep: 0,
      electricityCostList: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        startLifeDate: undefined,
        endLifeDate: undefined,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        lifeDate: [
          { required: true, message: "请选择用电日期", trigger: "change" }
        ],
        pricePerKwh: [
          { required: true, message: "请输入电价", trigger: "blur" }
        ],
        totalKwh: [
          { required: true, message: "请输入用电量", trigger: "blur" }
        ],
      },
      // 日期范围
      dateRange: [],
      uploadDialogVisible: false, // 上传弹框显示状态
      uploadFile: null, // 选中的文件对象
      // 日期选择器配置
      pickerOptions: {
        shortcuts: [{
          text: '最近一周',
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
            picker.$emit('pick', [start, end]);
          }
        }, {
          text: '最近一个月',
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
            picker.$emit('pick', [start, end]);
          }
        }, {
          text: '最近三个月',
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
            picker.$emit('pick', [start, end]);
          }
        }]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 格式化金额 */
    formatMoney(value) {
      if (value == null || value === '') return '0.00';
      const num = parseFloat(value);
      if (isNaN(num)) return '0.00';
      return num.toFixed(2);
    },

    /** 格式化数字 */
    formatNumber(value) {
      if (value == null || value === '') return '0.00';
      const num = parseFloat(value);
      if (isNaN(num)) return '0.00';
      return num.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
    },

    getList() {
      this.loading = true;
      pageQryElectricityCost(this.queryParams).then(response => {
        this.electricityCostList = response.data.list || [];
        this.total = response.data.total || 0;
        // 计算本月记录数
        const currentMonth = new Date().getMonth();
        this.monthCount = this.electricityCostList.filter(item => {
          const itemMonth = new Date(item.lifeDate).getMonth();
          return itemMonth === currentMonth;
        }).length;
        // 更新最后时间
        if (this.electricityCostList.length > 0) {
          this.lastUpdateTime = this.electricityCostList[0].lifeDate || '-';
        }
        this.loading = false;
      }).catch(() => {
        this.electricityCostList = [];
        this.total = 0;
        this.loading = false;
      });
    },

    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "新增用电记录";
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != undefined) {
            updElectricityCost(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addElectricityCost(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },

    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      if (this.dateRange && this.dateRange.length === 2) {
        this.queryParams.startLifeDate = this.dateRange[0];
        this.queryParams.endLifeDate = this.dateRange[1];
      } else {
        this.queryParams.startLifeDate = undefined;
        this.queryParams.endLifeDate = undefined;
      }
      this.getList();
    },

    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = [];
      this.queryParams.pageNum = 1;
      this.queryParams.startLifeDate = undefined;
      this.queryParams.endLifeDate = undefined;
      this.$refs.queryForm.resetFields();
      this.getList();
    },

    /** 分页大小改变 */
    handleSizeChange(val) {
      this.queryParams.pageSize = val;
      this.getList();
    },

    /** 页码改变 */
    handlePageChange(val) {
      this.queryParams.pageNum = val;
      this.getList();
    },

    reset() {
      if (this.$refs.menu != undefined) {
        this.$refs.menu.setCheckedKeys([]);
      }
      if (this.$refs.form) {
        this.$refs.form.resetFields();
      }
      this.menuExpand = false,
        this.menuNodeAll = false,
        this.deptExpand = true,
        this.deptNodeAll = false,
        this.form = {
          id: undefined,
          lifeDate: '',
          pricePerKwh: '',
          totalKwh: '',
          remark: ''
        };
      this.$refs.form && this.$refs.form.resetFields();
    },

    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },

    /** 修改按钮操作 */
    handleUpdate() {
      this.reset();
      if (this.ids.length !== 1) {
        this.$message.warning('请选择一条记录进行编辑');
        return;
      }
      const row = this.electricityCostList.find(item => item.id === this.ids[0]);
      if (!row) {
        this.$message.error('未找到要编辑的数据，请刷新页面后重试');
        return;
      }
      this.form = JSON.parse(JSON.stringify(row));
      this.open = true;
      this.title = "编辑用电记录";
    },

    /** 删除按钮操作 */
    handleDelete(row) {
    },

    /** 打开上传弹框 */
    openUploadDialog() {
      this.uploadDialogVisible = true;
      this.uploadStep = 0;
      this.$nextTick(() => {
        this.$refs.upload && this.$refs.upload.clearFiles();
        this.uploadFile = null;
      });
    },

    /** 处理文件选择 */
    handleFileChange(file, fileList) {
      if (fileList.length > 1) {
        fileList.splice(0, fileList.length - 1);
      }
      this.uploadFile = file.raw;
      this.uploadStep = 1;
    },

    /** 移除已选文件 */
    handleFileRemove() {
      this.uploadFile = null;
      this.uploadStep = 0;
      this.$refs.upload && this.$refs.upload.clearFiles();
    },

    /** 格式化文件大小 */
    formatFileSize(size) {
      if (size < 1024) {
        return size + ' B';
      } else if (size < 1048576) {
        return (size / 1024).toFixed(2) + ' KB';
      } else {
        return (size / 1048576).toFixed(2) + ' MB';
      }
    },

    /** 确认上传 */
    confirmUpload() {
      if (!this.uploadFile) {
        this.$message.error('请选择要上传的文件');
        return;
      }

      this.uploading = true;
      this.uploadStep = 1;

      const loading = Loading.service({
        lock: true,
        text: '正在上传并处理文件...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });

      const formData = new FormData();
      formData.append('file', this.uploadFile);

      uploadElectricityCost(formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }).then(response => {
        loading.close();
        this.uploading = false;
        this.uploadStep = 2;
        this.$modal.msgSuccess("上传成功");
        setTimeout(() => {
          this.uploadDialogVisible = false;
          this.uploadStep = 0;
          this.uploadFile = null;
          this.getList();
        }, 1500);
      }).catch(error => {
        loading.close();
        this.uploading = false;
        this.uploadStep = 0;
        this.$message.error('上传失败: ' + (error.msg || '未知错误'));
      });
    }
  }
}
</script>

<style scoped>
/* ========== 页面基础布局 ========== */
.electricity-page {
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: calc(100vh - 84px);
}

/* ========== 页面标题区 ========== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  flex-direction: column;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 26px;
  font-weight: 700;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 12px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-title i {
  font-size: 28px;
}

.page-desc {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  padding-left: 40px;
}

/* ========== 统计卡片 ========== */
.stat-cards {
  margin-bottom: 24px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
}

.stat-primary .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-success .stat-icon {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.stat-warning .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-info-card .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.time-value {
  font-size: 14px !important;
  font-weight: 500 !important;
}

/* ========== 主内容卡片 ========== */
.content-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

/* ========== 搜索区域 ========== */
.search-section {
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  margin-bottom: 20px;
}

.search-item .el-form-item__label {
  font-weight: 500;
  color: #475569;
}

.date-picker {
  width: 280px !important;
}

.search-actions {
  margin-left: 20px;
}

.btn-search,
.btn-reset {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-search {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #fff;
}

.btn-search:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.btn-reset {
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #64748b;
}

.btn-reset:hover {
  background: #f8fafc;
  color: #475569;
}

/* ========== 工具栏 ========== */
.toolbar-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.toolbar-left {
  display: flex;
  gap: 12px;
}

.btn-action {
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-action i {
  font-size: 14px;
}

.btn-action:hover {
  transform: translateY(-2px);
}

.btn-icon-only {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 10px;
}

/* ========== 数据表格 ========== */
.data-table {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.data-table::before {
  display: none;
}

.data-table >>> .el-table__header th {
  background-color: #f8fafc !important;
  color: #475569;
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 14px 0;
}

.data-table >>> .el-table__row {
  transition: all 0.2s;
}

.data-table >>> .el-table__row:hover td {
  background-color: #f0fdf4 !important;
}

.data-table >>> td {
  padding: 16px 0;
  border-bottom: 1px solid #f1f5f9;
}

.index-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.date-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-weight: 500;
}

.date-cell i {
  color: #667eea;
  font-size: 16px;
}

.value-cell {
  font-weight: 600;
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
}

.value-cell.money {
  color: #0891b2;
  font-size: 15px;
}

.value-cell.number {
  color: #059669;
  font-size: 15px;
}

.unit-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 6px;
  font-size: 11px;
  margin-left: 6px;
  font-weight: 500;
}

.cost-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  border: none;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.cost-tag i {
  font-size: 14px;
}

.remark-text {
  color: #94a3b8;
  font-size: 13px;
}

/* ========== 分页 ========== */
.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

.pagination-wrapper >>> .el-pagination {
  font-weight: 500;
}

.pagination-wrapper >>> .el-pagination.is-background .el-pager li:not(.disabled).is-active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
}

/* ========== 对话框 ========== */
.form-dialog >>> .el-dialog__header {
  padding: 20px 24px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0;
  border-radius: 20px 20px 0 0;
}

.form-dialog >>> .el-dialog__title {
  color: #fff;
  font-weight: 600;
  font-size: 18px;
}

.form-dialog >>> .el-dialog__headerbtn .el-dialog__close {
  color: rgba(255, 255, 255, 0.8);
}

.form-dialog >>> .el-dialog__body {
  padding: 30px 24px;
}

.dialog-body {
  padding: 0 10px;
}

.electricity-form >>> .el-form-item__label {
  font-weight: 600;
  color: #374151;
  padding-bottom: 8px !important;
}

.electricity-form >>> .el-input-number,
.electricity-form >>> .el-date-editor {
  width: 100%;
}

.full-width {
  width: 100%;
}

.dialog-footer {
  padding: 10px 24px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel,
.btn-confirm {
  padding: 12px 28px;
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-cancel {
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #64748b;
}

.btn-cancel:hover {
  background: #f8fafc;
}

.btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #fff;
}

.btn-confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

/* ========== 上传对话框 ========== */
.upload-dialog >>> .el-dialog__header {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  padding: 20px 24px;
}

.upload-dialog >>> .el-dialog__title {
  color: #fff;
  font-weight: 600;
}

.upload-dialog >>> .el-dialog__headerbtn .el-dialog__close {
  color: rgba(255, 255, 255, 0.8);
}

.upload-content {
  padding: 20px 10px;
}

.upload-steps {
  margin-bottom: 30px;
}

.upload-area-wrapper {
  padding: 0 20px;
}

.upload-area {
  width: 100%;
}

.upload-area >>> .el-upload {
  width: 100%;
}

.upload-area >>> .el-upload-dragger {
  width: 100%;
  height: 180px;
  border: 2px dashed #e2e8f0;
  border-radius: 16px;
  background: #fafafa;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.upload-area >>> .el-upload-dragger:hover {
  border-color: #667eea;
  background: #f0fdf4;
}

.upload-icon-wrapper {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.upload-icon-wrapper i {
  font-size: 32px;
  color: #fff;
}

.upload-text-wrapper {
  text-align: center;
}

.upload-title {
  margin: 0 0 8px 0;
  font-size: 15px;
  font-weight: 500;
  color: #374151;
}

.upload-hint {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
}

.file-info-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border-radius: 12px;
  margin-top: 20px;
}

.file-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-icon i {
  font-size: 24px;
  color: #fff;
}

.file-details {
  flex: 1;
}

.file-name {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  margin: 0;
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #94a3b8;
}

.file-status {
  color: #0891b2;
  font-weight: 500;
}

.file-delete-btn {
  width: 32px;
  height: 32px;
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .electricity-page {
    padding: 16px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .stat-card {
    margin-bottom: 16px;
  }
  
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