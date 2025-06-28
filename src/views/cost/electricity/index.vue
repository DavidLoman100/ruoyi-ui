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


    <!-- 添加或修改角色配置对话框 -->
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
  </div>
</template>

<script>
import { pageQryElectricityCost, addElectricityCost, updElectricityCost } from '@/api/cost/electricity'


export default {
  name: "Electricity",
  dicts: ['sys_normal_disable'],
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 角色表格数据
      roleList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 是否显示弹出层（数据权限）
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
      }
      );
    },

    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加角色";
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    /** 提交按钮 */
    submitForm: function () {
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
        // 初始化表单数据
        this.form = {
          id: undefined,
          lifeDate: '',
          pricePerKwh: '',
          totalKwh: '',
          lifeDate: '',
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

  }
}

</script>
