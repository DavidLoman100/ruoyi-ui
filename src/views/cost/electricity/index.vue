<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="创建时间">
        <el-date-picker v-model="dateRange" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期"></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd"
          v-hasPermi="['']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['']">修改</el-button>
      </el-col>
      <!-- 导入按钮 -->
      <el-col :span="2">
        <el-button type="warning" plain icon="el-icon-upload2" size="mini" @click="openUploadDialog">导入数据</el-button>
      </el-col>
    </el-row>


    <el-table v-loading="loading" :data="electricityCostList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="id" prop="id" width="80" />
      <el-table-column label="生活时间" prop="lifeDate" width="200" />
      <el-table-column label="每千瓦时费用" prop="pricePerKwh" width="200" />
      <el-table-column label="千瓦时(1000)" prop="totalKwh" width="200" />
      <el-table-column label="费用合计" prop="cost" width="200" />
      <el-table-column label="备注" prop="remark" :show-overflow-tooltip="true" width="200" />
    </el-table>
    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />


    <!-- 添加或修改对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="700px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="150px">
        <el-form-item label="生活时间" prop="lifeDate">
          <el-date-picker v-model="form.lifeDate" type="date" placeholder="请选择日期" value-format="yyyy-MM-dd"
            format="yyyy-MM-dd" :default-value="new Date()" />
        </el-form-item>
        <el-form-item label="每千瓦时费用" prop="pricePerKwh">
          <el-input v-model="form.totalKwh" placeholder="请输入每千瓦时费用" />
        </el-form-item>
        <el-form-item label="千瓦时数量(1000)" prop="totalKwh">
          <el-input v-model="form.pricePerKwh" placeholder="请输入千瓦时数量" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 上传文件弹框（核心修改部分） -->
    <el-dialog title="导入数据" :visible.sync="uploadDialogVisible" width="500px" append-to-body>
      <div class="upload-container">
        <!-- 上传区域提示 -->
        <div class="upload-hint">
          <p>请上传Excel格式的文件（.xlsx/.xls）</p>
          <p class="text-muted">支持批量导入用电数据，文件大小不超过5MB</p>
        </div>

        <!-- 上传文件框 -->
        <el-upload class="upload-area" action="#" :auto-upload="false" :on-change="handleFileChange"
          :on-remove="handleFileRemove" :show-file-list="true" accept=".xlsx,.xls" :limit="1" ref="upload">
          <div class="upload-box">
            <i class="el-icon-upload el-icon-2x"></i>
            <p>点击或拖拽文件到此处上传</p>
          </div>
        </el-upload>

        <!-- 已选文件显示 -->
        <div v-if="uploadFile" class="selected-file">
          <el-tag type="info" closable @close="handleFileRemove">{{ uploadFile.name }}</el-tag>
          <span class="file-size">{{ formatFileSize(uploadFile.size) }}</span>
        </div>
      </div>

      <!-- 弹框底部按钮 -->
      <div slot="footer">
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmUpload" :disabled="!uploadFile">上传</el-button>
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
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      roleList: [],
      title: "",
      open: false,
      openDataScope: false,
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
          { required: true, message: "生活时间不能为空", trigger: "blur" }
        ],
        pricePerKwh: [
          { required: true, message: "千瓦时费用不能为空", trigger: "blur" }
        ],
        totalKwh: [
          { required: true, message: "千瓦时数量不能为空", trigger: "blur" }
        ],
      },
      // 日期范围
      dateRange: [],
      uploadDialogVisible: false, // 上传弹框显示状态
      uploadFile: null, // 选中的文件对象
    };
  },
  created() {
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      pageQryElectricityCost(this.queryParams).then(response => {
        this.electricityCostList = response.data.list;
        this.total = response.data.total;
        this.loading = false;
      });
    },

    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加用电记录";
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
      this.queryParams.startLifeDate = this.dateRange[0];
      this.queryParams.endLifeDate = this.dateRange[1];
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = [];
      this.resetForm("queryForm");
      this.handleQuery();
    },
    reset() {
      if (this.$refs.menu != undefined) {
        this.$refs.menu.setCheckedKeys([]);
      }
      // 清空表单引用（如果有）
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
      this.resetForm("form");
    },

    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length != 1
      this.multiple = !selection.length
    },

    /** 修改按钮操作 */
    handleUpdate() {
      this.reset();

      // 检查是否只选中了一条记录
      if (this.ids.length !== 1) {
        this.$message.warning('请选择一条记录进行编辑');
        return;
      }

      // 通过ID查找对应的行数据
      const row = this.electricityCostList.find(item => item.id === this.ids[0]);

      if (!row) {
        this.$message.error('未找到要编辑的数据，请刷新页面后重试');
        return;
      }

      // 深拷贝行数据到表单，避免响应式引用问题
      this.form = JSON.parse(JSON.stringify(row));

      console.log('编辑的数据:', this.form);
      this.open = true;
      this.title = "修改生活时间记录";
    },
    /** 删除按钮操作 */
    handleDelete(row) {
    },

    // 上传文件相关方法（新增）
    /** 打开上传弹框 */
    openUploadDialog() {
      this.uploadDialogVisible = true;
      // 每次打开弹框重置上传状态
      this.$nextTick(() => {
        this.$refs.upload.clearFiles();
        this.uploadFile = null;
      });
    },

    /** 处理文件选择 */
    handleFileChange(file, fileList) {
      // 只保留最新选择的文件
      if (fileList.length > 1) {
        fileList.splice(0, fileList.length - 1);
      }
      this.uploadFile = file.raw;
    },

    /** 移除已选文件 */
    handleFileRemove() {
      this.uploadFile = null;
      this.$refs.upload.clearFiles();
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

      const loading = Loading.service({
        lock: true,
        text: '正在上传并处理文件...',
        background: 'rgba(0, 0, 0, 0.7)'
      });

      // 创建FormData对象
      const formData = new FormData();
      formData.append('file', this.uploadFile);

      // 调用封装的uploadElectricityCost方法，添加headers配置
      uploadElectricityCost(formData, {
        headers: {
          'Content-Type': 'multipart/form-data'  // 关键：显式设置请求头
        }
      }).then(response => {
        loading.close();
        this.$modal.msgSuccess(`上传成功`);
        this.uploadDialogVisible = false;
        this.getList();
      }).catch(error => {
        loading.close();
        this.$message.error('上传失败: ' + (error.msg || '未知错误'));
      });
    }
  }
}
</script>

<style scoped>
/* 上传弹框样式 */
.upload-container {
  padding: 10px 0;
}

.upload-hint {
  margin-bottom: 15px;
  padding-left: 10px;
}

.text-muted {
  color: #606266;
  font-size: 12px;
  margin-top: 5px;
}

.upload-area {
  border: 1px dashed #c0ccda;
  border-radius: 4px;
  padding: 30px 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-area:hover {
  border-color: #409eff;
}

.upload-box {
  color: #606266;
}

.upload-box p {
  margin-top: 10px;
  font-size: 14px;
}

.selected-file {
  margin-top: 15px;
  padding-left: 10px;
  display: flex;
  align-items: center;
}

.file-size {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
</style>