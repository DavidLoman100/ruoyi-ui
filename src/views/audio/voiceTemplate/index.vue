<template>
  <div class="app-container voice-template-page">
    <div class="hero-panel">
      <div class="hero-content">
        <p class="hero-kicker">Audio Studio</p>
        <h2 class="hero-title">语音模板中心</h2>
        <p class="hero-desc">维护角色与语音映射模板，支持按场景快速复用，提升批量合成效率。</p>
      </div>
      <div class="hero-actions">
        <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增模板</el-button>
        <el-button plain icon="el-icon-refresh" @click="getList">刷新数据</el-button>
      </div>
    </div>

    <el-card shadow="never" class="query-card">
      <el-form ref="queryForm" :model="queryParams" :inline="true" size="small" label-width="88px" class="query-form">
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
    </el-card>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">模板总数</div>
        <div class="stat-value">{{ templateCount }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">映射总数</div>
        <div class="stat-value">{{ totalMappingCount }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">可用音色</div>
        <div class="stat-value">{{ roleCount }}</div>
      </div>
    </div>

    <el-card shadow="never" class="table-card">
      <div class="section-head">
        <h3>模板列表</h3>
        <span>展开行可查看角色映射详情</span>
      </div>

      <el-table v-loading="loading" :data="tableList" border class="template-table">
        <el-table-column type="expand" width="46">
          <template slot-scope="scope">
            <div class="expand-wrap">
              <el-table :data="scope.row.mappings || []" border size="mini">
                <el-table-column type="index" label="#" width="50" align="center" />
                <el-table-column prop="roleName" label="角色名称" min-width="120" show-overflow-tooltip />
                <el-table-column prop="speakerCode" label="语音角色编码" min-width="220" show-overflow-tooltip />
                <el-table-column prop="contextText" label="上下文提示词" min-width="180" show-overflow-tooltip />
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column type="index" label="#" width="60" align="center" />
        <el-table-column prop="templateName" label="模板名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="description" label="模板描述" min-width="240" show-overflow-tooltip />
        <el-table-column label="映射数量" width="110" align="center">
          <template slot-scope="scope">
            <el-tag size="mini" effect="dark" type="info">{{ getMappingCount(scope.row) }}</el-tag>
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

    <el-dialog :title="title" :visible.sync="open" width="960px" append-to-body class="template-dialog">
      <el-form ref="form" :model="form" :rules="rules" label-width="110px">
        <div class="form-block">
          <h4>基础信息</h4>
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
        </div>

        <div class="form-block mapping-block">
          <div class="mapping-head">
            <h4>角色语音映射</h4>
            <el-button type="primary" plain size="mini" icon="el-icon-plus" @click="addMapping">新增映射</el-button>
          </div>

          <el-table :data="form.mappings" :row-key="getMappingRowKey" border size="mini" class="mapping-table">
            <el-table-column type="index" label="#" width="50" align="center" />
            <el-table-column label="角色名称" min-width="170">
              <template slot-scope="scope">
                <el-input v-model="scope.row.roleName" placeholder="请输入角色名称" />
              </template>
            </el-table-column>
            <el-table-column label="语音角色" min-width="280">
              <template slot-scope="scope">
                <el-select v-model="scope.row.speakerCode" filterable clearable style="width: 100%;" placeholder="请选择语音角色">
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
        </div>
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
  computed: {
    templateCount() {
      return this.tableList.length
    },
    totalMappingCount() {
      return this.tableList.reduce((sum, item) => sum + this.getMappingCount(item), 0)
    },
    roleCount() {
      return this.roleOptions.length
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
    getMappingCount(row) {
      return (row.mappings || []).length
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

<style scoped>
.voice-template-page {
  background: radial-gradient(circle at 0 0, #f2f6ff 0%, #f7f9ff 38%, #f6f8fc 100%);
  min-height: calc(100vh - 84px);
}

.hero-panel {
  background: linear-gradient(135deg, #1d5eea 0%, #3f8cff 58%, #66a8ff 100%);
  border-radius: 18px;
  color: #fff;
  padding: 24px 26px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 14px 30px rgba(43, 105, 224, 0.26);
}

.hero-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.12em;
  opacity: 0.82;
  text-transform: uppercase;
}

.hero-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.hero-desc {
  margin: 8px 0 0;
  font-size: 13px;
  opacity: 0.9;
  max-width: 540px;
}

.hero-actions {
  flex-shrink: 0;
}

.hero-actions .el-button + .el-button {
  margin-left: 10px;
}

.query-card,
.table-card {
  border: 0;
  border-radius: 14px;
  box-shadow: 0 10px 24px rgba(17, 34, 68, 0.08);
}

.query-card {
  margin-bottom: 14px;
}

.query-form {
  margin-bottom: -18px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #eaf0ff;
  box-shadow: 0 8px 16px rgba(45, 90, 170, 0.08);
}

.stat-label {
  color: #6b7892;
  font-size: 13px;
}

.stat-value {
  margin-top: 6px;
  font-size: 28px;
  line-height: 1;
  color: #1f3f7a;
  font-weight: 600;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.section-head h3 {
  margin: 0;
  font-size: 16px;
  color: #1c2e52;
}

.section-head span {
  color: #8a95ac;
  font-size: 12px;
}

.expand-wrap {
  padding: 8px;
  background: #f8fbff;
  border-radius: 10px;
}

.form-block {
  background: #f8fbff;
  border: 1px solid #e9efff;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 12px;
}

.form-block h4 {
  margin: 0 0 12px;
  color: #2d477d;
  font-size: 14px;
}

.mapping-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.mapping-head h4 {
  margin: 0;
}

.mapping-block {
  margin-bottom: 0;
}

@media (max-width: 992px) {
  .hero-panel {
    display: block;
  }

  .hero-actions {
    margin-top: 14px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
