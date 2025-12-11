import { Context } from 'koishi';
import { } from 'koishi-plugin-puppeteer';

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
}

export async function renderGoldPriceChart(
  ctx: Context,
  options: GoldPriceChartOptions
): Promise<string> {
  const { data, width, height, imageType, quality, title } = options;

  // 准备数据
  const labels = data.map(item => {
    const date = new Date(item.timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  });

  const prices = data.map(item => item.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
      padding: 20px;
    }
    .container {
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .title {
      font-size: 32px;
      font-weight: bold;
      color: #2d3748;
      margin-bottom: 10px;
    }
    .stats {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-bottom: 20px;
      font-size: 16px;
    }
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .stat-label {
      color: #718096;
      margin-bottom: 5px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
    }
    .stat-value.current { color: #667eea; }
    .stat-value.high { color: #f56565; }
    .stat-value.low { color: #48bb78; }
    .stat-value.avg { color: #ed8936; }
    .chart-container {
      width: 100%;
      height: calc(100% - 150px);
      position: relative;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">💰 ${title}</div>
      <div class="stats">
        <div class="stat-item">
          <div class="stat-label">当前价格</div>
          <div class="stat-value current">¥${prices[prices.length - 1].toFixed(2)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">最高价</div>
          <div class="stat-value high">¥${maxPrice.toFixed(2)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">最低价</div>
          <div class="stat-value low">¥${minPrice.toFixed(2)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">平均价</div>
          <div class="stat-value avg">¥${avgPrice.toFixed(2)}</div>
        </div>
      </div>
    </div>
    <div class="chart-container">
      <canvas id="goldChart"></canvas>
    </div>
  </div>

  <script>
    const ctx = document.getElementById('goldChart').getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.8)');
    gradient.addColorStop(1, 'rgba(118, 75, 162, 0.1)');

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(labels)},
        datasets: [{
          label: '金价 (¥/克)',
          data: ${JSON.stringify(prices)},
          borderColor: '#667eea',
          backgroundColor: gradient,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 14,
                weight: 'bold'
              },
              color: '#2d3748'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: {
              size: 14
            },
            bodyFont: {
              size: 16
            },
            padding: 12,
            displayColors: false,
            callbacks: {
              label: function(context) {
                return '¥' + context.parsed.y.toFixed(2) + ' / 克';
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              color: '#718096',
              font: {
                size: 11
              },
              maxRotation: 45,
              minRotation: 45
            }
          },
          y: {
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              color: '#718096',
              font: {
                size: 12
              },
              callback: function(value) {
                return '¥' + value.toFixed(2);
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  </script>
</body>
</html>
  `;

  // 使用 Puppeteer 渲染
  const page = await ctx.puppeteer.page();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.setViewport({ width, height });
    
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
