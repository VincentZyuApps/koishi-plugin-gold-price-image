import type { Context, Logger } from 'koishi';
import type { Config } from './config';
import { saveGoldPrice } from './database';
import type { GoldPriceApiResult, GoldPriceQuote } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseGoldPriceResponse(response: unknown): GoldPriceQuote | null {
  if (!isRecord(response) || !isRecord(response.data)) return null;

  const goldData = response.data.FQAMBPRCZ1;
  if (!isRecord(goldData)) return null;

  const buyPrice = Number.parseFloat(String(goldData.zBuyPrc));
  const sellPrice = Number.parseFloat(String(goldData.zSelPrc));
  const averagePrice = (buyPrice + sellPrice) / 2;
  if (![buyPrice, sellPrice, averagePrice].every(Number.isFinite)) return null;

  return {
    buyPrice,
    sellPrice,
    averagePrice,
    updateTime: String(response.data.NowTime ?? ''),
  };
}

export async function requestGoldPrice(ctx: Context, config: Config): Promise<GoldPriceApiResult> {
  const headers = Object.fromEntries(
    config.apiHeaders.map(({ key, value }) => [key, value]),
  );
  const response: unknown = await ctx.http.post(config.apiUrl, config.apiPayload, { headers });

  return {
    quote: parseGoldPriceResponse(response),
    response,
  };
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatErrorDetails(error: unknown): string {
  return error instanceof Error ? error.stack || error.message : String(error);
}

export async function collectGoldPrice(ctx: Context, config: Config, logger: Logger): Promise<void> {
  try {
    logger.info('🔄 开始抓取金价数据...');
    const result = await requestGoldPrice(ctx, config);

    if (config.verboseConsoleOutput) {
      logger.info(`📡 API 响应: ${JSON.stringify(result.response)}`);
    }

    if (!result.quote) {
      logger.warn('⚠️ API 响应数据格式异常或金价数据无效');
      if (config.verboseConsoleOutput) {
        logger.warn(`📋 完整响应: ${JSON.stringify(result.response)}`);
      }
      return;
    }

    await saveGoldPrice(ctx, result.quote);
    logger.info(`✅ 成功记录金价: 买入¥${result.quote.buyPrice.toFixed(2)}/克, 卖出¥${result.quote.sellPrice.toFixed(2)}/克, 平均¥${result.quote.averagePrice.toFixed(2)}/克`);
  } catch (error) {
    logger.error(`❌ 获取金价失败: ${formatError(error)}`);
    if (config.verboseConsoleOutput) {
      logger.error(`🔍 错误详情: ${formatErrorDetails(error)}`);
    }
  }
}
