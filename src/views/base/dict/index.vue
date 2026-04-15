<template>
  <div class="dict-page">
    <!-- 主内容卡片 -->
    <div class="content-card">
      <!-- 搜索表单区域 -->
      <div class="search-section" v-show="showSearch">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true">
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery" class="btn-search">查询</el-button>
            <el-button icon="el-icon-refresh" size="small" @click="resetQuery" class="btn-reset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 操作按钮区域 -->
      <div class="toolbar-section">
        <div class="toolbar-left">
          <el-button type="primary" icon="el-icon-plus" size="small" @click="handleAdd" v-hasPermi="['']" class="btn-primary">
            新增
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-button icon="el-icon-refresh" size="small" @click="getList" class="btn-refresh">刷新</el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="dictList" border class="data-table">
        <el-table-column label="ID" prop="id" width="80" align="center">
          <template slot-scope="{ row }">
            <span class="id-badge">{{ row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column label="字典类型" prop="dictCode" min-width="180" align="center">
          <template slot-scope="{ row }">
            <span class="code-text">{{ row.dictCode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="字典名称" prop="dictName" min-width="150" align="center" />
        <el-table-column label="备注" prop="remark" min-width="200" align="left" :show-overflow-tooltip="true">
          <template slot-scope="{ row }">
            <span class="remark-text">{{ row.remark || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center">
          <template #default="scope">
            <div class="table-actions">
              <el-button size="mini" type="text" icon="el-icon-setting" @click="handleDictDetail(scope.row)" class="action-btn action-btn-config">
                <span class="btn-text">配置</span>
              </el-button>
              <el-divider direction="vertical"></el-divider>
              <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)" class="action-btn action-btn-edit">
                <span class="btn-text">修改</span>
              </el-button>
              <el-divider direction="vertical"></el-divider>
              <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)" class="action-btn action-btn-delete">
                <span class="btn-text">删除</span>
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination :background="true" :current-page="queryParams.pageNum" :page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]" :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </div>

    <!-- 添加或修改字典配置对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body class="dict-dialog">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="字典编码" prop="dictCode">
          <el-input v-model="form.dictCode" placeholder="请输入字典编码" />
        </el-form-item>
        <el-form-item label="字典名称" prop="dictName">
          <el-input v-model="form.dictName" placeholder="请输入字典名称" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="cancel" class="btn-cancel">取 消</el-button>
        <el-button type="primary" size="small" icon="el-icon-check" @click="submitForm" class="btn-confirm">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 添加或修改字典详情配置对话框 -->
    <el-dialog title="配置字典详情" :visible.sync="detailOpen" width="80%" append-to-body class="detail-dialog">
      <div class="detail-header">
        <div class="detail-info">
          <span class="detail-info-label">字典编码：</span>
          <span class="detail-info-value">{{ curdictCode }}</span>
        </div>
        <el-button type="primary" plain icon="el-icon-plus" size="small" @click="addDetail" v-hasPermi="['']">
          新增
        </el-button>
      </div>
      <div class="detail-body">
        <el-table v-loading="loading" :data="dictDetailList" border stripe class="detail-table" height="350">
          <el-table-column label="序号" type="index" width="50" align="center" />
          <el-table-column label="详情编码" prop="dictValue" width="100" align="center">
            <template slot-scope="{ row }">
              <el-tag size="small" effect="light" type="primary" class="detail-value-tag">{{ row.dictValue }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="详情名称" prop="dictLabel" width="120" align="center">
            <template slot-scope="{ row }">
              <span class="detail-label-text">{{ row.dictLabel }}</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" min-width="120" align="left" :show-overflow-tooltip="true">
            <template slot-scope="{ row }">
              <span class="remark-text">{{ row.remark || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" align="center" fixed="right">
            <template #default="scope">
              <div class="detail-action-buttons">
                <el-button type="text" size="small" icon="el-icon-edit" @click="updDetail(scope.row)" class="btn-edit">编辑</el-button>
                <span class="action-divider">|</span>
                <el-button type="text" size="small" icon="el-icon-delete" @click="delDetail(scope.row)" class="btn-delete">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="detail-pagination-wrapper">
        <el-pagination :background="true" :current-page="queryDetailParams.pageNum" :page-size="queryDetailParams.pageSize"
          :page-sizes="[10, 20, 50, 100]" :total="detailTotal"
          layout="total, prev, pager, next"
          :pager-count="5"
          @size-change="handleDetailSizeChange" @current-change="handleDetailPageChange" />
      </div>
    </el-dialog>

    <!-- 添加或修改字典详情 -->
    <el-dialog :title="detailTitle" :visible.sync="detailOptOpen" width="480px" append-to-body class="detail-opt-dialog">
      <el-form ref="detailFormRef" :model="detailForm" :rules="detailRules" label-width="100px" class="detail-opt-form">
        <el-form-item label="详情编码" prop="dictValue">
          <el-input v-model="detailForm.dictValue" placeholder="请输入详情编码" clearable />
        </el-form-item>
        <el-form-item label="详情名称" prop="dictLabel">
          <el-input v-model="detailForm.dictLabel" placeholder="请输入详情名称" clearable />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="detailForm.remark" type="textarea" :rows="3" placeholder="请输入备注信息" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="detailCancel" class="btn-cancel">取 消</el-button>
        <el-button type="primary" size="small" icon="el-icon-check" @click="detailSubmitForm" class="btn-confirm">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { pageQryDict, addDict, updDict, delDict, pageQryDictDetail, addDictDetail, updDictDetail, delDictDetail } from '@/api/base/dict'
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
        dictCode: [
          { required: true, message: "字典编码不能为空", trigger: "blur" }
        ],
        dictName: [
          { required: true, message: "字典名称不能为空", trigger: "blur" }
        ],
      },
      detailForm: {},
      detailRules: {
        dictValue: [
          { required: true, message: "字典详情编码不能为空", trigger: "blur" }
        ],
        dictLabel: [
          { required: true, message: "字典详情名称不能为空", trigger: "blur" }
        ],
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
    handleUpdate(row) {
      this.reset();
      // 深拷贝行数据到表单，避免响应式引用问题
      this.form = JSON.parse(JSON.stringify(row));
      this.open = true;
      this.title = "修改字典";
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      this.$modal.confirm(' 是否确认删除字典名称为"' + row.dictName + '"的数据项？').then(() => {
        return delDict(row.id);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => { });
    },

    getDictDetailList() {
      this.queryDetailParams.dictCode = this.curdictCode;
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
      this.detailForm = {
        id: undefined,
        dictCode: undefined,
        dictValue: undefined,
        dictLabel: undefined,
        remark: undefined
      }
    },
    addDetail() {
      this.resetDetailForm();
      this.detailOptOpen = true;
      this.detailTitle = "添加字典详情";
    },
    updDetail(row) {
      this.resetDetailForm();
      this.detailOptOpen = true;
      this.detailTitle = "编辑字典详情";
      this.detailForm = row;
    },
    detailCancel() {
      this.detailOptOpen = false;
      this.resetDetailForm();
    },
    detailSubmitForm: function () {
      this.$refs["detailFormRef"].validate(valid => {
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
    },

    delDetail(row) {
      this.$modal.confirm(' 是否确认删除字典详情名称为"' + row.dictLabel + '"的数据项？').then(function () {
        return delDictDetail(row.id);
      }).then(() => {
        this.getDictDetailList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => { });
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
    /** 字典详情分页大小改变 */
    handleDetailSizeChange(val) {
      this.queryDetailParams.pageSize = val;
      this.getDictDetailList();
    },
    /** 字典详情页码改变 */
    handleDetailPageChange(val) {
      this.queryDetailParams.pageNum = val;
      this.getDictDetailList();
    }
  }
}

</script>

<style scoped>
/* ========== 页面基础布局 ========== */
.dict-page {
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

.search-section >>> .el-form-item {
  margin-bottom: 0;
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

.toolbar-right {
  display: flex;
  gap: 8px;
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

/* ========== ID徽章 ========== */
.id-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecef 100%);
  color: #6b7280;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 0 8px;
  border: 1px solid #e5e7eb;
}

/* ========== 代码文本 ========== */
.code-text {
  color: #3b82f6;
  font-weight: 500;
}

/* ========== 备注文本 ========== */
.remark-text {
  color: #6b7280;
  font-size: 13px;
}

/* ========== 详情值标签 ========== */
.detail-value-tag {
  font-weight: 600;
  border-radius: 4px;
  padding: 0 8px;
  min-width: 32px;
  text-align: center;
}

/* ========== 详情名称文本 ========== */
.detail-label-text {
  color: #374151;
  font-weight: 500;
  font-size: 13px;
}

/* ========== 表格操作按钮组 ========== */
.table-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.table-actions .el-divider--vertical {
  margin: 0 4px;
  background-color: #e5e7eb;
  height: 14px;
}

.table-actions .action-btn {
  padding: 4px 8px;
  font-size: 13px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.table-actions .action-btn:hover {
  transform: translateY(-1px);
}

.table-actions .action-btn .btn-text {
  margin-left: 3px;
}

/* 配置按钮 - 紫色 */
.table-actions .action-btn-config {
  color: #8b5cf6;
}

.table-actions .action-btn-config:hover {
  color: #7c3aed;
  background: rgba(139, 92, 246, 0.1);
}

/* 修改按钮 - 蓝色 */
.table-actions .action-btn-edit {
  color: #3b82f6;
}

.table-actions .action-btn-edit:hover {
  color: #2563eb;
  background: rgba(59, 130, 246, 0.1);
}

/* 删除按钮 - 红色 */
.table-actions .action-btn-delete {
  color: #ef4444;
}

.table-actions .action-btn-delete:hover {
  color: #dc2626;
  background: rgba(239, 68, 68, 0.1);
}

/* ========== 工具栏按钮 ========== */
.toolbar-section .btn-primary {
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  transition: all 0.2s ease;
}

.toolbar-section .btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.toolbar-section .btn-refresh {
  border-radius: 6px;
  padding: 8px 16px;
  color: #4b5563;
  border-color: #d1d5db;
  transition: all 0.2s ease;
}

.toolbar-section .btn-refresh:hover {
  color: #3b82f6;
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

/* ========== 搜索区域按钮 ========== */
.search-section .btn-search {
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  transition: all 0.2s ease;
}

.search-section .btn-search:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.search-section .btn-reset {
  border-radius: 6px;
  padding: 8px 16px;
  color: #4b5563;
  border-color: #d1d5db;
  transition: all 0.2s ease;
}

.search-section .btn-reset:hover {
  color: #6b7280;
  border-color: #9ca3af;
  background: #f9fafb;
}

/* ========== 弹窗底部按钮 ========== */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer .btn-cancel {
  border-radius: 6px;
  padding: 9px 20px;
  color: #4b5563;
  border-color: #d1d5db;
  transition: all 0.2s ease;
}

.dialog-footer .btn-cancel:hover {
  color: #374151;
  border-color: #9ca3af;
  background: #f9fafb;
}

.dialog-footer .btn-confirm {
  border-radius: 6px;
  padding: 9px 24px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  transition: all 0.2s ease;
}

.dialog-footer .btn-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

/* ========== 详情弹窗操作按钮 ========== */
.detail-action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.detail-action-buttons .btn-edit {
  color: #3b82f6;
  font-size: 13px;
  padding: 6px 12px;
  min-width: 60px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.detail-action-buttons .btn-edit:hover {
  color: #2563eb;
  background: rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.detail-action-buttons .btn-edit >>> .el-icon-edit {
  margin-right: 3px;
}

.detail-action-buttons .btn-delete {
  color: #ef4444;
  font-size: 13px;
  padding: 6px 12px;
  min-width: 60px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.detail-action-buttons .btn-delete:hover {
  color: #dc2626;
  background: rgba(239, 68, 68, 0.1);
  transform: translateY(-1px);
}

.detail-action-buttons .btn-delete >>> .el-icon-delete {
  margin-right: 3px;
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

/* ========== 字典编辑弹窗 ========== */
.dict-dialog {
  border-radius: 12px;
  overflow: hidden;
}

.dict-dialog >>> .el-dialog__header {
  padding: 16px 20px;
  margin: 0;
  background: #fff;
  border-bottom: 1px solid #f1f5f9;
}

.dict-dialog >>> .el-dialog__header .el-dialog__title {
  color: #1f2937;
  font-weight: 600;
  font-size: 16px;
}

.dict-dialog >>> .el-dialog__headerbtn {
  top: 16px;
  right: 16px;
}

.dict-dialog >>> .el-dialog__headerbtn .el-dialog__close {
  color: #9ca3af;
}

.dict-dialog >>> .el-dialog__headerbtn:hover .el-dialog__close {
  color: #3b82f6;
}

.dict-dialog >>> .el-dialog__body {
  padding: 20px;
}

.dict-dialog >>> .el-dialog__footer {
  padding: 12px 20px;
  border-top: 1px solid #f1f5f9;
}

/* ========== 详情编辑弹窗 ========== */
.detail-opt-dialog {
  border-radius: 12px;
}

.detail-opt-dialog >>> .el-dialog__header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e8ecef;
}

.detail-opt-dialog >>> .el-dialog__header .el-dialog__title {
  color: #1f2937;
  font-weight: 600;
  font-size: 16px;
}

.detail-opt-dialog >>> .el-dialog__body {
  padding: 24px 20px 16px;
}

.detail-opt-dialog >>> .el-dialog__footer {
  padding: 12px 20px;
  border-top: 1px solid #e8ecef;
}

/* 表单样式 */
.detail-opt-form >>> .el-form-item {
  margin-bottom: 18px;
}

.detail-opt-form >>> .el-form-item__label {
  color: #4b5563;
  font-weight: 500;
  font-size: 14px;
}

.detail-opt-form >>> .el-input__inner {
  border-radius: 6px;
  border-color: #e2e8f0;
}

.detail-opt-form >>> .el-input__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.detail-opt-form >>> .el-textarea__inner {
  border-radius: 6px;
  border-color: #e2e8f0;
  resize: none;
}

.detail-opt-form >>> .el-textarea__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.detail-opt-dialog >>> .dialog-footer .el-button {
  border-radius: 6px;
  padding: 9px 20px;
}

/* ========== 详情弹窗 ========== */
.detail-dialog {
  border-radius: 12px;
  overflow: hidden;
}

.detail-dialog >>> .el-dialog {
  max-height: 85vh;
  margin-top: 5vh !important;
  display: flex;
  flex-direction: column;
}

.detail-dialog >>> .el-dialog__header {
  padding: 12px 16px;
  margin: 0;
  background: #fff;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
}

.detail-dialog >>> .el-dialog__header .el-dialog__title {
  color: #1f2937;
  font-weight: 600;
  font-size: 15px;
}

.detail-dialog >>> .el-dialog__headerbtn {
  top: 12px;
  right: 12px;
}

.detail-dialog >>> .el-dialog__headerbtn .el-dialog__close {
  color: #9ca3af;
}

.detail-dialog >>> .el-dialog__headerbtn:hover .el-dialog__close {
  color: #3b82f6;
}

.detail-dialog >>> .el-dialog__body {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  max-height: calc(85vh - 120px);
  overflow: hidden;
}

/* ========== 详情弹窗表格滚动区域 ========== */
.detail-body {
  overflow: hidden;
}

.detail-body .el-table__body-wrapper {
  overflow-y: auto;
}

.detail-body .el-table__body-wrapper::-webkit-scrollbar {
  width: 6px;
}

.detail-body .el-table__body-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.detail-body .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #f0f0f0;
  border-radius: 3px;
}

.detail-body .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #e0e0e0;
}

.detail-table {
  width: 100%;
}

.detail-dialog >>> .el-dialog__footer {
  padding: 10px 16px;
  border-top: 1px solid #f1f5f9;
  flex-shrink: 0;
}

/* ========== 详情弹窗分页 ========== */
.detail-pagination-wrapper {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

.detail-pagination-wrapper >>> .el-pagination {
  font-size: 13px;
  padding: 0;
  white-space: nowrap;
}

.detail-pagination-wrapper >>> .el-pagination__total {
  margin-right: 8px;
  font-size: 13px;
}

.detail-pagination-wrapper >>> .el-pagination .btn-prev,
.detail-pagination-wrapper >>> .el-pagination .btn-next {
  padding: 0 4px;
  min-width: 26px;
  height: 28px;
  line-height: 28px;
}

.detail-pagination-wrapper >>> .el-pagination .el-pager li {
  min-width: 26px;
  height: 28px;
  line-height: 28px;
  font-size: 13px;
  margin: 0 1px;
}

.detail-pagination-wrapper >>> .el-pagination.is-background .el-pager li:not(.disabled).is-active {
  background: #3b82f6;
  border-radius: 4px;
}

/* ========== 详情头部（信息+按钮） ========== */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #fafbfc;
  border: 1px solid #e8ecef;
  border-radius: 6px;
  margin-bottom: 10px;
}

.detail-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.detail-info-label {
  color: #6b7280;
  font-size: 12px;
}

.detail-info-value {
  color: #3b82f6;
  font-weight: 600;
  font-size: 12px;
}

/* ========== 详情表格 ========== */
.detail-table {
  border-radius: 6px;
  font-size: 13px;
}

.detail-table::before {
  display: none;
}

.detail-table >>> .el-table__header th {
  background-color: #f8fafc !important;
  color: #4a5568;
  font-weight: 600;
  font-size: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #e8ecef;
}

.detail-table >>> .el-table__row:hover > td {
  background-color: #f0f9ff !important;
}

.detail-table >>> .el-table__row td {
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.index-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  background: #f0f4f8;
  color: #64748b;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  padding: 0 6px;
  border: 1px solid #e2e8f0;
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

  .detail-info {
    flex-direction: column;
    gap: 8px;
  }
}
</style>