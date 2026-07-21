import type { Context, Logger } from 'koishi';
import type { Config } from '../config';
import { requestGoldPrice } from '../api';

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatErrorDetails(error: unknown): string {
  return error instanceof Error ? error.stack || error.message : String(error);
}

export function registerCurrentPriceCommand(ctx: Context, config: Config, logger: Logger): void {
  ctx.command(config.textCommandName, '获取当前招行金价')
    .alias('goldprice')
    .action(async ({ session }) => {
      try {
        const result = await requestGoldPrice(ctx, config);
        if (result.quote) {
          const msg = [
            '💰 招行黄金实时报价',
            `📅 更新时间：\t${result.quote.updateTime}`,
            `💵 买入价：\t¥${result.quote.buyPrice.toFixed(2)}/克`,
            `💸 卖出价：\t¥${result.quote.sellPrice.toFixed(2)}/克`,
            `📊 价格差：\t¥${(result.quote.buyPrice - result.quote.sellPrice).toFixed(2)}/克`,
          ].join('\n');
          await session.send(msg);
          return;
        }

        const errorMsg = '❌ 获取金价失败，请稍后重试';
        await session.send(config.verboseSessionOutput
          ? `${errorMsg}\n🔍 调试信息: API 响应数据格式异常`
          : errorMsg);
        if (config.verboseConsoleOutput) {
          logger.error(`📋 API 响应: ${JSON.stringify(result.response)}`);
        }
      } catch (error) {
        logger.error(`获取金价失败: ${formatError(error)}`);
        if (config.verboseConsoleOutput) {
          logger.error(`🔍 错误详情: ${formatErrorDetails(error)}`);
        }
        const errorMsg = '❌ 获取金价失败，请稍后重试';
        await session.send(config.verboseSessionOutput
          ? `${errorMsg}\n🔍 调试信息: ${formatError(error)}`
          : errorMsg);
      }
    });
}
