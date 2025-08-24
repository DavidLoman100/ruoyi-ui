<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="支出时间">
        <el-date-picker v-model="dateRange" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期"></el-date-picker>
      </el-form-item>
      <el-form-item label="支出项目">
        <el-input v-model="queryParams.costName" style="width: 180px" placeholder="请输入支出项目"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icodateRangen="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd"
          v-hasPermi="['']">新增</el-button>
      </el-col>
    </el-row>


    <el-table v-loading="loading" :data="largeCostList" @selection-change="handleSelectionChange">
      <el-table-column label="id" prop="id" width="80" />
      <el-table-column label="金额" prop="amount" width="100" />
      <el-table-column label="支出项目" prop="costName" width="150" />
      <el-table-column label="支出类型" prop="costType" width="150">
        <template #default="scope">
          {{ costTypeMap[scope.row.costType] || scope.row.costType }}
        </template>
      </el-table-column>

      <el-table-column label="支出标签" prop="costTag" width="250">
        <template #default="scope">
          <el-tag v-for="(tag, index) in scope.row.costTag" :key="tag + index" :style="{
            backgroundColor: scope.row._tagColors[index],
            color: '#fff',
            marginRight: '4px'
          }">
            {{ costTagMap[tag] || tag }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="支出时间" prop="costTime" width="200" />
      <el-table-column label="备注" prop="remark" :show-overflow-tooltip="true" width="200" />
      <el-table-column label="操作" width="150" align="center">
        <template #default="scope">
          <el-button size="small" type="success" plain icon="el-icon-edit" @click="updLargeCost(scope.row)"
            title="修改" />
          <el-button size="small" type="danger" plain icon="el-icon-delete" @click="delLargeCost(scope.row)"
            title="删除" />
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />


    <!-- 添加或修改对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="700px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="150px">
        <el-form-item label="金额" prop="amount">
          <el-input v-model="form.amount" placeholder="请输入金额" />
        </el-form-item>
        <el-form-item label="支出项目" prop="costName">
          <el-input v-model="form.costName" placeholder="请输入支出项目" />
        </el-form-item>
        <el-form-item label="支出类型" prop="costType">
          <el-select v-model="form.costType" placeholder="请选择支出类型" style="width: 100%">
            <el-option v-for="item in costTypeList" :key="item.dictValue" :label="item.dictLabel"
              :value="item.dictValue" />
          </el-select>
        </el-form-item>
        <el-form-item label="支出标签" prop="costTag">
          <el-select v-model="form.costTag" placeholder="请选择支出标签" style="width: 100%" multiple filterable clearable>
            <el-option v-for="item in costTagList" :key="item.dictValue" :label="item.dictLabel"
              :value="item.dictValue" />
          </el-select>
        </el-form-item>
        <el-form-item label="支出时间" prop="costTime">
          <el-date-picker v-model="form.costTime" type="date" placeholder="请选择日期" value-format="yyyy-MM-dd"
            format="yyyy-MM-dd" :default-value="new Date()" />
        </el-form-item>
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
import { pageQryLargeCost, addLargeCost, updLargeCost, delLargeCost } from '@/api/cost/large'
import { getDictDetail } from '@/api/person/dict'

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
      largeCostList: [],
      costTypeList: [],  // 大额支出类型
      costTagList: [],   // 大额支出标签
      costTypeMap: {},
      costTagMap: {},
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        costName: undefined,
        costType: undefined,
        costTag: [],
        costStartTime: undefined,
        costEndTime: undefined
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        amount: [
          { required: true, message: "金额不能为空", trigger: "blur" }
        ],
        costName: [
          { required: true, message: "支出项目不能为空", trigger: "blur" }
        ],
        costType: [
          { required: true, message: "支出类型不能为空", trigger: "blur" }
        ],
        costTag: [
          { required: true, message: "支出标签不能为空", trigger: "blur" }
        ],
        costTime: [
          { required: true, message: "支出时间不能为空", trigger: "blur" }
        ],
      },
      // 日期范围
      dateRange: [],
      colorList: [], // 标签颜色数组
    };
  },
  created() {
    Promise.all([
      this.getDictDetailList('LARGE_COST_TYPE'),
      this.getDictDetailList('LARGE_COST_TAG')
    ]).then(() => {
      this.getList();  // 等字典加载完再拉列表
    });
  },
  methods: {
    getList() {
      this.loading = true;
      pageQryLargeCost(this.queryParams).then(response => {
        this.largeCostList = response.data.list.map(row => {
          // costTag 已经是数组
          if (row.costTag && row.costTag.length) {
            row._tagColors = row.costTag.map(() => this.randomColor());
          }
          return row;
        });
        this.total = response.data.total;
        this.loading = false;
      });
    },
    getDictDetailList(dictCode) {
      getDictDetail(dictCode).then(response => {
        //放在大额支出标签下拉框
        if (dictCode === 'LARGE_COST_TAG') {
          this.costTagList = response.data;
          this.costTagList.forEach(item => {
            this.costTagMap[item.dictValue] = item.dictLabel;
          });
        }
        //放在大额支出类型下拉框
        if (dictCode === 'LARGE_COST_TYPE') {
          this.costTypeList = response.data;
          this.costTypeList.forEach(item => {
            this.costTypeMap[item.dictValue] = item.dictLabel;
          });
        }
      });
    },

    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "新增";
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
            updLargeCost(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addLargeCost(this.form).then(response => {
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
      this.queryParams.costStartTime = this.dateRange[0];
      this.queryParams.costEndTime = this.dateRange[1];
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
      this.form = {
        id: undefined,
        costName: undefined,
        costType: undefined,
        costTag: [],
        costTime: undefined,
        remark: undefined
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
    updLargeCost(row) {
      this.reset();
      this.form = row;
      console.log('编辑的数据:', row);
      this.open = true;
      this.title = "修改大额支出";
    },

    delLargeCost(row) {
      this.$modal.confirm(' 是否确认删除大额支出项目："' + row.costName + '"的数据项？').then(function () {
        return delLargeCost(row.id);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => { });
    },

    // 生成随机亮色
    randomColor() {
      const r = Math.floor(Math.random() * 156 + 100); // 100-255
      const g = Math.floor(Math.random() * 156 + 100);
      const b = Math.floor(Math.random() * 156 + 100);
      return `rgb(${r},${g},${b})`;
    },

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