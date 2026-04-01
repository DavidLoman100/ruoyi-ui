<template>
  <div class="app-container electricity-page">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12">
        <el-card shadow="hover" class="stat-card stat-card-gradient">
          <div class="stat-card-content">
            <div class="stat-icon">
              <i class="el-icon-coin"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">累计电费</div>
              <div class="stat-value highlight">¥ {{ totalCost || '0.00' }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-card shadow="hover" class="stat-card stat-card-blue">
          <div class="stat-card-content">
            <div class="stat-icon">
              <i class="el-icon-trend-charts"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">日均电费</div>
              <div class="stat-value">¥ {{ avgCost || '0.00' }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索表单区域 -->
    <el-card shadow="light" class="search-card">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true">
        <el-form-item label="支出时间">
          <el-date-picker 
            v-model="dateRange" 
            style="width: 240px" 
            value-format="yyyy-MM-dd" 
            type="daterange"
            range-separator="-" 
            start-placeholder="开始日期" 
            end-placeholder="结束日期"
            class="date-picker-custom"
          ></el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button class="quick-btn" @click="setDateRange('month')">本月</el-button>
          <el-button class="quick-btn" @click="setDateRange('lastMonth')">最近一月</el-button>
          <el-button class="quick-btn" @click="setDateRange('lastThreeMonths')">最近三月</el-button>
          <el-button class="quick-btn" @click="setDateRange('year')">今年以来</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="filter-btn" @click="handleQuery">
            <i class="el-icon-search"></i> 搜索
          </el-button>
          <el-button class="reset-btn" @click="resetQuery">
            <i class="el-icon-refresh"></i> 重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 图表区域 -->
    <el-card shadow="light" class="chart-card">
      <div slot="header" class="chart-header">
        <span class="chart-title">
          <i class="el-icon-data-line"></i> 电费趋势图
        </span>
      </div>
      <div class="chart-wrapper">
        <div id="dynamic-chart" class="chart-container"></div>
      </div>
    </el-card>
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

      // 添加折线和点
      this.chart.line();
      this.chart.point()
        .style('fill', 'white')
        .tooltip(true);

      // 首次渲染
      this.updateChartData(this.currentData);
    },

    // 更新图表数据（核心方法）
    updateChartData(data) {
      if (!this.chart) return;
      
      const dataLength = data.length;
      
      // 🔥 X 轴永远只显示固定位置：第一个、最后一个、中间均匀分布的 3-4 个
      let labelCfg = {
        autoRotate: false,               // 不自动旋转
        autoHide: false,                 // 不自动隐藏
        formatter: (val, idx) => {
          // 数据量很少时全显示
          if (dataLength <= 5) {
            return val;
          }
          
          // 计算固定显示位置：首尾 + 中间 4 个等分点
          const positions = [
            0,                                    // 第一个
            Math.floor(dataLength / 5),          // 1/5 位置
            Math.floor(dataLength / 5 * 2),      // 2/5 位置
            Math.floor(dataLength / 5 * 3),      // 3/5 位置
            Math.floor(dataLength / 5 * 4),      // 4/5 位置
            dataLength - 1                        // 最后一个
          ];
          
          // 在这个数组中的索引就显示
          if (positions.includes(idx)) {
            return val;
          }
          return '';
        },
        style: {
          fill: '#aaa',
          fontSize: 12,
          fontWeight: 'bold'
        }
      };
      
      // 更新 X 轴配置
      this.chart.axis('x', labelCfg);
      
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
/* 页面整体布局 */
.electricity-page {
  background: #f5f7fa;
  min-height: calc(100vh - 84px);
  padding: 20px;
}

/* 统计卡片区 */
.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.stat-card-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-card-blue {
  background: linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%);
  color: white;
}

.stat-card-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
}

.stat-icon {
  font-size: 48px;
  opacity: 0.8;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

.stat-info {
  flex: 1;
  text-align: right;
  padding-right: 20px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  font-family: 'DIN Alternate', 'Arial', sans-serif;
}

.stat-value.highlight {
  color: #ffeb3b;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 搜索卡片区 */
.search-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.search-card >>> .el-card__body {
  padding: 18px;
}

.date-picker-custom {
  border-radius: 4px;
}

.quick-btn {
  background: #ecf5ff;
  color: #409EFF;
  border: 1px solid #d9ecff;
  margin-right: 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.quick-btn:hover {
  background: #409EFF;
  color: white;
  border-color: #409EFF;
  transform: translateY(-2px);
}

.filter-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 4px;
  padding: 8px 20px;
  margin-right: 8px;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.reset-btn {
  border-radius: 4px;
  padding: 8px 20px;
  transition: all 0.3s ease;
}

.reset-btn:hover {
  transform: translateY(-2px);
}

/* 图表卡片区 */
.chart-card {
  border-radius: 12px;
  overflow: hidden;
}

.chart-card >>> .el-card__header {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 16px 20px;
  border-bottom: none;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
}

.chart-title i {
  margin-right: 8px;
  color: #667eea;
  font-size: 18px;
}

.chart-wrapper {
  padding: 10px;
  background: #fafafa;
  border-radius: 8px;
}

.chart-container {
  width: 100%;
  min-height: 450px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .electricity-page {
    padding: 10px;
  }
  
  .stat-card-content {
    flex-direction: column;
    text-align: center;
  }
  
  .stat-icon {
    margin-bottom: 15px;
  }
  
  .stat-info {
    text-align: center;
    padding-right: 0;
  }
  
  .stat-value {
    font-size: 24px;
  }
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-card,
.search-card,
.chart-card {
  animation: fadeInUp 0.5s ease forwards;
}

.search-card {
  animation-delay: 0.1s;
}

.chart-card {
  animation-delay: 0.2s;
}
</style>