import { Context, Schema, h, Logger } from 'koishi'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderGoldPriceChart } from './render'

export const inject = {
  required: ["database", "puppeteer", "http"]
};

export const name = 'gold-price-image'
const PLUGIN_NAME = name;

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, '../package.json'), 'utf-8')
)

export const usage = `
<h1>💰 Koishi 插件：招行金价走势图 💰</h1>
<h2>🎯 插件版本：v${pkg.version}</h2>

<h2 style="color: #ff4444; font-weight: 900; font-size: 24px; margin: 20px 0;">⚠️ 重要提示：需要开启 <b>puppeteer</b>、<b>http</b> 和 <b>database</b> 插件，本插件才能正常使用！</h2>

<h3>📊 功能介绍</h3>
<ul>
  <li>🔄 定时抓取招行金价数据</li>
  <li>📈 使用 Chart.js 渲染精美的金价走势图</li>
  <li>💾 数据库存储历史数据</li>
  <li>🎨 支持自定义时间范围查询</li>
</ul>

<h3>📝 使用方法</h3>
<h4>💰 实时金价查询</h4>
<ul>
  <li><code>金价</code> - 获取当前招行金价（实时数据）</li>
</ul>

<h4>📈 历史走势图</h4>
<ul>
  <li><code>金价走势</code> - 查看最近24小时金价走势图（默认）</li>
  <li><code>金价走势 6 h</code> - 查看最近6小时</li>
  <li><code>金价走势 30 分钟</code> - 查看最近30分钟</li>
  <li><code>金价走势 7 d</code> - 查看最近7天</li>
  <li><code>金价走势 30 天</code> - 查看最近30天</li>
</ul>
<h5>参数说明：</h5>
<ul>
  <li><code>数量</code>：时间数量（数字），默认 24</li>
  <li><code>单位</code>：时间单位，默认 h（小时）</li>
</ul>
<h5>支持的时间单位：</h5>
<ul>
  <li>分钟：<code>m</code>, <code>minute</code>, <code>分</code>, <code>分钟</code></li>
  <li>小时：<code>h</code>, <code>hour</code>, <code>时</code>, <code>小时</code></li>
  <li>天：<code>d</code>, <code>day</code>, <code>天</code>, <code>日</code></li>
</ul>
`

// 数据库表结构
export interface GoldPriceData {
  id: number
  timestamp: Date
  price: number
  productCode: string
  productName: string
}

declare module 'koishi' {
  interface Tables {
    gold_price_data: GoldPriceData
  }
}

export interface Config {
  textCommandName: string
  imageCommandName: string
  fetchIntervalMinutes: number

  apiUrl: string
  apiHeaders: Array<{ key: string; value: string }>
  apiPayload: string

  defaultNum: number
  defaultUnit: string

  chartWidth: number
  chartHeight: number
  maxDataPoints: number
  imageType: 'png' | 'jpeg' | 'webp'
  imageQuality: number

  verboseSessionOutput: boolean
  verboseConsoleOutput: boolean
}

