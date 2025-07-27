<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
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
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="single" @click="handleDelete"
          v-hasPermi="['']">删除</el-button>
      </el-col>
    </el-row>
    <el-table v-loading="loading" :data="dictList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="id" prop="id" width="100" />
      <el-table-column label="字典类型" prop="dictCode" width="250" />
      <el-table-column label="字典名称" prop="dictName" width="250" />
      <el-table-column label="备注" prop="remark" width="250" />
      <el-table-column label="操作" width="150" align="center">
        <template #default="scope">
          <el-button size="mini" type="text" icon="el-icon-setting" @click="handleDictDetail(scope.row)" title="配置" />
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getDictDetailList" />


    <!-- 添加或修改字典配置对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="700px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="字典编码" prop="dictCode">
              <el-input v-model="form.dictCode" placeholder="请输入字典编码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="字典名称" prop="dictName">
              <el-input v-model="form.dictName" placeholder="请输入字典名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>


    <!-- 添加或修改字典详情配置对话框 -->
    <el-dialog title="配置字典详情" :visible.sync="detailOpen" width="1000px" append-to-body>
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="addDetail"
            v-hasPermi="['']">新增</el-button>
        </el-col>
      </el-row>
      <el-table v-loading="loading" :data="dictDetailList" >
        <el-table-column label="id" prop="id" width="100" />
        <el-table-column label="字典类型" prop="dictValue" width="150" />
        <el-table-column label="字典名称" prop="dictLabel" width="150" />
        <el-table-column label="备注" prop="remark" width="200" />
        <el-table-column label="操作" width="150" align="center">
          <template #default="scope">
            <el-button size="mini" type="success" plain circle="true" icon="el-icon-edit" @click="updDetail(scope.row)" title="修改" />
            <el-button size="mini" type="danger" plain circle icon="el-icon-delete" @click="delDetail(scope.row)" title="删除" />
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="detailTotal > 0" :total="detailTotal" :page.sync="queryDetailParams.pageNum"
        :limit.sync="queryDetailParams.pageSize" @pagination="getDictDetailList" />
    </el-dialog>

    <!-- 添加或修改字典详情 -->
    <el-dialog :title="detailTitle" :visible.sync="detailOptOpen" width="700px" append-to-body>
      <el-form ref="form" :model="detailForm" :rules="detailRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="字典详情编码" prop="dictValue">
              <el-input v-model="detailForm.dictValue" placeholder="请输入字典详情编码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="字典详情名称" prop="dictLabel">
              <el-input v-model="detailForm.dictLabel" placeholder="请输入字典详情名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="备注">
              <el-input v-model="detailForm.remark" type="textarea" placeholder="请输入内容" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="detailSubmitForm">确 定</el-button>
        <el-button @click="detailCancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { pageQryDict, addDict, updDict, delDict, pageQryDictDetail, addDictDetail, updDictDetail, delDictDetail } from '@/api/person/dict'
export default {
  name: "dictNew",
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
      detailTotal: 0,
      // 角色表格数据
      roleList: [],
      // 弹出层标题
      title: "",
      detailTitle: "",
      // 是否显示弹出层
      open: false,
      // 是否显示字典详情弹框
      detailOpen: false,
      // 字典详情新增和编辑弹框
      detailOptOpen: false,
      // 是否显示弹出层（数据权限）
      openDataScope: false,
      dictList: [],
      dictDetailList: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        startLifeDate: undefined,
        endLifeDate: undefined,
      },
      queryDetailParams: {
        pageNum: 1,
        pageSize: 10,
        dictCode: undefined,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        lifeDate: [
          { required: true, message: "生活时间不能为空", trigger: "blur" }
        ],
      },
      detailForm: {},
      detailRules: {
      },
      dateRange: [],
      curdictCode: undefined,
    };
  },
  created() {
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      pageQryDict(this.queryParams).then(response => {
        this.dictList = response.data.list;
        this.total = response.data.total;
        this.loading = false;
      }
      );
    },

    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加字典";
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
            updDict(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addDict(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            })
          }
        }
      })
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
          dictCode: '',
          dictName: '',
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
      const row = this.dictList.find(item => item.id === this.ids[0]);

      if (!row) {
        this.$message.error('未找到要编辑的数据，请刷新页面后重试');
        return;
      }

      // 深拷贝行数据到表单，避免响应式引用问题
      this.form = JSON.parse(JSON.stringify(row));
      console.log('编辑的数据:', this.form);
      this.open = true;
      this.title = "修改字典";
    },
    /** 删除按钮操作 */
    handleDelete() {
      const row = this.dictList.find(item => item.id === this.ids[0]);
      const dictId = row.id;
      this.$modal.confirm(' 是否确认删除字典名称为"' + row.dictName + '"的数据项？').then(function () {
        return delDict(dictId);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => { });
    },

    getDictDetailList(dictCode) {
      this.queryDetailParams.dictCode = dictCode;
      pageQryDictDetail(this.queryDetailParams).then(response => {
        this.dictDetailList = response.data.list;
        this.detailTotal = response.data.total;
        this.loading = false;
      });
    },
    handleDictDetail(row) {
      this.dictDetailList = [];
      this.detailOpen = true;
      this.curdictCode = row.dictCode;
      this.getDictDetailList(row.dictCode)
    },
    resetDetailForm() {
      this.resetForm("detailForm");
    },
    addDetail() {
      this.detailOptOpen = true;
      this.detailTitle = "添加字典详情";
    },
    updDetail(row) {
      this.detailOptOpen = true;
      this.detailTitle = "编辑字典详情";
      console.log('编辑的数据:', row);
      this.detailForm = row;
    },
    detailCancel() {
      this.detailOptOpen = false;
      this.resetDetailForm();
    },
    detailSubmitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.detailForm.id != undefined) {
            updDictDetail(this.detailForm).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.detailOptOpen = false;
              this.getDictDetailList(this.curdictCode);
            });
          } else {
            this.detailForm.dictCode = this.curdictCode;
            addDictDetail(this.detailForm).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.detailOptOpen = false;
              this.getDictDetailList(this.curdictCode);
            })
          }
        }
      })
      this.resetDetailForm();
    },
    
    delDetail(row){
      this.$modal.confirm(' 是否确认删除字典详情名称为"' + row.dictLabel + '"的数据项？').then(function () {
        return delDictDetail(row.id);
      }).then(() => {
        this.getDictDetailList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => { });
    }
  }

}

</script>