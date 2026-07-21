import { Schema } from 'koishi';
import type { FetchScheduleMode, FontMode } from './types';

export const FONT_ASSET_PATH_RELATIVE_TO_BASE_DIR = [
  'data',
  'fonts',
  'LXGWWenKaiMono-Regular.ttf',
] as const;

export const CHART_ASSET_PATH_RELATIVE_TO_BASE_DIR = [
  'data',
  'assets',
  'gold-price-image',
  'chart.umd.min.js',
] as const;

export interface Config {
  textCommandName: string;
  textCommandAliases: string[];
  imageCommandName: string;
  imageCommandAliases: string[];
  fetchScheduleMode: FetchScheduleMode;
  fetchIntervalMinutes: number;
  fetchCronExpression: string;

  apiUrl: string;
  apiHeaders: Array<{ key: string; value: string }>;
  apiPayload: string;

  defaultNum: number;
  defaultUnit: string;

  chartWidth: number;
  chartHeight: number;
  maxDataPoints: number;
  maxXAxisTicks: number;
  maxYAxisTicks: number;
  imageType: 'png' | 'jpeg' | 'webp';
  imageQuality: number;
  fontMode: FontMode;
  customFontPath: string;
  fontAssetPathRelativeToBaseDir: string[];
  chartJsAssetPathRelativeToBaseDir: string[];

  verboseSessionOutput: boolean;
  verboseConsoleOutput: boolean;
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    textCommandName: Schema
      .string()
      .default('gold')
      .description('💰 实时金价查询命令名称'),
    textCommandAliases: Schema
      .array(Schema.string())
      .role('table')
      .default(['当前金价', 'gold-current-price', 'gcp', 'goldprice'])
      .description('🏷️ 实时金价查询命令别名'),
    imageCommandName: Schema
      .string()
      .default('gold-image')
      .description('📈 金价走势图命令名称'),
    imageCommandAliases: Schema
      .array(Schema.string())
      .role('table')
      .default(['金价走势', 'gold-trend-image', 'gti', 'goldtrend'])
      .description('🏷️ 金价走势图命令别名'),
    fetchScheduleMode: Schema
      .union([
        Schema.const('simple').description('⏱️ 简单间隔：按分钟定时采集'),
        Schema.const('cron').description('🗓️ Cron 表达式：按指定时间规则采集'),
      ])
      .role('radio')
      .default('simple')
      .description('⏰ 金价定时采集模式'),
    fetchIntervalMinutes: Schema
      .number()
      .min(1)
      .max(1440)
      .default(5)
      .description('⌛ 简单模式的抓取间隔（分钟）'),
    fetchCronExpression: Schema
      .string()
      .experimental()
      .default('*/5 * * * *')
      .description('🧩 Cron 模式的五段式表达式，默认每 5 分钟执行一次'),
  }).description('基础配置 ⚙️'),

  Schema.object({
    apiUrl: Schema
      .string()
      .role('link')
      .default('https://mbmodule-openapi.paas.cmbchina.com/product/v1/func/market-center')
      .description('🌐 招行金价 API 地址'),
    apiHeaders: Schema
      .array(Schema.object({
        key: Schema.string().description('🔑 key'),
        value: Schema.string().description('📝 value'),
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
      .description('🧾 API 请求头（表格形式）'),
    apiPayload: Schema
      .string()
      .default('params=[{"prdType":"H","prdCode":""}]')
      .description('📤 API 请求参数'),
  }).description('API 配置 🌐'),

  Schema.object({
    defaultNum: Schema
      .number()
      .min(1)
      .default(24)
      .description('🔢 默认时间数量'),
    defaultUnit: Schema
      .union([
        Schema.const('m').description('⏱️ 分钟'),
        Schema.const('h').description('🕐 小时'),
        Schema.const('d').description('📅 天'),
      ])
      .role('radio')
      .default('h')
      .description('🧭 默认时间单位'),
  }).description('默认时间范围 ⏱️'),

  Schema.object({
    chartWidth: Schema
      .number()
      .default(1600)
      .description('📐 图表宽度（像素）'),
    chartHeight: Schema
      .number()
      .default(900)
      .description('📏 图表高度（像素）'),
    maxDataPoints: Schema
      .number()
      .min(10)
      .max(114514)
      .default(144)
      .description('🔢 最大采样点数量（从数据库查询的数据进行采样后的点数）'),
    maxXAxisTicks: Schema
      .number()
      .min(5)
      .max(200)
      .default(24)
      .description('↔️ 横轴（X 轴）最大时间标签数量'),
    maxYAxisTicks: Schema
      .number()
      .min(3)
      .max(20)
      .default(9)
      .description('↕️ 纵轴（Y 轴）最大金价标签数量'),
    imageType: Schema
      .union(['png', 'jpeg', 'webp'])
      .default('png')
      .description('🖼️ 图片输出格式'),
    imageQuality: Schema
      .number()
      .min(0)
      .max(100)
      .default(90)
      .description('🎚️ 图片质量（仅对 jpeg 和 webp 有效）'),
    fontMode: Schema
      .union([
        Schema.const('system').description('💻 使用浏览器系统默认字体'),
        Schema.const('lxgw').description('✍️ 使用插件自动下载的 LXGW WenKai Mono'),
        Schema.const('custom').description('🔤 使用自定义字体绝对路径'),
      ])
      .role('radio')
      .default('lxgw')
      .description('🔤 字体模式<br><i>严格使用所选模式，不会自动回退到其他字体模式。</i>'),
    customFontPath: Schema
      .string()
      .default('')
      .role('textarea', { rows: [2, 5] })
      .description('📁 自定义字体绝对路径，支持 TTF、OTF、WOFF 和 WOFF2<br><i>仅在字体模式选择 custom 时使用；留空、相对路径或无效字体都会直接报错。</i>'),
    fontAssetPathRelativeToBaseDir: Schema
      .array(Schema.string())
      .role('table')
      .default([...FONT_ASSET_PATH_RELATIVE_TO_BASE_DIR])
      .disabled()
      .description('📦 LXGW 共享字体路径片段；相对于 Koishi 根目录 ctx.baseDir，仅供查看'),
    chartJsAssetPathRelativeToBaseDir: Schema
      .array(Schema.string())
      .role('table')
      .default([...CHART_ASSET_PATH_RELATIVE_TO_BASE_DIR])
      .disabled()
      .description('📊 Chart.js 运行时路径片段；相对于 Koishi 根目录 ctx.baseDir，仅供查看'),
  }).description('图表配置 📊'),

  Schema.object({
    verboseSessionOutput: Schema
      .boolean()
      .default(false)
      .description('💬 在会话中输出详细调试信息'),
    verboseConsoleOutput: Schema
      .boolean()
      .default(true)
      .description('🖥️ 在控制台输出详细调试信息'),
  }).description('调试配置 🐛'),
]);
