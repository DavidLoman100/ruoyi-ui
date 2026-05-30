<template>
  <div class="app-container">
    <el-card shadow="never">
      <el-form ref="queryForm" :model="queryParams" :inline="true" size="small" label-width="100px">
        <el-form-item label="模板名称" prop="templateName">
          <el-input
            v-model="queryParams.templateName"
            placeholder="请输入模板名称"
            clearable
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleQuery">查询</el-button>
          <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="mb8">
        <el-button type="primary" plain icon="el-icon-plus" size="small" @click="handleAdd">新增模板</el-button>
        <el-button plain icon="el-icon-refresh" size="small" @click="getList">刷新</el-button>
      </div>

      <el-table v-loading="loading" :data="tableList" border>
        <el-table-column type="expand" width="45">
          <template slot-scope="scope">
            <el-table :data="scope.row.mappings || []" border size="mini">
              <el-table-column type="index" label="#" width="50" align="center" />
              <el-table-column prop="roleName" label="角色名称" min-width="120" show-overflow-tooltip />
              <el-table-column prop="speakerCode" label="语音角色编码" min-width="220" show-overflow-tooltip />
              <el-table-column prop="contextText" label="上下文提示词" min-width="180" show-overflow-tooltip />
            </el-table>
          </template>
        </el-table-column>
        <el-table-column type="index" label="#" width="60" align="center" />
        <el-table-column prop="templateName" label="模板名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="description" label="模板描述" min-width="220" show-overflow-tooltip />
        <el-table-column label="映射数量" width="100" align="center">
          <template slot-scope="scope">
            <el-tag size="mini" type="info">{{ (scope.row.mappings || []).length }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="190" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)">编辑</el-button>
            <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog :title="title" :visible.sync="open" width="900px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="模板名称" prop="templateName">
              <el-input v-model="form.templateName" placeholder="请输入模板名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模板描述" prop="templateDescription">
              <el-input v-model="form.templateDescription" placeholder="可选" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="mb8" style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:600;">角色语音映射</span>
          <el-button type="primary" plain size="mini" icon="el-icon-plus" @click="addMapping">新增映射</el-button>
        </div>

        <el-table :data="form.mappings" :row-key="getMappingRowKey" border size="mini">
          <el-table-column type="index" label="#" width="50" align="center" />
          <el-table-column label="角色名称" min-width="170">
            <template slot-scope="scope">
              <el-input v-model="scope.row.roleName" placeholder="请输入角色名称" />
            </template>
          </el-table-column>
          <el-table-column label="语音角色" min-width="280">
            <template slot-scope="scope">
              <el-select v-model="scope.row.speakerCode" filterable clearable style="width:100%;" placeholder="请选择语音角色">
                <el-option
                  v-for="item in roleOptions"
                  :key="item.code"
                  :label="item.msg + ' (' + item.code + ')'"
                  :value="item.code"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="上下文提示词" min-width="220">
            <template slot-scope="scope">
              <el-input v-model="scope.row.contextText" placeholder="可选" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template slot-scope="scope">
              <el-button type="text" size="mini" icon="el-icon-delete" @click="removeMapping(scope.$index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listVoiceTemplates, listVoiceRoles, saveVoiceTemplate, deleteVoiceTemplate } from '@/api/audio/voiceTemplate'

export default {
  name: 'VoiceTemplate',
  data() {
    return {
      loading: false,
      open: false,
      title: '',
      queryParams: {
        templateName: undefined
      },
      rawList: [],
      tableList: [],
      roleOptions: [],
      form: {},
      rules: {
        templateName: [{ required: true, message: '模板名称不能为空', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.getRoles()
    this.getList()
  },
  methods: {
    createMapping(mapping = {}) {
      return {
        rowKey: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        roleName: mapping.roleName,
        speakerCode: mapping.speakerCode,
        contextText: mapping.contextText
      }
    },
    getMappingRowKey(row) {
      return row.rowKey
    },
    getRoles() {
      listVoiceRoles().then(res => {
        this.roleOptions = res.data || []
      })
    },
    getList() {
      this.loading = true
      listVoiceTemplates()
        .then(res => {
          this.rawList = res.data || []
          this.applyFilter()
        })
        .finally(() => {
          this.loading = false
        })
    },
    applyFilter() {
      const templateName = (this.queryParams.templateName || '').trim()
      this.tableList = (this.rawList || []).filter(item => {
        const okTemplate = !templateName || (item.templateName || '').includes(templateName)
        return okTemplate
      })
    },
    handleQuery() {
      this.applyFilter()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    reset() {
      this.form = {
        templateId: undefined,
        templateName: undefined,
        templateDescription: undefined,
        mappings: [this.createMapping()]
      }
      this.resetForm('form')
    },
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '新增语音角色模板'
    },
    handleUpdate(row) {
      this.reset()
      this.form = {
        templateId: row.templateId,
        templateName: row.templateName,
        templateDescription: row.description,
        mappings: (row.mappings || []).map(item => this.createMapping(item))
      }
      if (!this.form.mappings.length) {
        this.addMapping()
      }
      this.open = true
      this.title = '编辑语音角色模板'
    },
    addMapping() {
      this.form.mappings.push(this.createMapping())
    },
    removeMapping(index) {
      if (this.form.mappings.length <= 1) {
        this.$modal.msgWarning('至少保留一条映射')
        return
      }
      this.form.mappings.splice(index, 1)
    },
    validateMappings() {
      const mappings = this.form.mappings || []
      if (!mappings.length) {
        this.$modal.msgError('映射不能为空')
        return false
      }
      const roleSet = new Set()
      for (let i = 0; i < mappings.length; i++) {
        const row = mappings[i]
        if (!row.roleName || !row.roleName.trim()) {
          this.$modal.msgError(`第${i + 1}行角色名称不能为空`)
          return false
        }
        if (!row.speakerCode) {
          this.$modal.msgError(`第${i + 1}行语音角色不能为空`)
          return false
        }
        const key = row.roleName.trim()
        if (roleSet.has(key)) {
          this.$modal.msgError(`角色名称重复：${key}`)
          return false
        }
        roleSet.add(key)
      }
      return true
    },
    cancel() {
      this.open = false
      this.reset()
    },
    submitForm() {
      this.$refs.form.validate(valid => {
        if (!valid || !this.validateMappings()) {
          return
        }
        const payload = {
          templateId: this.form.templateId,
          templateName: this.form.templateName,
          templateDescription: this.form.templateDescription,
          mappings: this.form.mappings.map(item => ({
            roleName: item.roleName ? item.roleName.trim() : item.roleName,
            speakerCode: item.speakerCode,
            contextText: item.contextText
          }))
        }
        saveVoiceTemplate(payload).then(() => {
          this.$modal.msgSuccess(this.form.templateId ? '编辑成功' : '新增成功')
          this.open = false
          this.getList()
        })
      })
    },
    handleDelete(row) {
      this.$modal
        .confirm(`确认删除模板“${row.templateName}”吗？`)
        .then(() => deleteVoiceTemplate(row.templateId))
        .then(() => {
          this.$modal.msgSuccess('删除成功')
          this.getList()
        })
        .catch(() => {})
    }
  }
}
</script>
