<template>
  <div class="app-container electricity-page">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card stat-card-primary">
          <div class="stat-card-content">
            <div class="stat-icon-wrap">
              <div class="stat-icon pulse">
                <i class="el-icon-coin"></i>
              </div>
            </div>
            <div class="stat-info">
              <div class="stat-label">累计电费</div>
              <div class="stat-value highlight">
                <span class="currency">¥</span>{{ formatMoney(totalCost) }}
              </div>
              <div class="stat-trend" v-if="totalCost > 0">
                <i class="el-icon-top-right"></i> 总支出
              </div>
            </div>
          </div>
          <div class="stat-decoration"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card stat-card-success">
          <div class="stat-card-content">
            <div class="stat-icon-wrap">
              <div class="stat-icon">
                <i class="el-icon-data-line"></i>
              </div>
            </div>
            <div class="stat-info">
              <div class="stat-label">日均电费</div>
              <div class="stat-value">
                <span class="currency">¥</span>{{ formatMoney(avgCost) }}
              </div>
              <div class="stat-trend success" v-if="avgCost > 0">
                <i class="el-icon-s-data"></i> 平均值
              </div>
            </div>
          </div>
          <div class="stat-decoration"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card stat-card-warning">
          <div class="stat-card-content">
            <div class="stat-icon-wrap">
              <div class="stat-icon">
                <i class="el-icon-top"></i>
              </div>
            </div>
            <div class="stat-info">
              <div class="stat-label">最高电费</div>
              <div class="stat-value">
                <span class="currency">¥</span>{{ formatMoney(maxCost) }}
              </div>
              <div class="stat-trend warning" v-if="maxCostDate">
                <i class="el-icon-date"></i> {{ maxCostDate }}
              </div>
            </div>
          </div>
          <div class="stat-decoration"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card stat-card-info">
          <div class="stat-card-content">
            <div class="stat-icon-wrap">
              <div class="stat-icon">
                <i class="el-icon-document"></i>
              </div>
            </div>
            <div class="stat-info">
              <div class="stat-label">用电天数</div>
              <div class="stat-value">{{ dataCount || 0 }}
                <span class="unit">天</span>
              </div>
              <div class="stat-trend info" v-if="dataCount > 0">
                <i class="el-icon-s-order"></i> 记录数
              </div>
            </div>
          </div>
          <div class="stat-decoration"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索表单区域 -->
    <el-card shadow="never" class="search-card">
      <div class="search-header">
        <span class="search-title">
          <i class="el-icon-search"></i> 数据筛选
        </span>
      </div>
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="search-form">
        <el-form-item label="支出时间">
          <el-date-picker 
            v-model="dateRange" 
            style="width: 260px" 
            value-format="yyyy-MM-dd" 
            type="daterange"
            range-separator="至" 
            start-placeholder="开始日期" 
            end-placeholder="结束日期"
            class="date-picker-custom"
          ></el-date-picker>
        </el-form-item>
        <el-form-item class="quick-btns">
          <el-button-group>
            <el-button size="small" :type="activeQuickBtn === 'month' ? 'primary' : ''" @click="setDateRange('month')">本月</el-button>
            <el-button size="small" :type="activeQuickBtn === 'lastMonth' ? 'primary' : ''" @click="setDateRange('lastMonth')">最近一月</el-button>
            <el-button size="small" :type="activeQuickBtn === 'lastThreeMonths' ? 'primary' : ''" @click="setDateRange('lastThreeMonths')">最近三月</el-button>
            <el-button size="small" :type="activeQuickBtn === 'year' ? 'primary' : ''" @click="setDateRange('year')">今年以来</el-button>
          </el-button-group>
        </el-form-item>
        <el-form-item class="search-actions">
          <el-button type="primary" class="filter-btn" @click="handleQuery" :loading="loading">
            <i class="el-icon-search"></i> 查询
          </el-button>
          <el-button class="reset-btn" @click="resetQuery">
            <i class="el-icon-refresh-right"></i> 重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 图表区域 -->
    <el-card shadow="never" class="chart-card">
      <div slot="header" class="chart-header">
        <div class="chart-title-wrap">
          <span class="chart-title">
            <i class="el-icon-data-line"></i> 电费趋势分析
          </span>
          <span class="chart-subtitle" v-if="currentData.length > 0">
            共 {{ currentData.length }} 条数据记录
          </span>
        </div>
        <div class="chart-actions">
          <el-tooltip content="刷新数据" placement="top">
            <el-button type="text" class="refresh-btn" @click="getList" :loading="loading">
              <i class="el-icon-refresh" :class="{ 'is-loading': loading }"></i>
            </el-button>
          </el-tooltip>
        </div>
      </div>
      <div class="chart-wrapper">
        <div v-if="loading" class="chart-loading">
          <i class="el-icon-loading"></i>
          <span>数据加载中...</span>
        </div>
        <div v-else-if="currentData.length === 0" class="chart-empty">
          <i class="el-icon-data-analysis"></i>
          <p>暂无数据</p>
          <span>请选择其他时间范围或添加数据</span>
        </div>
        <div v-else id="dynamic-chart" class="chart-container"></div>
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
      maxCost: undefined,      // 最高电费
      maxCostDate: undefined,  // 最高电费日期
      dataCount: 0,            // 数据条数
      activeQuickBtn: '',      // 当前激活的快捷按钮
      currentData: [], // 当前展示数据
    };
  },
  created() {

    this.getList();  // 等字典加载完再拉列表
  },
  mounted() {
    // 图表初始化移到 getList 中，等待数据加载完成后再初始化
  },

  beforeDestroy() {
    // 销毁图表实例
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  },
  methods: {
    // 初始化图表
    initChart(data) {
      // 检查容器是否存在
      const container = document.getElementById('dynamic-chart');
      if (!container) {
        console.error('图表容器不存在');
        return false;
      }
        
      // 创建图表实例（带 tooltip 配置）
      this.chart = new Chart({
        container: 'dynamic-chart',
        autoFit: true,
        height: 420
      });
        
      // 设置数据
      this.chart.data(data);
        
      // 设置比例尺
      this.chart
        .scale('x', { 
          range: [0.02, 0.98],
          padding: 0.05,
          alias: '日期'
        })
        .scale('y', { 
          domainMin: 0, 
          nice: true,
          alias: '金额（元）'
        });
            
      // 设置坐标轴样式
      this.chart.axis('x', {
        title: '日期',
        titleFontSize: 12,
        titleFontColor: '#666',
        tickLine: null,
        line: {
          style: {
            stroke: '#e8e8e8',
            lineWidth: 1
          }
        },
        labelFormatter: (val) => val,
        labelSpacing: 8
      });
            
      this.chart.axis('y', {
        title: '金额（元）',
        titleFontSize: 12,
        titleFontColor: '#666',
        grid: {
          line: {
            style: {
              stroke: '#f0f0f0',
              lineWidth: 1,
              lineDash: [4, 4]
            }
          }
        },
        labelFormatter: (val) => `¥${val}`,
        labelSpacing: 8
      });
            
      // 添加面积图（渐变效果）- 不显示tooltip
      this.chart.area()
        .encode('x', 'lifeDate')
        .encode('y', 'cost')
        .style('fill', 'l(270) 0:#36cfc940 0.5:#1890ff20 1:#1890ff05')
        .tooltip(false);
            
      // 添加折线（渐变色）- 不显示tooltip
      this.chart.line()
        .encode('x', 'lifeDate')
        .encode('y', 'cost')
        .style('stroke', '#1890ff')
        .style('lineWidth', 3)
        .style('lineCap', 'round')
        .style('lineJoin', 'round')
        .tooltip(false);
            
      // 添加数据点 - 只在数据点上显示tooltip
      this.chart.point()
        .encode('x', 'lifeDate')
        .encode('y', 'cost')
        .style('fill', '#fff')
        .style('stroke', '#1890ff')
        .style('lineWidth', 2.5)
        .style('r', 6)
        .tooltip({
          title: (d) => d.lifeDate,
          items: [
            (d) => ({
              name: '金额',
              value: `¥${Number(d.cost).toFixed(2)}`
            })
          ]
        });
        
      // 渲染图表
      this.chart.render();
      return true;
    },

    // 更新图表数据
    updateChartData(data) {
      if (!this.chart) {
        console.log('图表实例不存在');
        return;
      }
          
      if (!data || data.length === 0) {
        console.log('没有数据可渲染');
        return;
      }
          
      const dataLength = data.length;
          
      // 计算需要显示的 X 轴标签位置
      const labelPositions = dataLength <= 5 
        ? Array.from({ length: dataLength }, (_, i) => i)  // 少量数据全显示
        : [0, Math.floor(dataLength / 5), Math.floor(dataLength / 5 * 2), 
           Math.floor(dataLength / 5 * 3), Math.floor(dataLength / 5 * 4), dataLength - 1];
          
      // 更新 X 轴标签显示
      this.chart.axis('x', {
        title: false,
        tickLine: null,
        line: {
          style: {
            stroke: '#e8e8e8',
            lineWidth: 1
          }
        },
        labelFormatter: (val, idx) => {
          return labelPositions.includes(idx) ? val : '';
        },
        labelSpacing: 8,
        labelAutoHide: false,
        labelAutoRotate: false
      });
          
      // 更新数据并重新渲染
      this.chart.data(data);
      this.chart.render();
    },

    getList() {
      this.loading = true;
      // 销毁旧的图表实例（因为 loading 状态会切换，导致容器被销毁）
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
      electricityCostChart(this.queryParams).then(response => {
        this.oriData = response.data.ecVoList || [];
        this.totalCost = response.data.totalCost;
        this.avgCost = response.data.avgCost;
        this.currentData = [...this.oriData];
        this.dataCount = this.oriData.length;
                
        // 计算最高电费
        if (this.oriData.length > 0) {
          const maxItem = this.oriData.reduce((max, item) => 
            (item.cost > max.cost) ? item : max, this.oriData[0]);
          this.maxCost = maxItem.cost;
          this.maxCostDate = maxItem.lifeDate;
        } else {
          this.maxCost = 0;
          this.maxCostDate = '';
        }
                
        this.loading = false;
                    
        // 等待 DOM 更新后再初始化/更新图表
        this.$nextTick(() => {
          if (this.currentData.length > 0) {
            if (!this.chart) {
              this.initChart(this.currentData);
            } else {
              this.updateChartData(this.currentData);
            }
          }
        });
      }).catch(() => {
        this.loading = false;
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
      this.activeQuickBtn = '';
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
      this.activeQuickBtn = type;  // 设置当前激活的按钮
      // 自动触发搜索
      this.handleQuery();
    },
    
    // 格式化金额
    formatMoney(value) {
      if (value === undefined || value === null) return '0.00';
      const num = Number(value);
      if (isNaN(num)) return '0.00';
      return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
  }

}
</script>

<style scoped>
/* 页面整体布局 */
.electricity-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  min-height: calc(100vh - 84px);
  padding: 20px;
}

/* 统计卡片区 */
.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
  position: relative;
  border: none;
}

