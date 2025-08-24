<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="支出时间">
        <el-date-picker v-model="dateRange" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期"></el-date-picker>
      </el-form-item>
      <!-- 新增快捷按钮的form-item -->
      <el-form-item>
        <el-button type="primary" plain @click="setDateRange('month')">本月</el-button>
        <el-button type="primary" plain @click="setDateRange('lastMonth')">最近一月</el-button>
        <el-button type="primary" plain @click="setDateRange('lastThreeMonths')">最近三月</el-button>
        <el-button type="primary" plain @click="setDateRange('year')">今年以来</el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icodateRangen="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
      <!-- 展示累计电量 和 日均电量-->
    <el-card class="stats-card" shadow="hover" style="margin: 20px 0;">
      <el-descriptions column="2" border>
        <el-descriptions-item label="累计电费">
          <span class="stat-value">{{ totalCost }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="日均电费">
          <span class="stat-value">{{ avgCost }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
    </el-form>
    <div class="chart-wrapper">
      <!-- 图表容器 -->
      <div id="dynamic-chart" class="chart-container"></div>
    </div>
  </div>

</template>

<script>
import { electricityCostChart } from '@/api/cost/electricity'
import { Chart } from '@antv/g2';

export default {
  name: "dataElectricity",
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      roleList: [],
      title: "",
      largeCostList: [],
      costTypeList: [],  // 大额支出类型
      costTagList: [],   // 大额支出标签
      queryParams: {
        startLifeDate: undefined,
        endLifeDate: undefined
      },
      // 表单参数
      form: {},
      // 日期范围
      dateRange: [],
      chart: null, // 图表实例
      oriData: [
        { lifeDate: '1998', cost: 1 },
      ],
      totalCost: undefined,
      avgCost: undefined,
      currentData: [], // 当前展示数据
    };
  },
  created() {

    this.getList();  // 等字典加载完再拉列表
  },
  mounted() {
    // 🔥 先初始化图表（只执行一次）
    this.initChart();
    // 再赋值 + 更新（若有接口数据，会覆盖默认值）
    this.currentData = [...this.oriData];
    this.updateChartData(this.currentData);
  },

  beforeDestroy() {
    // 销毁图表实例
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  },
  methods: {
    // 初始化图表（只执行一次）
    initChart() {
      // 创建图表实例
      this.chart = new Chart({
        container: 'dynamic-chart',
        autoFit: true,
        height: 400
      });

      // 设置图表基础配置
      this.chart
        .encode('x', 'lifeDate')
        .encode('y', 'cost')
        .scale('x', { range: [0, 1] })
        .scale('y', { domainMin: 0, nice: true });

      // 🔥 移除 label 配置，折线旁不再显示数值
      this.chart.line();
      this.chart.point()
        .style('fill', 'white')
        .tooltip(false);

      // 首次渲染
      this.updateChartData(this.currentData);
    },

    // 更新图表数据（核心方法）
    updateChartData(data) {
      if (!this.chart) return;
      // 更新数据并重新渲染
      this.chart.data(data);
      this.chart.render();
    },

    getList() {
      this.loading = true;
      electricityCostChart(this.queryParams).then(response => {
        this.oriData = response.data.ecVoList;
        this.totalCost = response.data.totalCost;
        this.avgCost = response.data.avgCost;
        this.currentData = [...this.oriData];
        this.loading = false;
        this.updateChartData(this.currentData); // 直接更新数据
      });
    },
    /** 搜索按钮操作 */
    handleQuery() {
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
      this.form = {
        remark: undefined
      };
      this.resetForm("queryForm");
    },

    // 新增：快捷按钮设置日期范围的方法
    setDateRange(type) {
      const now = new Date();
      let start, end;
      switch (type) {
        case 'month':
          // 本月：开始日期为当月1号，结束日期为当天
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date();
          break;
        case 'lastMonth':
          // 最近一月：开始日期为30天前，结束日期为当天
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          end = new Date();
          break;
        case 'lastThreeMonths':
          // 最近三月：开始日期为90天前，结束日期为当天
          start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          end = new Date();
          break;
        case 'year':
          // 今年以来：开始日期为当年1月1号，结束日期为当天
          start = new Date(now.getFullYear(), 0, 1);
          end = new Date();
          break;
        default:
          return;
      }
      // 将日期转换为 yyyy-MM-dd 格式
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      this.dateRange = [formatDate(start), formatDate(end)];
      // 自动触发搜索
      this.handleQuery();
    }
  }

}
</script>

<style scoped>
.chart-wrapper {
  padding: 20px;
}

.chart-container {
  width: 100%;
  min-height: 400px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
}

.chart-actions {
  margin-top: 16px;
  display: flex;
  gap: 10px;
}
</style>