import type { Context } from 'koishi';
import { } from 'koishi-plugin-puppeteer';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, rename, rm, unlink } from 'node:fs/promises';
import { CHART_ASSET_PARTS } from '../config';
import { resolveRenderFont } from '../font';
import type { GoldPriceChartOptions } from '../types';
import { prepareChartData } from '../utils/chart';
import { buildGoldPriceChartHtml } from './template';

const PLUGIN_NAME = 'gold-price-image';
const chartAssetTasks = new Map<string, Promise<string>>();

function getBundledChartJsPath(): string {
  const candidates = [
    path.resolve(__dirname, '../assets/chart.umd.min.js'),
    path.resolve(__dirname, '../../assets/chart.umd.min.js'),
  ];
  const bundledPath = candidates.find(existsSync);
  if (!bundledPath) {
    throw new Error(`找不到插件包内 assets/chart.umd.min.js，已检查: ${candidates.join(', ')}`);
  }
  return bundledPath;
}

export function getRuntimeChartJsPath(baseDir: string): string {
  return path.join(baseDir, ...CHART_ASSET_PARTS);
}

function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

async function replaceFile(sourcePath: string, targetPath: string): Promise<void> {
  try {
    await rename(sourcePath, targetPath);
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? String(error.code) : '';
    if (code !== 'EEXIST' && code !== 'EPERM') throw error;
    await unlink(targetPath).catch(() => undefined);
    await rename(sourcePath, targetPath);
  }
}

async function syncChartJsAsset(
  ctx: Context,
  pluginName: string,
  bundledPath: string,
  runtimePath: string,
): Promise<string> {
  const logger = ctx.logger(pluginName);
  const bundledBuffer = await readFile(bundledPath);
  const bundledHash = sha256(bundledBuffer);
  let runtimeHash: string | null = null;

  try {
    runtimeHash = sha256(await readFile(runtimePath));
  } catch {
    // Missing or unreadable runtime assets are restored from the bundled source.
  }
  if (runtimeHash === bundledHash) return runtimePath;

  await mkdir(path.dirname(runtimePath), { recursive: true });
  const temporaryPath = `${runtimePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await copyFile(bundledPath, temporaryPath);
    const copiedHash = sha256(await readFile(temporaryPath));
    if (copiedHash !== bundledHash) {
      throw new Error('Chart.js 临时副本 SHA-256 校验失败');
    }
    await replaceFile(temporaryPath, runtimePath);
    logger.info(`${runtimeHash ? '♻️' : '✅'} Chart.js 已${runtimeHash ? '恢复' : '复制'}到运行目录: ${runtimePath}`);
    return runtimePath;
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

export async function ensureChartJsAsset(ctx: Context, pluginName: string): Promise<string> {
  const bundledPath = getBundledChartJsPath();
  const runtimePath = getRuntimeChartJsPath(ctx.baseDir);
  let task = chartAssetTasks.get(runtimePath);
  if (!task) {
    task = syncChartJsAsset(ctx, pluginName, bundledPath, runtimePath);
    chartAssetTasks.set(runtimePath, task);
  }

  try {
    return await task;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.logger(pluginName).warn(`⚠️ Chart.js 复制到 ctx.baseDir 运行目录失败，将使用插件包内 assets/chart.umd.min.js；此 fallback 会继续占用 external 或 node_modules 中的插件文件: ${bundledPath} (${message})`);
    return bundledPath;
  } finally {
    if (chartAssetTasks.get(runtimePath) === task) chartAssetTasks.delete(runtimePath);
  }
}

export async function renderGoldPriceChart(
  ctx: Context,
  options: GoldPriceChartOptions,
): Promise<string> {
  const logger = ctx.logger(PLUGIN_NAME);
  const chartData = prepareChartData(options.data, options.maxDataPoints, options.maxYAxisTicks);

  if (options.verboseConsoleOutput) {
    logger.info(`采样过后的点(按价格排序): ${chartData.sampledData.slice().sort((a, b) => a.price - b.price).map((item) => item.price)}`);
    logger.info(`📊 数据采样: 原始=${options.data.length}点, 采样后=${chartData.sampledData.length}点, 采样步长=${chartData.sampleStep}`);
    logger.info(`🎨 传递给Chart.js的价格数据(时间顺序): ${chartData.prices.join(',')}`);
    logger.info(`📊 价格统计(采样后): 最小=${chartData.minPrice.toFixed(2)}, 最大=${chartData.maxPrice.toFixed(2)}, 范围=${chartData.priceRange.toFixed(2)}, 平均=${chartData.averagePrice.toFixed(2)}`);
    logger.info(`📊 Y轴范围: 最小=${chartData.yAxisMin.toFixed(2)}, 最大=${chartData.yAxisMax.toFixed(2)}`);
    logger.info(`📊 Y轴步长: ${chartData.yAxisStep}, 刻度数=${options.maxYAxisTicks}`);
  }

  const [chartJsPath, font] = await Promise.all([
    ensureChartJsAsset(ctx, PLUGIN_NAME),
    resolveRenderFont(ctx, PLUGIN_NAME, options.fontMode, options.customFontPath),
  ]);
  const chartJsContent = await readFile(chartJsPath, 'utf-8');
  if (options.verboseConsoleOutput) {
    logger.info(`📦 Chart.js 来源: ${chartJsPath}`);
    logger.info(`🔤 图表字体来源: ${font.source}${font.path ? ` (${font.path})` : ''}`);
  }

  const html = buildGoldPriceChartHtml(options, chartData, chartJsContent, font);
  const page = await ctx.puppeteer.page();
  try {
    if (options.verboseConsoleOutput) {
      page.on('console', (message) => {
        logger.info(`🌐 浏览器Console: ${message.text()}`);
      });
    }

    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.setViewport({ width: options.width, height: options.height });
    try {
      await page.waitForFunction(
        'window.__chartReady === true || typeof window.__chartError === "string"',
        { timeout: 10000 },
      );
    } catch (error) {
      if (options.verboseConsoleOutput) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn(`⚠️ 等待 Chart.js 完成超时，将尝试截取当前页面: ${message}`);
      }
    }

    const chartError = await page.evaluate(() => (window as typeof window & { __chartError?: string }).__chartError);
    if (chartError) throw new Error(`Chart.js 渲染失败: ${chartError}`);

    await new Promise((resolve) => setTimeout(resolve, 200));
    const screenshot = await page.screenshot({
      type: options.imageType,
      quality: options.imageType !== 'png' ? options.quality : undefined,
      encoding: 'base64',
    });
    return screenshot as string;
  } finally {
    await page.close();
  }
}