.stat-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.stat-card-primary {
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  color: white;
}

.stat-card-success {
  background: linear-gradient(135deg, #52c41a 0%, #95de64 100%);
  color: white;
}

.stat-card-warning {
  background: linear-gradient(135deg, #fa8c16 0%, #ffc53d 100%);
  color: white;
}

.stat-card-info {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.stat-card-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  position: relative;
  z-index: 1;
}

.stat-decoration {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
}

.stat-icon-wrap {
  flex-shrink: 0;
}

.stat-icon {
  font-size: 32px;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.stat-icon.pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(255, 255, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
}

.stat-info {
  flex: 1;
  text-align: right;
  padding-right: 10px;
}

.stat-label {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 8px;
  font-weight: 500;
  letter-spacing: 1px;
}

.stat-value {
  font-size: 26px;
  font-weight: bold;
  font-family: 'DIN Alternate', 'Arial', sans-serif;
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
}

.stat-value .currency {
  font-size: 16px;
  margin-right: 2px;
  opacity: 0.8;
}

.stat-value .unit {
  font-size: 14px;
  margin-left: 4px;
  opacity: 0.8;
  font-weight: normal;
}

.stat-value.highlight {
  color: #ffeb3b;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.stat-trend {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.stat-trend i {
  margin-right: 4px;
}

/* 搜索卡片区 */
.search-card {
  margin-bottom: 20px;
  border-radius: 16px;
  border: none;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.search-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.search-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
}

.search-title i {
  margin-right: 8px;
  color: #667eea;
}

.search-card >>> .el-card__body {
  padding: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.date-picker-custom {
  border-radius: 8px;
}

.quick-btns {
  margin-left: 20px;
}

.quick-btns .el-button-group {
  display: flex;
}

.quick-btns .el-button {
  border-radius: 0;
  transition: all 0.3s ease;
}

.quick-btns .el-button:first-child {
  border-radius: 8px 0 0 8px;
}

.quick-btns .el-button:last-child {
  border-radius: 0 8px 8px 0;
}

.search-actions {
  margin-left: auto;
}

.filter-btn {
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  border: none;
  border-radius: 8px;
  padding: 9px 24px;
  margin-right: 10px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.filter-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(24, 144, 255, 0.4);
}

.reset-btn {
  border-radius: 8px;
  padding: 9px 24px;
  transition: all 0.3s ease;
  border: 1px solid #dcdfe6;
}

.reset-btn:hover {
  color: #667eea;
  border-color: #667eea;
  transform: translateY(-2px);
}

/* 图表卡片区 */
.chart-card {
  border-radius: 16px;
  overflow: hidden;
  border: none;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.chart-card >>> .el-card__header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chart-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
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

.chart-subtitle {
  font-size: 12px;
  color: #909399;
  background: #f4f4f5;
  padding: 4px 10px;
  border-radius: 12px;
}

.chart-actions {
  display: flex;
  align-items: center;
}

.refresh-btn {
  font-size: 18px;
  color: #909399;
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  color: #667eea;
  transform: rotate(180deg);
}

.refresh-btn .is-loading {
  animation: rotating 1s linear infinite;
}

@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.chart-wrapper {
  padding: 20px;
  background: #fafbfc;
  min-height: 500px;
}

.chart-loading,
.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #909399;
}

.chart-loading i,
.chart-empty i {
  font-size: 48px;
  margin-bottom: 16px;
  color: #c0c4cc;
}

.chart-loading span {
  font-size: 14px;
}

.chart-empty p {
  font-size: 16px;
  margin: 0 0 8px 0;
  color: #606266;
}

.chart-empty span {
  font-size: 12px;
}

.chart-container {
  width: 100%;
  min-height: 450px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stat-card-content {
    padding: 15px;
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 24px;
  }
  
  .stat-value {
    font-size: 22px;
  }
}

@media (max-width: 768px) {
  .electricity-page {
    padding: 10px;
  }
  
  .stat-card-content {
    flex-direction: column;
    text-align: center;
    padding: 15px;
  }
  
  .stat-icon-wrap {
    margin-bottom: 10px;
  }
  
  .stat-info {
    text-align: center;
    padding-right: 0;
  }
  
  .stat-value {
    font-size: 20px;
    justify-content: center;
  }
  
  .stat-trend {
    justify-content: center;
  }
  
  .search-form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .quick-btns {
    margin-left: 0;
    margin-top: 10px;
  }
  
  .quick-btns .el-button-group {
    flex-wrap: wrap;
  }
  
  .search-actions {
    margin-left: 0;
    margin-top: 10px;
  }
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-card {
  animation: fadeInUp 0.6s ease forwards;
  opacity: 0;
}

.search-card {
  animation: fadeInUp 0.6s ease forwards;
  animation-delay: 0.1s;
  opacity: 0;
}

.chart-card {
  animation: fadeInUp 0.6s ease forwards;
  animation-delay: 0.2s;
  opacity: 0;
}

/* 为每个卡片设置不同的动画延迟 */
.stats-row .el-col:nth-child(1) .stat-card { animation-delay: 0s; }
.stats-row .el-col:nth-child(2) .stat-card { animation-delay: 0.05s; }
.stats-row .el-col:nth-child(3) .stat-card { animation-delay: 0.1s; }
.stats-row .el-col:nth-child(4) .stat-card { animation-delay: 0.15s; }
</style>