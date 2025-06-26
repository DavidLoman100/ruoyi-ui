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
      <!-- <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['']"
        >删除</el-button>
      </el-col> -->

    </el-row>


    <el-table v-loading="loading" :data="lifeDayList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="id" prop="id" width="50" />
      <el-table-column label="生活时间" prop="lifeDate" width="100" />
      <el-table-column label="it面试" prop="itMs" width="100" />
      <el-table-column label="it技能" prop="itSkill" width="100" />
      <el-table-column label="it项目" prop="itProject" width="100" />
      <el-table-column label="itSQl题" prop="itMysql" width="100" />
      <el-table-column label="it算法" prop="itAlgorithm" width="100" />
      <el-table-column label="运动" prop="sport" width="100" />
      <el-table-column label="金融学习" prop="financeSkill" width="100" />
      <el-table-column label="解读股市" prop="equityMktInterpret" width="100" />
      <el-table-column label="英语单词" prop="engWord" width="100" />
      <el-table-column label="摄影技能" prop="photographySkill" width="100" />
      <el-table-column label="备注" prop="remark" :show-overflow-tooltip="true" width="150" />
    </el-table>
    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />


    <!-- 添加或修改角色配置对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="700px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生活时间" prop="lifeDate">
              <el-date-picker v-model="form.lifeDate" type="date" placeholder="请选择日期" value-format="yyyy-MM-dd"
                format="yyyy-MM-dd" :default-value="new Date()" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="it面试" prop="itMs">
              <el-input v-model="form.itMs" placeholder="请输入it面试时间" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="it技能" prop="itSkill">
              <el-input v-model="form.itSkill" placeholder="请输入it技能时间" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="it项目" prop="itProject">
              <el-input v-model="form.itProject" placeholder="请输入it项目时间" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="itSQL题" prop="itMysql">
              <el-input v-model="form.itMysql" placeholder="请输入itSQL题时间" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="it算法" prop="itAlgorithm">
              <el-input v-model="form.itAlgorithm" placeholder="请输入it算法时间" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="运动" prop="sport">
              <el-input v-model="form.sport" placeholder="请输入运动时间" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="金融学习" prop="financeSkill">
              <el-input v-model="form.financeSkill" placeholder="请输入金融学习时间" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="解读股市" prop="equityMktInterpret">
              <el-input v-model="form.equityMktInterpret" placeholder="请输入解读股市时间" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="英语单词" prop="engWord">
              <el-input v-model="form.engWord" placeholder="请输入英语单词时间" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="摄影技能" prop="photographySkill">
              <el-input v-model="form.photographySkill" placeholder="请输入摄影技能时间" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
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
import { pageQryLifeDay, addLifeDay, updLifeDay } from '@/api/person/lifeday'

export default {
  name: "Lifeday",
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
      lifeDayList: [],
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
      pageQryLifeDay(this.queryParams).then(response => {
        this.lifeDayList = response.data.list;
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
            updLifeDay(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addLifeDay(this.form).then(response => {
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
          itMs: '',
          itSkill: '',
          itProject: '',
          itMysql: '',
          itAlgorithm: '',
          sport: '',
          financeSkill: '',
          equityMktInterpret: '',
          engWord: '',
          photographySkill: '',
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
      const row = this.lifeDayList.find(item => item.id === this.ids[0]);

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
