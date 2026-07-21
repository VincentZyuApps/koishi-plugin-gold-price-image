import type { Context, Logger } from 'koishi';
import type { Config } from './config';
import { collectGoldPrice } from './api';

interface CronContext extends Context {
  cron: (expression: string, callback: () => void) => () => void;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function setupGoldPriceCollector(ctx: Context, config: Config, logger: Logger): void {
  let collecting = false;

  async function collectSafely(runtimeCtx: Context, trigger: 'simple' | 'cron'): Promise<void> {
    if (collecting) {
      logger.warn(`⏭️ 上一轮金价采集尚未完成，跳过本轮 ${trigger} 任务`);
      return;
    }
    collecting = true;
    try {
      await collectGoldPrice(runtimeCtx, config, logger);
    } finally {
      collecting = false;
    }
  }

  if (config.fetchScheduleMode === 'simple') {
    setupSimpleCollector(ctx, config, logger, () => collectSafely(ctx, 'simple'));
    return;
  }

  if (config.fetchScheduleMode === 'cron') {
    setupCronCollector(ctx, config, logger, (runtimeCtx) => collectSafely(runtimeCtx, 'cron'));
    return;
  }

  throw new Error(`不支持的金价采集模式: ${config.fetchScheduleMode}`);
}

export function getNextSimpleFetchTime(nowMs: number, intervalMinutes: number): number {
  if (!Number.isFinite(intervalMinutes) || intervalMinutes < 1 || intervalMinutes > 1440) {
    throw new Error(`抓取间隔必须是 1 到 1440 分钟: ${intervalMinutes}`);
  }
  const intervalMs = intervalMinutes * 60 * 1000;
  const timezoneOffsetMs = new Date(nowMs).getTimezoneOffset() * 60 * 1000;
  const localNowMs = nowMs - timezoneOffsetMs;
  const nextLocalMs = (Math.floor(localNowMs / intervalMs) + 1) * intervalMs;
  return nextLocalMs + timezoneOffsetMs;
}

export function normalizeFetchCronExpression(expression: string): string {
  const normalized = String(expression || '').trim().replace(/\s+/g, ' ');
  if (normalized.split(' ').length !== 5) {
    throw new Error(`Cron 表达式必须是五段式（分 时 日 月 星期）: ${expression}`);
  }
  return normalized;
}

function setupSimpleCollector(
  ctx: Context,
  config: Config,
  logger: Logger,
  collect: () => Promise<void>,
): void {
  let timeoutDispose: (() => void) | null = null;

  function scheduleNext(): void {
    const nowMs = Date.now();
    const nextRunAt = getNextSimpleFetchTime(nowMs, config.fetchIntervalMinutes);
    const delayMs = Math.max(1, nextRunAt - nowMs);
    const nextTime = new Date(nextRunAt).toLocaleString('zh-CN', { hour12: false });
    logger.info(`⏰ 下次抓取时间: ${nextTime}，距离现在 ${Math.floor(delayMs / 1000)} 秒`);

    timeoutDispose = ctx.setTimeout(() => {
      scheduleNext();
      void collect();
    }, delayMs);
  }

  ctx.on('ready', () => {
    scheduleNext();
    logger.info(`⏰ 简单定时任务已启动，每 ${config.fetchIntervalMinutes} 分钟抓取一次金价`);
  });
  ctx.on('dispose', () => {
    if (!timeoutDispose) return;
    timeoutDispose();
    timeoutDispose = null;
    logger.info('⏹️ 简单定时任务已停止');
  });
}

function setupCronCollector(
  ctx: Context,
  config: Config,
  logger: Logger,
  collect: (runtimeCtx: Context) => Promise<void>,
): void {
  const expression = normalizeFetchCronExpression(config.fetchCronExpression);

  ctx.inject(['cron'], (childCtx) => {
    const cronCtx = childCtx as CronContext;
    if (!cronCtx.cron) {
      logger.error('❌ cron 服务已注入但 ctx.cron 不可用，无法注册金价采集任务');
      return;
    }
    try {
      cronCtx.cron(expression, () => collect(cronCtx));
      logger.info(`⏰ Cron 定时任务已注册: ${expression}`);
    } catch (error) {
      logger.error(`❌ Cron 表达式无效，金价采集任务注册失败: ${formatError(error)}`);
    }
  });

  ctx.on('ready', () => {
    if (!(ctx as Partial<CronContext>).cron) {
      logger.error('❌ 已选择 cron 采集模式，但 koishi-plugin-cron 服务未安装或未启用；不会回退到简单模式');
    }
  });
}
