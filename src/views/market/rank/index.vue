<template>
  <div class="app-container">
    <el-form v-show="showSearch" ref="queryForm" :model="queryParams" size="small" :inline="true">
      <el-form-item label="交易日期" prop="tradeDate">
        <el-date-picker
          v-model="queryParams.tradeDate"
          type="date"
          value-format="yyyy-MM-dd"
          placeholder="请选择交易日期"
          clearable
        />
      </el-form-item>
      <el-form-item label="基金代码" prop="fundCode">
        <el-input
          v-model="queryParams.fundCode"
          placeholder="请输入基金代码"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="基金简称" prop="fundShortName">
        <el-input
          v-model="queryParams.fundShortName"
          placeholder="请输入基金简称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item v-if="isExchangeRank" label="基金类型" prop="fundType">
        <el-select
          v-model="queryParams.fundType"
          placeholder="请选择基金类型"
          clearable
          filterable
        >
          <el-option
            v-for="item in fundTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">查询</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-tabs v-model="activeRankType" @tab-click="handleTabChange">
      <el-tab-pane v-for="tab in rankTabs" :key="tab.value" :name="tab.value" :label="tab.label" />
    </el-tabs>

    <el-table v-loading="loading" :data="rankList" stripe border @sort-change="handleSortChange">
      <el-table-column label="序号" type="index" width="70" align="center">
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="排名" prop="rankNo" min-width="80" align="center" sortable="custom" />
      <el-table-column label="基金代码" prop="fundCode" min-width="110" align="center" />
      <el-table-column label="基金简称" prop="fundShortName" min-width="180" show-overflow-tooltip />
      <el-table-column v-if="isExchangeRank" label="基金类型" prop="fundType" min-width="130" align="center" />
      <el-table-column v-if="isHkRank" label="币种" prop="currency" min-width="110" align="center" />

      <el-table-column v-if="isMoneyRank || isFinancialRank" label="万份收益" prop="per10kIncome" min-width="110" align="right" sortable="custom">
        <template slot-scope="scope">{{ formatNumber(scope.row.per10kIncome, 4) }}</template>
      </el-table-column>
      <el-table-column v-if="isMoneyRank || isFinancialRank" label="7日年化" prop="annualizedYield7d" min-width="110" align="right" sortable="custom">
        <template slot-scope="scope"><span :class="getMetricClass(scope.row.annualizedYield7d, 'annualizedYield7d')">{{ formatPercent(scope.row.annualizedYield7d) }}</span></template>
      </el-table-column>

      <el-table-column v-if="isHkRank" label="日增长率" prop="dailyGrowthRate" min-width="110" align="right" sortable="custom">
        <template slot-scope="scope"><span :class="getMetricClass(scope.row.dailyGrowthRate, 'dailyGrowthRate')">{{ formatPercent(scope.row.dailyGrowthRate) }}</span></template>
      </el-table-column>

      <el-table-column label="近一周收益" prop="yield1w" min-width="110" align="right" sortable="custom">
        <template slot-scope="scope"><span :class="getMetricClass(scope.row.yield1w, 'yield1w')">{{ formatPercent(scope.row.yield1w) }}</span></template>
      </el-table-column>
      <el-table-column label="近一个月收益" prop="yield1m" min-width="110" align="right" sortable="custom">
        <template slot-scope="scope"><span :class="getMetricClass(scope.row.yield1m, 'yield1m')">{{ formatPercent(scope.row.yield1m) }}</span></template>
      </el-table-column>
      <el-table-column label="近三个月收益" prop="yield3m" min-width="110" align="right" sortable="custom">
        <template slot-scope="scope"><span :class="getMetricClass(scope.row.yield3m, 'yield3m')">{{ formatPercent(scope.row.yield3m) }}</span></template>
      </el-table-column>
      <el-table-column label="近一年收益" prop="yield1y" min-width="110" align="right" sortable="custom">
        <template slot-scope="scope"><span :class="getMetricClass(scope.row.yield1y, 'yield1y')">{{ formatPercent(scope.row.yield1y) }}</span></template>
      </el-table-column>
      <el-table-column label="今年来收益" prop="yieldYtd" min-width="110" align="right" sortable="custom">
        <template slot-scope="scope"><span :class="getMetricClass(scope.row.yieldYtd, 'yieldYtd')">{{ formatPercent(scope.row.yieldYtd) }}</span></template>
      </el-table-column>

      <el-table-column label="单位净值" prop="unitNav" min-width="110" align="right" sortable="custom">
        <template slot-scope="scope">{{ formatNumber(scope.row.unitNav, 4) }}</template>
      </el-table-column>
      <el-table-column v-if="isExchangeRank" label="累计净值" prop="accumulatedNav" min-width="110" align="right" sortable="custom">
        <template slot-scope="scope">{{ formatNumber(scope.row.accumulatedNav, 4) }}</template>
      </el-table-column>

      <el-table-column v-if="isExchangeRank" label="成立日期" prop="inceptionDate" min-width="110" align="center" sortable="custom" />
      <el-table-column label="榜单日期" prop="tradeDate" min-width="110" align="center" />
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script>
import {
  pageQueryFundExchangeRank,
  pageQueryFundHkRank,
  pageQueryFundMoneyRank,
  pageQueryFundFinancialRank
} from '@/api/market/rank'
import { getDictDetail } from '@/api/base/dict'