export const Config = Schema.intersect([
  Schema.object({
    textCommandName: Schema
      .string()
      .default('金价')
      .description('实时金价查询命令名称'),
    imageCommandName: Schema
      .string()
      .default('金价走势')
      .description('金价走势图命令名称'),
    fetchIntervalMinutes: Schema
      .number()
      .min(1)
      .max(1440)
      .default(5)
      .description('数据抓取间隔（分钟）'),
  }).description('基础配置 ⚙️'),

  Schema.object({
    apiUrl: Schema
      .string()
      .default('https://mbmodule-openapi.paas.cmbchina.com/product/v1/func/market-center')
      .description('招行金价API地址'),
    apiHeaders: Schema
      .array(Schema.object({
        key: Schema.string().description('key'),
        value: Schema.string().description('value'),
      }))
      .role('table')
      .default([
        { key: 'Host', value: 'mbmodule-openapi.paas.cmbchina.com' },
        { key: 'Connection', value: 'keep-alive' },
        { key: 'sec-ch-ua', value: '"Chromium";v="128", "Not;A=Brand";v="24", "Android WebView";v="128"' },
        { key: 'Accept', value: 'application/json, text/plain, */*' },
        { key: 'sec-ch-ua-platform', value: '"Android"' },
        { key: 'sec-ch-ua-mobile', value: '?1' },
        { key: 'User-Agent', value: 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:34.0) Gecko/20100101 Firefox/34.0' },
        { key: 'Origin', value: 'https://mbmodulecdn.cmbimg.com' },
        { key: 'X-Requested-With', value: 'cmb.pb' },
        { key: 'Sec-Fetch-Site', value: 'cross-site' },
        { key: 'Sec-Fetch-Mode', value: 'cors' },
        { key: 'Sec-Fetch-Dest', value: 'empty' },
        { key: 'Referer', value: 'https://mbmodulecdn.cmbimg.com/' },
        { key: 'Accept-Language', value: 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7' },
        { key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
      ])
      .description('API请求头（表格形式）'),
    apiPayload: Schema
      .string()
      .default('params=[{"prdType":"H","prdCode":""}]')
      .description('API请求参数'),
  }).description('API配置 🌐'),

  Schema.object({  
    defaultNum: Schema
      .number()
      .min(1)
      .default(24)
      .description('默认时间数量'),
    defaultUnit: Schema
      .union([
        Schema.const('m').description('分钟'),
        Schema.const('h').description('小时'),
        Schema.const('d').description('天'),
      ])
      .role('radio')
      .default('h')
      .description('默认时闶单位'),
  }).description('默认时间范围 ⏱️'),

  Schema.object({
    chartWidth: Schema
      .number()
      .default(1200)
      .description('图表宽度（像素）'),
    chartHeight: Schema
      .number()
      .default(600)
      .description('图表高度（像素）'),
    maxDataPoints: Schema
      .number()
      .default(288)
      .description('最大数据点数量（默认288=24小时*12次/小时）'),
    imageType: Schema
      .union(['png', 'jpeg', 'webp'])
      .default('png')
      .description('图片输出格式'),
    imageQuality: Schema
      .number()
      .min(0)
      .max(100)
      .default(90)
      .description('图片质量（仅对 jpeg 和 webp 有效）'),
  }).description('图表配置 📊'),

  Schema.object({
    verboseSessionOutput: Schema
      .boolean()
      .default(false)
      .description('在会话中输出详细调试信息'),
    verboseConsoleOutput: Schema
      .boolean()
      .default(true)
      .description('在控制台输出详细调试信息'),
  }).description('调试配置 🐛'),
]);

export function apply(ctx: Context, config: Config) {
  const logger = ctx.logger(PLUGIN_NAME);
  let timeoutDispose: (() => void) | null = null;

  // 扩展数据库表
  ctx.model.extend('gold_price_data', {
    id: 'unsigned',
    timestamp: 'timestamp',
    price: 'double',
    productCode: 'string',
    productName: 'string',
  }, {
    autoInc: true,
  });

  // 获取金价数据的函数
  async function fetchGoldPrice(): Promise<void> {
    try {
      logger.info('🔄 开始抓取金价数据...');
      
      // 将表格格式的 headers 转换为对象
      const headers = Object.fromEntries(
        config.apiHeaders.map(h => [h.key, h.value])
      );
      
      const response = await ctx.http.post(config.apiUrl, config.apiPayload, {
        headers: headers
      });

      if (config.verboseConsoleOutput) {
        logger.info(`📡 API 响应: ${JSON.stringify(response)}`);
      }

      if (response && response.data && response.data.FQAMBPRCZ1) {
        const goldData = response.data.FQAMBPRCZ1;
        const buyPrice = parseFloat(goldData.zBuyPrc);  // 买入价
        const sellPrice = parseFloat(goldData.zSelPrc); // 卖出价
        const avgPrice = (buyPrice + sellPrice) / 2;    // 平均价
        
        if (!isNaN(avgPrice)) {
          await ctx.database.create('gold_price_data', {
            timestamp: new Date(),
            price: avgPrice,
            productCode: 'FQAMBPRCZ1',
            productName: '招行黄金',
          });
          
          logger.info(`✅ 成功记录金价: 买入¥${buyPrice.toFixed(2)}/克, 卖出¥${sellPrice.toFixed(2)}/克, 平均¥${avgPrice.toFixed(2)}/克`);
        } else {
          logger.warn('⚠️ 金价数据无效');
        }
      } else {
        logger.warn('⚠️ API 响应数据格式异常');
        if (config.verboseConsoleOutput) {
          logger.warn(`📋 完整响应: ${JSON.stringify(response)}`);
        }
      }
    } catch (error) {
      logger.error(`❌ 获取金价失败: ${error.message}`);
      if (config.verboseConsoleOutput) {
        logger.error(`🔍 错误详情: ${error.stack || error}`);
      }
    }
  }

  // 启动定时任务（每N整数分钟执行，如5分钟间隔：12:00, 12:05, 12:10...）
  function startIntervalJob() {
    if (timeoutDispose) {
      timeoutDispose();
      timeoutDispose = null;
    }
    
    // 立即执行一次
    // fetchGoldPrice();
    
    // 计算到下一个整数分钟的延迟时间
    function scheduleNext() {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentSecond = now.getSeconds();
      const currentMs = now.getMilliseconds();
      
      // 计算下一个整数分钟数（能被 fetchIntervalMinutes 整除）
      const nextMinute = Math.ceil((currentMinute + 1) / config.fetchIntervalMinutes) * config.fetchIntervalMinutes;
      
      // 计算下次执行的小时和分钟
      const nextHour = currentHour + Math.floor(nextMinute / 60);
      const nextMinuteDisplay = nextMinute % 60;
      
      // 格式化时间显示 (HH:MM)
      const nextTimeStr = `${String(nextHour % 24).padStart(2, '0')}:${String(nextMinuteDisplay).padStart(2, '0')}`;
      
      // 计算延迟毫秒数
      const minutesUntilNext = (nextMinute - currentMinute - 1 + 60) % 60;
      const secondsUntilNext = 60 - currentSecond;
      const msUntilNext = 1000 - currentMs;
      
      const delayMs = minutesUntilNext * 60 * 1000 + secondsUntilNext * 1000 + msUntilNext;
      
      logger.info(`⏰ 下次抓取时间: ${nextTimeStr}，距离现在 ${Math.floor(delayMs / 1000)} 秒`);
      
      // 设置到下一个整数分钟执行
      timeoutDispose = ctx.setTimeout(() => {
        fetchGoldPrice();
        // 递归调度下一次
        scheduleNext();
      }, delayMs);
    }
    
    // 开始调度
    scheduleNext();

    logger.info(`⏰ 定时任务已启动，每 ${config.fetchIntervalMinutes} 分钟（整数分钟）抓取一次金价`);
  }

  // 插件启动时启动定时任务
  ctx.on('ready', () => {
    startIntervalJob();
  });

  // 插件卸载时停止定时任务
  ctx.on('dispose', () => {
    if (timeoutDispose) {
      timeoutDispose();
      timeoutDispose = null;
      logger.info('⏹️ 定时任务已停止');
    }
  });

  // 注册命令1: 金价 - 立即获取当前金价
  ctx.command(config.textCommandName, '获取当前招行金价')
    .alias('goldprice')
    .action(async ({ session }) => {
      try {
        // 将表格格式的 headers 转换为对象
        const headers = Object.fromEntries(
          config.apiHeaders.map(h => [h.key, h.value])
        );
        
        const response = await ctx.http.post(config.apiUrl, config.apiPayload, {
          headers: headers
        });

        if (response && response.data && response.data.FQAMBPRCZ1) {
          const goldData = response.data.FQAMBPRCZ1;
          const buyPrice = parseFloat(goldData.zBuyPrc);
          const sellPrice = parseFloat(goldData.zSelPrc);
          const updateTime = response.data.NowTime;
          
          const msg = [
            '💰 招行黄金实时报价',
            `📅 更新时间：\t${updateTime}`,
            `💵 买入价：\t¥${buyPrice.toFixed(2)}/克`,
            `💸 卖出价：\t¥${sellPrice.toFixed(2)}/克`,
            `📊 价格差：\t¥${(buyPrice - sellPrice).toFixed(2)}/克`,
          ].join('\n');
          
          await session.send(msg);
        } else {
          const errorMsg = '❌ 获取金价失败，请稍后重试';
          if (config.verboseSessionOutput) {
            await session.send(`${errorMsg}\n🔍 调试信息: API 响应数据格式异常`);
          } else {
            await session.send(errorMsg);
          }
          if (config.verboseConsoleOutput) {
            logger.error(`📋 API 响应: ${JSON.stringify(response)}`);
          }
        }
      } catch (error) {
        logger.error(`获取金价失败: ${error.message}`);
        if (config.verboseConsoleOutput) {
          logger.error(`🔍 错误详情: ${error.stack || error}`);
        }
        const errorMsg = '❌ 获取金价失败，请稍后重试';
        if (config.verboseSessionOutput) {
          await session.send(`${errorMsg}\n🔍 调试信息: ${error.message}`);
        } else {
          await session.send(errorMsg);
        }
      }
    });

  // 注册命令2: 金价走势 - 查看历史走势图
  ctx.command(config.imageCommandName + ' [num:number] [unit:string]', '查看金价历史走势图')
    .alias('goldtrend')
    .action(async ({ session }, num, unit) => {
      try {
        await session.send(`${h.quote(session.messageId)}正在生成金价走势图，请稍候...`);

        // 使用默认值或用户输入
        const actualNum: number = num !== undefined ? Number(num) : config.defaultNum;
        const actualUnit: string = unit ?? config.defaultUnit;

        // 解析时间单位
        const unitMap: { [key: string]: number } = {
          'm': 1 / 60,
          'minute': 1 / 60,
          'minutes': 1 / 60,
          '分': 1 / 60,
          '分钟': 1 / 60,
          'h': 1,
          'hour': 1,
          'hours': 1,
          '时': 1,
          '小时': 1,
          'd': 24,
          'day': 24,
          'days': 24,
          '天': 24,
          '日': 24,
        };

        const unitLower = actualUnit.toLowerCase();
        const multiplier = unitMap[unitLower];
        
        if (!multiplier) {
          await session.send(`❌ 不支持的时间单位: ${actualUnit}\n支持的单位: m/h/d/minute/hour/day/分/分钟/时/小时/天`);
          return;
        }

        const hoursBack = actualNum * multiplier;
        
        if (hoursBack <= 0 || hoursBack > 24 * 365) {
          await session.send('❌ 时间范围必须在 1分钟 到 365天 之间');
          return;
        }

        // 从数据库获取数据
        const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
        const priceData = await ctx.database
          .select('gold_price_data')
          .where({ timestamp: { $gte: startTime } })
          .orderBy('timestamp', 'asc')
          .limit(config.maxDataPoints)
          .execute();

        if (priceData.length === 0) {
          await session.send('暂无金价数据，请等待数据采集...');
          return;
        }

        // 生成标题显示
        const displayUnit = unitLower === 'm' || actualUnit === '分' || actualUnit === '分钟' ? '分钟' :
                           unitLower === 'h' || actualUnit === '时' || actualUnit === '小时' ? '小时' : '天';
        const titleRange = `${actualNum}${displayUnit}`;
        
        // 渲染图表
        const chartBase64 = await renderGoldPriceChart(ctx, {
          data: priceData,
          width: config.chartWidth,
          height: config.chartHeight,
          imageType: config.imageType,
          quality: config.imageQuality,
          title: `招行金价走势（最近${titleRange}）`,
        });

        await session.send(h.image(`data:image/${config.imageType};base64,${chartBase64}`));
      } catch (error) {
        logger.error(`生成金价走势图失败: ${error.message}`);
        if (config.verboseConsoleOutput) {
          logger.error(`🔍 错误详情: ${error.stack || error}`);
        }
        const errorMsg = '生成金价走势图失败，请稍后重试。';
        if (config.verboseSessionOutput) {
          await session.send(`${errorMsg}\n🔍 调试信息: ${error.message}`);
        } else {
          await session.send(errorMsg);
        }
      }
    });
}
