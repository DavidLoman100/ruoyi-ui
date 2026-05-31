<template>
  <div class="app-container voice-task-page">
    <div class="hero-panel">
      <div class="hero-content">
        <p class="hero-kicker">Audio Pipeline</p>
        <h2 class="hero-title">语音任务中心</h2>
        <p class="hero-desc">统一管理合成任务、分段进度和结果产出，支持重试、取消与快速回溯。</p>
      </div>
      <div class="hero-actions">
        <el-button type="success" icon="el-icon-plus" @click="openCreateDialog">新建任务</el-button>
        <el-button plain icon="el-icon-refresh" @click="getList">刷新列表</el-button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card total">
        <div class="stat-label">当前页任务</div>
        <div class="stat-value">{{ taskList.length }}</div>
      </div>
      <div class="stat-card running">
        <div class="stat-label">进行中</div>
        <div class="stat-value">{{ runningCount }}</div>
      </div>
      <div class="stat-card success">
        <div class="stat-label">成功</div>
        <div class="stat-value">{{ successCount }}</div>
      </div>
      <div class="stat-card danger">
        <div class="stat-label">失败</div>
        <div class="stat-value">{{ failedCount }}</div>
      </div>
    </div>

    <el-card shadow="never" class="filter-card">
      <el-form ref="queryForm" :model="queryParams" :inline="true" size="small" label-width="84px" class="query-form">
        <el-form-item label="任务编号" prop="taskNo">
          <el-input
            v-model="queryParams.taskNo"
            placeholder="请输入任务编号"
            clearable
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="任务状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择任务状态" clearable style="width: 170px;">
            <el-option v-for="item in taskStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板ID" prop="templateId">
          <el-input-number
            v-model="queryParams.templateId"
            :min="1"
            :controls="false"
            style="width: 170px;"
            placeholder="请输入模板ID"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleQuery">查询</el-button>
          <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="main-card">
      <div class="section-head">
        <h3>任务列表</h3>
        <span>共 {{ total }} 条任务记录</span>
      </div>

      <el-table v-loading="loading" :data="taskList" border class="task-table">
        <el-table-column label="#" width="60" align="center">
          <template slot-scope="scope">
            {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="taskNo" label="任务编号" min-width="230" show-overflow-tooltip />
        <el-table-column prop="templateId" label="模板ID" width="100" align="center" />
        <el-table-column label="任务状态" width="120" align="center">
          <template slot-scope="scope">
            <el-tag size="mini" :type="taskStatusTagType(scope.row.status)" effect="dark">
              {{ taskStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="处理进度" min-width="220">
          <template slot-scope="scope">
            <el-progress :percentage="toPercent(scope.row.progressPercent)" :stroke-width="12" />
          </template>
        </el-table-column>
        <el-table-column label="片段进度" width="120" align="center">
          <template slot-scope="scope">
            {{ Number(scope.row.successSegments || 0) }}/{{ Number(scope.row.totalSegments || 0) }}
          </template>
        </el-table-column>
        <el-table-column label="音频时长" width="110" align="center">
          <template slot-scope="scope">
            {{ formatDuration(scope.row.finalDurationMs) }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" align="center">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.createTime) || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="errorMsg" label="错误信息" min-width="220" show-overflow-tooltip />
        <el-table-column label="操作" width="290" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="handleViewDetail(scope.row)">详情</el-button>
            <el-button type="text" size="mini" @click="handleViewSegments(scope.row)">片段</el-button>
            <el-button type="text" size="mini" @click="handleViewResult(scope.row)">结果</el-button>
            <el-dropdown size="mini" trigger="click" @command="command => handleMoreCommand(command, scope.row)">
              <span class="el-dropdown-link task-more-link">
                更多<i class="el-icon-arrow-down el-icon--right" />
              </span>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="retry">重试失败片段</el-dropdown-item>
                <el-dropdown-item command="retryAll">重新合成音频</el-dropdown-item>
                <el-dropdown-item command="cancel">取消任务</el-dropdown-item>
                <el-dropdown-item command="delete" divided>删除任务</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>

    <el-dialog title="新建音频任务" :visible.sync="createOpen" width="820px" append-to-body>
      <el-form ref="createForm" :model="createForm" :rules="createRules" label-width="90px">
        <el-form-item label="模板" prop="templateId">
          <el-select v-model="createForm.templateId" filterable clearable placeholder="请选择音色模板" style="width: 100%;">
            <el-option
              v-for="item in templateOptions"
              :key="item.templateId"
              :label="item.templateName + ' (ID:' + item.templateId + ')'"
              :value="item.templateId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="原始文本" prop="rawText">
          <el-input
            v-model="createForm.rawText"
            type="textarea"
            :rows="12"
            placeholder="请输入多角色文本，例如：[男主]: 你好，欢迎来到演示场景。"
          />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="createOpen = false">取消</el-button>
        <el-button @click="resetCreateForm">清空</el-button>
        <el-button type="primary" :loading="createLoading" @click="handleCreateTask">创建任务</el-button>
      </span>
    </el-dialog>

    <el-dialog title="任务详情" :visible.sync="detailOpen" width="760px" append-to-body>
      <el-descriptions v-if="detailData" border :column="2" size="small">
        <el-descriptions-item label="任务ID">{{ detailData.taskId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="任务编号">{{ detailData.taskNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="模板ID">{{ detailData.templateId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="任务状态">
          <el-tag size="mini" :type="taskStatusTagType(detailData.status)">
            {{ taskStatusLabel(detailData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="总片段">{{ detailData.totalSegments || 0 }}</el-descriptions-item>
        <el-descriptions-item label="成功片段">{{ detailData.successSegments || 0 }}</el-descriptions-item>
        <el-descriptions-item label="失败片段">{{ detailData.failedSegments || 0 }}</el-descriptions-item>
        <el-descriptions-item label="处理进度">{{ toPercent(detailData.progressPercent) }}%</el-descriptions-item>
        <el-descriptions-item label="结果地址" :span="2">
          <a v-if="detailData.finalOssUrl" :href="detailData.finalOssUrl" target="_blank">{{ detailData.finalOssUrl }}</a>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="最终时长">{{ formatDuration(detailData.finalDurationMs) }}</el-descriptions-item>
        <el-descriptions-item label="错误信息">{{ detailData.errorMsg || '-' }}</el-descriptions-item>
      </el-descriptions>
      <span slot="footer" class="dialog-footer">
        <el-button @click="detailOpen = false">关闭</el-button>
      </span>
    </el-dialog>

    <el-dialog title="任务片段" :visible.sync="segmentsOpen" width="92%" append-to-body>
      <el-alert
        title="提示：编辑文案、重排、删除、单片段重跑仅保存片段结果，不会自动合成；请手动触发“重新合成当前任务”。"
        type="warning"
        :closable="false"
        class="segment-tip"
      />
      <div class="segment-table-wrap">
        <el-table v-loading="segmentsLoading" :data="segmentList" border size="mini" class="segment-table">
          <el-table-column label="#" width="55" align="center" type="index" />
          <el-table-column prop="segmentNo" label="片段序号" width="90" align="center" />
          <el-table-column prop="roleName" label="角色名" width="96" show-overflow-tooltip />
          <el-table-column prop="textContent" label="文本内容" min-width="260" show-overflow-tooltip />
          <el-table-column label="状态" width="90" align="center">
            <template slot-scope="scope">
              <el-tag size="mini" :type="segmentStatusTagType(scope.row.status)">
                {{ scope.row.status || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="retryCount" label="重试" width="64" align="center" />
          <el-table-column prop="durationMs" label="时长" width="90" align="center">
            <template slot-scope="scope">
              {{ formatDuration(scope.row.durationMs) }}
            </template>
          </el-table-column>
          <el-table-column prop="ossUrl" label="试听" width="150" align="center">
            <template slot-scope="scope">
              <div v-if="scope.row.ossUrl" class="segment-audio-cell">
                <audio :src="scope.row.ossUrl" controls class="segment-audio-player" />
                <a :href="scope.row.ossUrl" target="_blank">打开</a>
              </div>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="详情" width="80" align="center">
            <template slot-scope="scope">
              <el-button type="text" size="mini" @click="handleViewSegmentMeta(scope.row)">查看</el-button>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="130" align="center" fixed="right">
            <template slot-scope="scope">
              <el-dropdown size="mini" trigger="click" @command="command => handleSegmentCommand(command, scope.row, scope.$index)">
                <span class="el-dropdown-link task-more-link">
                  操作<i class="el-icon-arrow-down el-icon--right" />
                </span>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="edit">编辑文案</el-dropdown-item>
                  <el-dropdown-item command="retry">重跑片段</el-dropdown-item>
                  <el-dropdown-item :disabled="scope.$index === 0 || segmentActionLoading" command="up">上移</el-dropdown-item>
                  <el-dropdown-item :disabled="scope.$index === segmentList.length - 1 || segmentActionLoading" command="down">下移</el-dropdown-item>
                  <el-dropdown-item :disabled="segmentActionLoading" command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="warning" :disabled="!currentSegmentTaskId" @click="handleRetryAllByTaskId(currentSegmentTaskId)">重新合成当前任务</el-button>
        <el-button @click="segmentsOpen = false">关闭</el-button>
      </span>
    </el-dialog>

    <el-dialog title="编辑片段文案" :visible.sync="segmentEditOpen" width="680px" append-to-body>
      <el-form ref="segmentEditForm" :model="segmentEditForm" :rules="segmentEditRules" label-width="90px">
        <el-form-item label="角色">
          <el-input v-model="segmentEditForm.roleName" disabled />
        </el-form-item>
        <el-form-item label="片段文案" prop="textContent">
          <el-input v-model="segmentEditForm.textContent" type="textarea" :rows="8" placeholder="请输入片段文案" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="segmentEditOpen = false">取消</el-button>
        <el-button type="primary" :loading="segmentEditLoading" @click="submitSegmentText">保存</el-button>
      </span>
    </el-dialog>

    <el-dialog title="片段详情" :visible.sync="segmentMetaOpen" width="760px" append-to-body>
      <el-descriptions v-if="segmentMetaData" border :column="2" size="small">
        <el-descriptions-item label="片段序号">{{ segmentMetaData.segmentNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="角色名">{{ segmentMetaData.roleName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="音色编码">{{ segmentMetaData.speakerCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="重试次数">{{ segmentMetaData.retryCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="请求ID" :span="2">{{ segmentMetaData.requestId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="错误信息" :span="2">{{ segmentMetaData.errorMsg || '-' }}</el-descriptions-item>
      </el-descriptions>
      <span slot="footer" class="dialog-footer">
        <el-button @click="segmentMetaOpen = false">关闭</el-button>
      </span>
    </el-dialog>

    <el-dialog title="任务结果" :visible.sync="resultOpen" width="860px" append-to-body>
      <el-descriptions v-if="resultData" border :column="2" size="small">
        <el-descriptions-item label="任务ID">{{ resultData.taskId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="任务编号">{{ resultData.taskNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="模板ID">{{ resultData.templateId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="任务状态">
          <el-tag size="mini" :type="taskStatusTagType(resultData.status)">
            {{ taskStatusLabel(resultData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="播放地址" :span="2">
          <template v-if="resultData.playUrl">
            <a :href="resultData.playUrl" target="_blank">{{ resultData.playUrl }}</a>
            <el-button
              v-clipboard:copy="resultData.playUrl"
              v-clipboard:success="copyPlayUrlSuccess"
              v-clipboard:error="copyUrlError"
              type="text"
              icon="el-icon-document-copy"
            >
              复制链接
            </el-button>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="下载地址" :span="2">
          <template v-if="resultData.downloadUrl">
            <a :href="resultData.downloadUrl" target="_blank">{{ resultData.downloadUrl }}</a>
            <el-button
              v-clipboard:copy="resultData.downloadUrl"
              v-clipboard:success="copyDownloadUrlSuccess"
              v-clipboard:error="copyUrlError"
              type="text"
              icon="el-icon-document-copy"
            >
              复制链接
            </el-button>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="时长">{{ formatDuration(resultData.durationMs) }}</el-descriptions-item>
        <el-descriptions-item label="文件大小">{{ formatFileSize(resultData.fileSize) }}</el-descriptions-item>
      </el-descriptions>

      <div v-if="resultData && resultData.playUrl" class="audio-box">
        <div class="audio-box-title">试听播放器</div>
        <audio :src="resultData.playUrl" controls style="width: 100%;" />
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button @click="handleRefreshResult">刷新结果</el-button>
        <el-button @click="resultOpen = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { listVoiceTemplates } from '@/api/audio/voiceTemplate'
import {
  createVoiceTask,
  getVoiceTask,
  getVoiceTaskSegments,
  updateVoiceTaskSegmentText,
  reorderVoiceTaskSegments,
  deleteVoiceTaskSegment,
  retryVoiceTaskSegment,
  retryVoiceTask,
  resynthesizeVoiceTask,
  cancelVoiceTask,
  getVoiceTaskResult,
  getVoiceTaskDownloadUrl,
  pageVoiceTasks,
  deleteVoiceTask
} from '@/api/audio/voiceTask'

const TASK_STATUS_OPTIONS = [
  { value: 'CREATED', label: '待处理' },
  { value: 'SYNTHESIZING', label: '合成中' },
  { value: 'MERGING', label: '合并中' },
  { value: 'SUCCESS', label: '成功' },
  { value: 'FAILED', label: '失败' },
  { value: 'CANCELED', label: '已取消' }
]

export default {
  name: 'VoiceTask',
  data() {
    return {
      loading: false,
      createLoading: false,
      createOpen: false,
      total: 0,
      taskList: [],
      templateOptions: [],
      taskStatusOptions: TASK_STATUS_OPTIONS,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        status: undefined,
        templateId: undefined,
        taskNo: undefined
      },
      createForm: {
        templateId: undefined,
        rawText: undefined
      },
      createRules: {
        templateId: [{ required: true, message: '模板不能为空', trigger: 'change' }],
        rawText: [{ required: true, message: '原始文本不能为空', trigger: 'blur' }]
      },
      detailOpen: false,
      detailData: null,
      segmentsOpen: false,
      segmentsLoading: false,
      segmentActionLoading: false,
      segmentList: [],
      currentSegmentTaskId: undefined,
      segmentEditOpen: false,
      segmentEditLoading: false,
      segmentEditForm: {
        segmentId: undefined,
        roleName: '',
        textContent: ''
      },
      segmentEditRules: {
        textContent: [{ required: true, message: '片段文案不能为空', trigger: 'blur' }]
      },
      segmentMetaOpen: false,
      segmentMetaData: null,
      resultOpen: false,
      resultData: null,
      currentResultTaskId: undefined
    }
  },
  computed: {
    runningCount() {
      return this.taskList.filter(item => item.status === 'SYNTHESIZING' || item.status === 'MERGING').length
    },
    successCount() {
      return this.taskList.filter(item => item.status === 'SUCCESS').length
    },
    failedCount() {
      return this.taskList.filter(item => item.status === 'FAILED').length
    }
  },
  created() {
    this.getTemplateOptions()
    this.getList()
  },
  methods: {
    getTemplateOptions() {
      listVoiceTemplates().then(res => {
        this.templateOptions = res.data || []
      })
    },
    getList() {
      this.loading = true
      const params = { ...this.queryParams }
      if (!params.status) delete params.status
      if (!params.templateId) delete params.templateId
      if (!params.taskNo) delete params.taskNo
      pageVoiceTasks(params)
        .then(res => {
          const page = res.data || {}
          this.taskList = page.records || page.list || []
          this.total = Number(page.total || 0)
        })
        .finally(() => {
          this.loading = false
        })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        status: undefined,
        templateId: undefined,
        taskNo: undefined
      }
      this.getList()
    },
    openCreateDialog() {
      this.resetCreateForm()
      this.createOpen = true
    },
    resetCreateForm() {
      this.createForm = {
        templateId: undefined,
        rawText: undefined
      }
      this.resetForm('createForm')
    },
    handleCreateTask() {
      this.$refs.createForm.validate(valid => {
        if (!valid) return
        this.createLoading = true
        const payload = {
          templateId: this.createForm.templateId,
          rawText: (this.createForm.rawText || '').trim()
        }
        createVoiceTask(payload)
          .then(res => {
            const task = (res && res.data) || {}
            const taskNoText = task.taskNo ? `，任务编号：${task.taskNo}` : ''
            this.$modal.msgSuccess(`创建成功，任务ID：${task.taskId || '-'}${taskNoText}`)
            this.createOpen = false
            this.resetCreateForm()
            this.queryParams.pageNum = 1
            this.getList()
          })
          .finally(() => {
            this.createLoading = false
          })
      })
    },
    handleViewDetail(row) {
      getVoiceTask(row.taskId).then(res => {
        this.detailData = res.data || {}
        this.detailOpen = true
      })
    },
    handleViewSegments(row) {
      this.currentSegmentTaskId = row.taskId
      this.segmentsLoading = true
      getVoiceTaskSegments(row.taskId)
        .then(res => {
          this.segmentList = res.data || []
          this.segmentsOpen = true
        })
        .finally(() => {
          this.segmentsLoading = false
        })
    },
    reloadSegments() {
      if (!this.currentSegmentTaskId) return
      this.segmentsLoading = true
      getVoiceTaskSegments(this.currentSegmentTaskId)
        .then(res => {
          this.segmentList = res.data || []
        })
        .finally(() => {
          this.segmentsLoading = false
        })
    },
    openEditSegmentDialog(row) {
      this.segmentEditForm = {
        segmentId: row.segmentId,
        roleName: row.roleName || '',
        textContent: row.textContent || ''
      }
      this.segmentEditOpen = true
      this.$nextTick(() => {
        if (this.$refs.segmentEditForm) {
          this.$refs.segmentEditForm.clearValidate()
        }
      })
    },
    submitSegmentText() {
      this.$refs.segmentEditForm.validate(valid => {
        if (!valid) return
        if (!this.currentSegmentTaskId || !this.segmentEditForm.segmentId) return
        this.segmentEditLoading = true
        const payload = {
          textContent: (this.segmentEditForm.textContent || '').trim()
        }
        if (!payload.textContent) {
          this.segmentEditLoading = false
          this.$modal.msgError('片段文案不能为空')
          return
        }
        updateVoiceTaskSegmentText(this.currentSegmentTaskId, this.segmentEditForm.segmentId, payload)
          .then(() => {
            this.$modal.msgSuccess('片段文案已保存，请手动触发重新合成音频')
            this.segmentEditOpen = false
            this.reloadSegments()
            this.getList()
          })
          .finally(() => {
            this.segmentEditLoading = false
          })
      })
    },
    handleMoveSegment(index, direction) {
      if (!this.currentSegmentTaskId || this.segmentActionLoading) return
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= this.segmentList.length) return
      const ids = this.segmentList.map(item => item.segmentId)
      const temp = ids[index]
      ids[index] = ids[targetIndex]
      ids[targetIndex] = temp
      this.segmentActionLoading = true
      reorderVoiceTaskSegments(this.currentSegmentTaskId, { segmentIds: ids })
        .then(() => {
          this.$modal.msgSuccess('片段顺序已保存，请手动触发重新合成音频')
          this.reloadSegments()
          this.getList()
        })
        .finally(() => {
          this.segmentActionLoading = false
        })
    },
    handleSegmentCommand(command, row, index) {
      if (command === 'edit') {
        this.openEditSegmentDialog(row)
      } else if (command === 'retry') {
        this.handleRetrySegment(row)
      } else if (command === 'up') {
        this.handleMoveSegment(index, -1)
      } else if (command === 'down') {
        this.handleMoveSegment(index, 1)
      } else if (command === 'delete') {
        this.handleDeleteSegment(row)
      }
    },
    handleViewSegmentMeta(row) {
      this.segmentMetaData = row || null
      this.segmentMetaOpen = true
    },
    handleDeleteSegment(row) {
      if (!this.currentSegmentTaskId) return
      this.$modal
        .confirm(`确认删除片段“${row.segmentNo}”吗？`)
        .then(() => {
          this.segmentActionLoading = true
          return deleteVoiceTaskSegment(this.currentSegmentTaskId, row.segmentId)
        })
        .then(() => {
          this.$modal.msgSuccess('片段已删除，请手动触发重新合成音频')
          this.reloadSegments()
          this.getList()
        })
        .catch(() => {})
        .finally(() => {
          this.segmentActionLoading = false
        })
    },
    handleRetrySegment(row) {
      if (!this.currentSegmentTaskId) return
      this.$modal
        .confirm(`确认重跑片段“${row.segmentNo}”吗？`)
        .then(() => {
          this.segmentActionLoading = true
          return retryVoiceTaskSegment(this.currentSegmentTaskId, row.segmentId)
        })
        .then(() => {
          this.$modal.msgSuccess('已提交单片段重跑，请按需手动触发重新合成当前任务')
          this.reloadSegments()
          this.getList()
        })
        .catch(() => {})
        .finally(() => {
          this.segmentActionLoading = false
        })
    },
    handleRetryAllByTaskId(taskId) {
      if (!taskId) return
      this.$modal
        .confirm('确认重新合成当前任务音频吗？')
        .then(() => resynthesizeVoiceTask(taskId))
        .then(() => {
          this.$modal.msgSuccess('已触发重新合成音频')
          this.getList()
        })
        .catch(() => {})
    },
    handleViewResult(row) {
      this.currentResultTaskId = row.taskId
      this.loadTaskResult(row.taskId)
    },
    handleRefreshResult() {
      if (!this.currentResultTaskId) return
      this.loadTaskResult(this.currentResultTaskId)
    },
    loadTaskResult(taskId) {
      getVoiceTaskResult(taskId).then(resultRes => {
        const result = resultRes.data || {}
        getVoiceTaskDownloadUrl(taskId)
          .then(downloadRes => {
            const downloadUrl = downloadRes.data
            if (!result.downloadUrl && downloadUrl) {
              result.downloadUrl = downloadUrl
            }
          })
          .catch(() => {})
          .finally(() => {
            this.resultData = result
            this.resultOpen = true
          })
      })
    },
    handleMoreCommand(command, row) {
      if (command === 'retry') {
        this.handleRetry(row)
      } else if (command === 'retryAll') {
        this.handleRetryAll(row)
      } else if (command === 'cancel') {
        this.handleCancel(row)
      } else if (command === 'delete') {
        this.handleDelete(row)
      }
    },
    handleRetry(row) {
      this.$modal
        .confirm(`确认重试任务“${row.taskNo}”的失败片段吗？`)
        .then(() => retryVoiceTask(row.taskId))
        .then(() => {
          this.$modal.msgSuccess('已触发失败片段重试')
          this.getList()
        })
        .catch(() => {})
    },
    handleRetryAll(row) {
      this.$modal
        .confirm(`确认重新合成任务“${row.taskNo}”的音频吗？`)
        .then(() => resynthesizeVoiceTask(row.taskId))
        .then(() => {
          this.$modal.msgSuccess('已触发重新合成音频')
          this.getList()
        })
        .catch(() => {})
    },
    handleCancel(row) {
      this.$modal
        .confirm(`确认取消任务“${row.taskNo}”吗？`)
        .then(() => cancelVoiceTask(row.taskId))
        .then(() => {
          this.$modal.msgSuccess('取消成功')
          this.getList()
        })
        .catch(() => {})
    },
    handleDelete(row) {
      this.$modal
        .confirm(`确认删除任务“${row.taskNo}”吗？`)
        .then(() => deleteVoiceTask(row.taskId))
        .then(() => {
          this.$modal.msgSuccess('删除成功')
          this.getList()
        })
        .catch(() => {})
    },
    taskStatusLabel(status) {
      const target = this.taskStatusOptions.find(item => item.value === status)
      return target ? target.label : status || '-'
    },
    taskStatusTagType(status) {
      if (status === 'SUCCESS') return 'success'
      if (status === 'FAILED') return 'danger'
      if (status === 'CANCELED') return 'info'
      if (status === 'SYNTHESIZING' || status === 'MERGING') return 'warning'
      return ''
    },
    segmentStatusTagType(status) {
      if (status === 'SUCCESS') return 'success'
      if (status === 'FAILED') return 'danger'
      if (status === 'RUNNING') return 'warning'
      if (status === 'PENDING') return 'info'
      return ''
    },
    toPercent(value) {
      const num = Number(value)
      if (Number.isNaN(num)) return 0
      if (num < 0) return 0
      if (num > 100) return 100
      return Math.round(num)
    },
    formatDuration(durationMs) {
      if (durationMs === undefined || durationMs === null || durationMs === '') return '-'
      const totalSeconds = Math.floor(Number(durationMs) / 1000)
      if (Number.isNaN(totalSeconds)) return '-'
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
      if (minutes > 0) return `${minutes}m ${seconds}s`
      return `${seconds}s`
    },
    formatFileSize(fileSize) {
      if (fileSize === undefined || fileSize === null || fileSize === '') return '-'
      const bytes = Number(fileSize)
      if (Number.isNaN(bytes) || bytes < 0) return '-'
      if (bytes < 1024) return `${bytes} B`
      const kb = bytes / 1024
      if (kb < 1024) return `${kb.toFixed(2)} KB`
      const mb = kb / 1024
      if (mb < 1024) return `${mb.toFixed(2)} MB`
      const gb = mb / 1024
      return `${gb.toFixed(2)} GB`
    },
    copyPlayUrlSuccess() {
      this.$modal.msgSuccess('播放链接复制成功')
    },
    copyDownloadUrlSuccess() {
      this.$modal.msgSuccess('下载链接复制成功')
    },
    copyUrlError() {
      this.$modal.msgError('复制失败，请手动复制')
    }
  }
}
</script>

<style scoped>
.voice-task-page {
  background: radial-gradient(circle at right top, #edf8f6 0%, #f5f8fc 32%, #f8fbff 100%);
  min-height: calc(100vh - 84px);
}

.hero-panel {
  border-radius: 18px;
  background: linear-gradient(130deg, #0f766e 0%, #1f9a8f 52%, #59b8ad 100%);
  color: #fff;
  padding: 24px 26px;
  margin-bottom: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 14px 32px rgba(24, 121, 111, 0.28);
}

.hero-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.85;
}

.hero-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.hero-desc {
  margin: 8px 0 0;
  opacity: 0.92;
  font-size: 13px;
  max-width: 560px;
}

.hero-actions {
  flex-shrink: 0;
}

.hero-actions .el-button + .el-button {
  margin-left: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.stat-card {
  border-radius: 12px;
  padding: 15px;
  border: 1px solid #e4eef4;
  background: #fff;
  box-shadow: 0 8px 18px rgba(30, 56, 96, 0.08);
}

.stat-label {
  font-size: 13px;
  color: #6a7a90;
}

.stat-value {
  margin-top: 6px;
  font-size: 30px;
  line-height: 1;
  font-weight: 600;
  color: #163865;
}

.stat-card.running .stat-value {
  color: #d97706;
}

.stat-card.success .stat-value {
  color: #0f766e;
}

.stat-card.danger .stat-value {
  color: #be123c;
}

.filter-card,
.main-card {
  border: 0;
  border-radius: 14px;
  box-shadow: 0 10px 24px rgba(17, 34, 68, 0.08);
}

.filter-card {
  margin-bottom: 14px;
}

.query-form {
  margin-bottom: -18px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}

.section-head h3 {
  margin: 0;
  font-size: 16px;
  color: #1d3253;
}

.section-head span {
  color: #7e8aa2;
  font-size: 12px;
}

.task-more-link {
  color: #138674;
  font-size: 12px;
  cursor: pointer;
  font-weight: 600;
}

.segment-tip {
  margin-bottom: 10px;
}

.segment-table-wrap {
  max-height: 58vh;
  overflow-y: auto;
  overflow-x: auto;
}

.segment-audio-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.segment-audio-player {
  width: 132px;
  height: 28px;
}

.audio-box {
  margin-top: 16px;
  padding: 12px;
  border: 1px solid #d8ebe7;
  background: #f4fbf9;
  border-radius: 10px;
}

.audio-box-title {
  margin-bottom: 10px;
  color: #22584f;
  font-weight: 600;
  font-size: 13px;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
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