const FALLBACK_FUND_TYPES = [
  'STOCK', 'INDEX_STOCK', 'INDEX_OTHER', 'INDEX_OVERSEAS_STOCK', 'QDII_STOCK',
  'QDII_MIX_STOCK_BIAS', 'MIX_BOND_BIAS', 'MIX_STOCK_BIAS', 'MIX_BALANCED',
  'MIX_FLEXIBLE', 'MIX_ABSOLUTE_RETURN', 'QDII_MIX_BALANCED', 'QDII_MIX_FLEXIBLE',
  'BOND_SHORT_MEDIUM', 'BOND_MIX_LEVEL1', 'BOND_MIX_LEVEL2', 'BOND_LONG',
  'INDEX_FIXED_INCOME', 'QDII_MIX_BOND', 'QDII_PURE_BOND', 'MONEY_STANDARD', 'MONEY_FLOAT_NAV'
]

const FUND_TYPE_DICT_CODES = ['stock_fund_type', 'FUND_TYPE', 'FUND_INFO_TYPE', 'PUBLIC_FUND_TYPE']

export default {
  name: 'FundRank',
  data() {
    return {
      loading: false,
      showSearch: true,
      total: 0,
      rankList: [],
      fundTypeOptions: [],
      activeRankType: 'exchange',
      rankTabs: [
        { label: '场内基金', value: 'exchange', orderBy: 'yield1w' },
        { label: '香港基金', value: 'hk', orderBy: 'yield1w' },
        { label: '货币基金', value: 'money', orderBy: 'annualizedYield7d' },
        { label: '理财基金', value: 'financial', orderBy: 'annualizedYield7d' }
      ],
      percentFields: [
        'dailyGrowthRate', 'yield1w', 'yield1m', 'yield3m', 'yield6m', 'yield1y',
        'yield2y', 'yield3y', 'yieldYtd', 'yieldSinceInception', 'annualizedYield7d',
        'annualizedYield14d', 'annualizedYield28d'
      ],
      queryParams: {
        pageNum: 1,
        pageSize: 20,
        tradeDate: undefined,
        fundCode: undefined,
        fundShortName: undefined,
        fundType: undefined,
        orderBy: 'yield1w',
        ascFlag: false
      }
    }
  },
  computed: {
    currentRankConfig() {
      return this.rankTabs.find(item => item.value === this.activeRankType) || this.rankTabs[0]
    },
    isExchangeRank() { return this.activeRankType === 'exchange' },
    isHkRank() { return this.activeRankType === 'hk' },
    isMoneyRank() { return this.activeRankType === 'money' },
    isFinancialRank() { return this.activeRankType === 'financial' }
  },
  created() {
    this.loadFundTypeOptions()
    this.getList()
  },
  methods: {
    async loadFundTypeOptions() {
      for (let i = 0; i < FUND_TYPE_DICT_CODES.length; i += 1) {
        try {
          const response = await getDictDetail(FUND_TYPE_DICT_CODES[i])
          const list = (response && response.data) || []
          if (Array.isArray(list) && list.length > 0) {
            this.fundTypeOptions = list.map(item => ({ label: item.dictLabel || item.dictValue, value: item.dictValue }))
            return
          }
        } catch (error) {}
      }
      this.fundTypeOptions = FALLBACK_FUND_TYPES.map(type => ({ label: type, value: type }))
    },
    getList() {
      this.loading = true
      const requestMap = {
        exchange: pageQueryFundExchangeRank,
        hk: pageQueryFundHkRank,
        money: pageQueryFundMoneyRank,
        financial: pageQueryFundFinancialRank
      }
      const requestFn = requestMap[this.activeRankType] || pageQueryFundExchangeRank
      const params = { ...this.queryParams }
      if (!this.isExchangeRank) {
        delete params.fundType
      }

      requestFn(params).then(response => {
        const pageData = (response && response.data) || {}
        this.rankList = pageData.list || []
        this.total = Number(pageData.total || 0)
      }).finally(() => {
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
        pageSize: 20,
        tradeDate: undefined,
        fundCode: undefined,
        fundShortName: undefined,
        fundType: undefined,
        orderBy: this.currentRankConfig.orderBy,
        ascFlag: false
      }
      this.getList()
    },
    handleTabChange() {
      this.queryParams.pageNum = 1
      this.queryParams.orderBy = this.currentRankConfig.orderBy
      this.queryParams.ascFlag = false
      if (!this.isExchangeRank) {
        this.queryParams.fundType = undefined
      }
      this.getList()
    },
    handleSortChange({ prop, order }) {
      if (!prop || !order) {
        this.queryParams.orderBy = this.currentRankConfig.orderBy
        this.queryParams.ascFlag = false
      } else {
        this.queryParams.orderBy = prop
        this.queryParams.ascFlag = order === 'ascending'
      }
      this.queryParams.pageNum = 1
      this.getList()
    },
    formatNumber(value, digits = 2) {
      if (value === undefined || value === null || value === '') return '-'
      const num = Number(value)
      return Number.isNaN(num) ? '-' : num.toFixed(digits)
    },
    formatPercent(value) {
      if (value === undefined || value === null || value === '') return '-'
      const num = Number(value)
      return Number.isNaN(num) ? '-' : `${num.toFixed(2)}%`
    },
    getMetricClass(value, field) {
      if (!this.percentFields.includes(field)) return ''
      const num = Number(value)
      if (Number.isNaN(num)) return ''
      if (num > 0) return 'metric-up'
      if (num < 0) return 'metric-down'
      return ''
    }
  }
}
</script>

<style scoped>
.metric-up {
  color: #f56c6c;
  font-weight: 600;
}

.metric-down {
  color: #67c23a;
  font-weight: 600;
}
</style>
