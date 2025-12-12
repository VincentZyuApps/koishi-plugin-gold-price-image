import { Context } from 'koishi';
import { } from 'koishi-plugin-puppeteer';
import { readFileSync } from 'fs';

interface GoldPriceChartOptions {
  data: Array<{
    timestamp: Date;
    price: number;
  }>;
  width: number;
  height: number;
  imageType: 'png' | 'jpeg' | 'webp';
  quality: number;
  title: string;
  chartJsPath: string;
  maxDataPoints: number;
  maxXAxisTicks: number;
  maxYAxisTicks: number;
  verboseConsoleOutput: boolean;
}

export async function renderGoldPriceChart(
  ctx: Context,
  options: GoldPriceChartOptions
): Promise<string> {
  const { data, width, height, imageType, quality, title, chartJsPath, maxDataPoints, maxXAxisTicks, maxYAxisTicks, verboseConsoleOutput } = options;

  // 读取本地 Chart.js 文件
  const chartJsContent = readFileSync(chartJsPath, 'utf-8');

  // 自定义采样算法：根据 maxDataPoints 对数据进行采样
  let sampledData = data;
  if (data.length > maxDataPoints) {
    const step = Math.ceil(data.length / maxDataPoints);
    sampledData = [];
    for (let i = 0; i < data.length; i += step) {
      sampledData.push(data[i]);
    }
    // 确保包含最后一个数据点
    if (sampledData[sampledData.length - 1] !== data[data.length - 1]) {
      sampledData.push(data[data.length - 1]);
    }
  }

  //只输出所有的price（使用slice创建副本避免修改原数组）
  if (verboseConsoleOutput) {
    ctx.logger.info(`采样过后的点(按价格排序): ${sampledData.slice().sort((a, b) => a.price - b.price).map(item => item.price)}`);
  }

  if (verboseConsoleOutput) {
    ctx.logger.info(`📊 数据采样: 原始=${data.length}点, 采样后=${sampledData.length}点, 采样步长=${Math.ceil(data.length / maxDataPoints)}`);
  }

  // 准备采样后的数据
  const labels = sampledData.map(item => {
    const date = new Date(item.timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  });

  const prices = sampledData.map(item => item.price);
  
  if (verboseConsoleOutput) {
    // 输出传递给 Chart.js 的实际价格数据（按时间顺序）
    ctx.logger.info(`🎨 传递给Chart.js的价格数据(时间顺序): ${prices.join(',')}`);
  }
  
  // 基于采样后的数据计算统计信息
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const priceRange = maxPrice - minPrice;
  const roundAxisValue = (value: number, precision = 2) => Number(value.toFixed(precision));

  // 使用小的固定 padding
  const paddingValue = 0.01;

  if (verboseConsoleOutput) {
    ctx.logger.info(`📊 价格统计(采样后): 最小=${minPrice.toFixed(2)}, 最大=${maxPrice.toFixed(2)}, 范围=${priceRange.toFixed(2)}, 平均=${avgPrice.toFixed(2)}`);
  }

  let yAxisMin = minPrice - paddingValue;
  let yAxisMax = maxPrice + paddingValue;

  // 这样可以避免边界设置得太贴合数据，给 Chart.js 更多空间布置刻度
  yAxisMin = Math.floor(yAxisMin * 100) / 100;
  yAxisMax = Math.ceil(yAxisMax * 100) / 100;

  if (verboseConsoleOutput) {
    ctx.logger.info(`📊 Y轴范围: 最小=${yAxisMin.toFixed(2)}, 最大=${yAxisMax.toFixed(2)}`);
  }

  const visibleRange = yAxisMax - yAxisMin || 1;
  let yAxisStep = roundAxisValue(visibleRange / Math.max(1, maxYAxisTicks - 1), 3);
  if (yAxisStep < 0.01) yAxisStep = 0.01;
  
  if (verboseConsoleOutput) {
    ctx.logger.info(`📊 Y轴步长: ${yAxisStep}, 刻度数=${maxYAxisTicks}`);
  }

  // 计算价格变化（基于采样后的数据）
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = (priceChange / firstPrice) * 100;
  const isPositive = priceChange >= 0;

  // 同时计算原始数据的统计信息用于展示
  const allPrices = data.map(item => item.price);
  const originalMinPrice = Math.min(...allPrices);
  const originalMaxPrice = Math.max(...allPrices);
  const originalAvgPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
  const originalLastPrice = allPrices[allPrices.length - 1];
  const originalFirstPrice = allPrices[0];
  const originalPriceChange = originalLastPrice - originalFirstPrice;
  const originalPriceChangePercent = (originalPriceChange / originalFirstPrice) * 100;
  const originalIsPositive = originalPriceChange >= 0;

  // 生成HTML页面
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: ${width}px;
      height: ${height}px;
      background: linear-gradient(135deg, #d32f2f 0%, #f57c00 50%, #fbc02d 100%);
      font-family: 'Microsoft YaHei', 'PingFang SC', 'SimHei', sans-serif;
      padding: 40px;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.98);
      border-radius: 30px;
      padding: 9px;
      box-shadow: 0 35px 90px rgba(0, 0, 0, 0.45);
      display: flex;
      flex-direction: column;
    }
    .header {
      text-align: center;
      margin-bottom: 9px;
      padding-bottom: 9px;
      border-bottom: 3px solid #f57c00;
    }
    .title {
      font-size: 32px;
      font-weight: 900;
      color: #d32f2f;
      margin-bottom: 10px;
      letter-spacing: 1px;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    .subtitle {
      font-size: 13px;
      color: #2d3748;
      font-weight: 600;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 13px;
      margin-bottom: 18px;
    }
    .stat-card {
      background: linear-gradient(135deg, #fff9e6 0%, #ffe8cc 100%);
      border-radius: 13px;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      border-color: #f57c00;
      background: linear-gradient(135deg, #ffeb99 0%, #ffe082 100%);
    }
    .stat-icon {
      font-size: 26px;
      flex-shrink: 0;
      line-height: 1;
    }
    .stat-label {
      font-size: 13px;
      color: #e65100;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      flex-shrink: 0;
      white-space: nowrap;
    }
    .stat-value {
      font-size: 23px;
      font-weight: 900;
      line-height: 1;
      flex-grow: 1;
      color: #d32f2f;
    }
    .change-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
      white-space: nowrap;
      background: ${isPositive ? '#c8e6c9' : '#ffccbc'};
      color: ${isPositive ? '#1b5e20' : '#bf360c'};
    }
    .chart-wrapper {
      background: #f7fafc;
      border-radius: 20px;
      padding: 16px;
      box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.05);
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .chart-container {
      position: relative;
      width: 100%;
      height: 100%;
    }
    #goldChart {
      display: block;
    }
    .footer {
      text-align: center;
      margin-top: 9px;
      padding-top: 9px;
      border-top: 2px solid #f57c00;
      font-size: 12px;
      color: #d32f2f;
      font-weight: 700;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
    .footer-icon {
      color: #f57c00;
      margin-right: 5px;
      font-size: 16px;
    }
  </style>
  <script>${chartJsContent}</script>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">💰 ${title}</div>
      <div class="subtitle">招商银行黄金实时价格走势</div>
    </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-label">当前价格</div>
          <div class="stat-value current">¥${originalLastPrice.toFixed(2)}</div>
          <div class="change-badge">${originalIsPositive ? '↑' : '↓'} ${Math.abs(originalPriceChangePercent).toFixed(2)}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔺</div>
          <div class="stat-label">最高价</div>
          <div class="stat-value high">¥${originalMaxPrice.toFixed(2)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔻</div>
          <div class="stat-label">最低价</div>
          <div class="stat-value low">¥${originalMinPrice.toFixed(2)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-label">平均价</div>
          <div class="stat-value avg">¥${originalAvgPrice.toFixed(2)}</div>
        </div>
      </div>

      <div class="chart-wrapper">
        <div class="chart-container">
          <canvas id="goldChart" width="${width - 150}" height="${Math.floor(height * 0.55)}"></canvas>
        </div>
      </div>

    <div class="footer">
      <span class="footer-icon">🏦</span>
      数据来源：招行API | 更新时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
    </div>
  </div>

  <script>
    const canvas = document.getElementById('goldChart');
    const ctx = canvas.getContext('2d');
    
    // 配置参数 - 直接内联数据
    const priceData = ${JSON.stringify(prices)};
    const labelData = ${JSON.stringify(labels)};
    const yMin = ${yAxisMin};
    const yMax = ${yAxisMax};
    const maxXTicks = ${maxXAxisTicks};
    const maxYTicks = ${maxYAxisTicks};
    
    // 调试输出
    console.log('Chart.js 配置:');
    console.log('- Y轴范围:', yMin, '到', yMax);
    console.log('- 数据点数:', priceData.length);
    console.log('- 数据范围:', Math.min(...priceData), '到', Math.max(...priceData));
    
    // 创建渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.4)');
    gradient.addColorStop(1, 'rgba(118, 75, 162, 0.05)');

    const chartConfig = {
      type: 'line',
      data: {
        labels: labelData,
        datasets: [{
          label: '黄金价格 (¥/克)',
          data: priceData,
          borderColor: '#667eea',
          backgroundColor: gradient,
          borderWidth: 1.5,
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 5,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.3,
          pointHoverBackgroundColor: '#764ba2',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 15,
              font: {
                size: 13,
                weight: '600',
                family: "'Microsoft YaHei', sans-serif"
              },
              color: '#2d3748'
            }
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(45, 55, 72, 0.95)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            titleFont: { size: 14, weight: '600' },
            bodyFont: { size: 16, weight: '700' },
            padding: 15,
            cornerRadius: 12,
            displayColors: false,
            callbacks: {
              title: function(context) { return context[0].label; },
              label: function(context) { return '¥' + context.parsed.y.toFixed(2) + ' / 克'; }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: true,
              color: 'rgba(102, 126, 234, 0.15)',
            },
            ticks: {
              color: '#718096',
              font: { size: 11, weight: '500' },
              maxRotation: 72,
              minRotation: 72,
              padding: 8,
              autoSkip: true,
              maxTicksLimit: maxXTicks,
            }
          },
          y: {
            grid: {
              display: true,
              color: 'rgba(102, 126, 234, 0.15)',
            },
            ticks: {
              color: '#718096',
              font: { size: 12, weight: '600' },
              padding: 10,
              callback: function(value) { return '¥' + Number(value).toFixed(2); }
            },
            min: yMin,
            max: yMax,
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        animation: {
          duration: 300,
          easing: 'easeOutQuad'
        }
      }
    };
    
    const chart = new Chart(ctx, chartConfig);
    
    // 调试：打印实际的 Y 轴范围
    setTimeout(() => {
      const yScale = chart.scales.y;
      console.log('Chart.js 实际 Y 轴范围:', yScale.min, '到', yScale.max);
      console.log('配置的 Y 轴范围:', yMin, '到', yMax);
    }, 100);

    // 标记渲染完成，供 Puppeteer 侦测
    window.__chartReady = true;
  </script>
</body>
</html>
  `;

  // 使用 Puppeteer 渲染
  const page = await ctx.puppeteer.page();
  try {
    // 捕获浏览器 console 输出用于调试
    if (verboseConsoleOutput) {
      page.on('console', msg => {
        ctx.logger.info(`🌐 浏览器Console: ${msg.text()}`);
      });
    }
    
    // 避免外部资源等待导致超时，使用较快的 DOM 就绪
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.setViewport({ width, height });
    // 等待 Chart 标记就绪，最多 10 秒
    try {
      await page.waitForFunction('window.__chartReady === true', { timeout: 10000 });
    } catch {}
    
    // 等待一下让 setTimeout 中的调试日志执行
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const screenshot = await page.screenshot({
      type: imageType,
      quality: imageType !== 'png' ? quality : undefined,
      encoding: 'base64',
    });

    return screenshot as string;
  } finally {
    await page.close();
  }
}
