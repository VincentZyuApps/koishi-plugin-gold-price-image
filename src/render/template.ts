import type { ResolvedRenderFont } from '../font';
import type { GoldPriceChartOptions } from '../types';
import type { PreparedChartData } from '../utils/chart';

export function buildGoldPriceChartHtml(
  options: GoldPriceChartOptions,
  data: PreparedChartData,
  chartJsContent: string,
  font: ResolvedRenderFont,
): string {
  const {
    width,
    height,
    title,
    maxXAxisTicks,
    maxYAxisTicks,
  } = options;
  const {
    prices,
    labels,
    yAxisMin,
    yAxisMax,
    isPositive,
    originalLastPrice,
    originalMaxPrice,
    originalMinPrice,
    originalAveragePrice,
    originalPriceChangePercent,
    originalIsPositive,
  } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${font.fontFaceCss}
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: ${width}px;
      height: ${height}px;
      background: linear-gradient(135deg, #d32f2f 0%, #f57c00 50%, #fbc02d 100%);
      font-family: ${font.fontFamily};
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
        <div class="stat-value avg">¥${originalAveragePrice.toFixed(2)}</div>
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
    (async () => {
      await document.fonts.ready;

      const canvas = document.getElementById('goldChart');
      const ctx = canvas.getContext('2d');
      const priceData = ${JSON.stringify(prices)};
      const labelData = ${JSON.stringify(labels)};
      const yMin = ${yAxisMin};
      const yMax = ${yAxisMax};
      const maxXTicks = ${maxXAxisTicks};
      const maxYTicks = ${maxYAxisTicks};
      const chartFontFamily = ${JSON.stringify(font.fontFamily)};
      const fontCheckFamily = ${JSON.stringify(font.checkFamily || '')};

      if (fontCheckFamily) {
        const loadedFaces = await document.fonts.load('16px "' + fontCheckFamily + '"');
        if (!loadedFaces.length || !document.fonts.check('16px "' + fontCheckFamily + '"')) {
          throw new Error('所选字体未能在浏览器中加载: ' + fontCheckFamily);
        }
      }

      console.log('Chart.js 配置:');
      console.log('- Y轴范围:', yMin, '到', yMax);
      console.log('- 数据点数:', priceData.length);
      console.log('- 数据范围:', Math.min(...priceData), '到', Math.max(...priceData));

      Chart.defaults.font.family = chartFontFamily;
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
                  family: chartFontFamily
                },
                color: '#2d3748'
              }
            },
            tooltip: {
              enabled: true,
              backgroundColor: 'rgba(45, 55, 72, 0.95)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              titleFont: { size: 14, weight: '600', family: chartFontFamily },
              bodyFont: { size: 16, weight: '700', family: chartFontFamily },
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
                font: { size: 11, weight: '500', family: chartFontFamily },
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
                font: { size: 12, weight: '600', family: chartFontFamily },
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
      setTimeout(() => {
        const yScale = chart.scales.y;
        console.log('Chart.js 实际 Y 轴范围:', yScale.min, '到', yScale.max);
        console.log('配置的 Y 轴范围:', yMin, '到', yMax);
      }, 100);

      window.__chartReady = true;
    })().catch((error) => {
      console.error('图表渲染失败:', error);
      window.__chartError = String(error && error.stack ? error.stack : error);
    });
  </script>
</body>
</html>
  `;
}
