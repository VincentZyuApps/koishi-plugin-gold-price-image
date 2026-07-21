import { h, type Context, type Logger } from 'koishi';
import type { Config } from '../config';
import { findGoldPricesSince } from '../database';
import { renderGoldPriceChart } from '../render';
import { getTimeUnitDisplayName, getTimeUnitMultiplier } from '../utils/time';

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatErrorDetails(error: unknown): string {
  return error instanceof Error ? error.stack || error.message : String(error);
}

export function registerPriceTrendCommand(ctx: Context, config: Config, logger: Logger): void {
  ctx.command(`${config.imageCommandName} [num:number] [unit:string]`, '查看金价历史走势图')
    .alias('goldtrend')
    .action(async ({ session }, num, unit) => {
      let tipMsgIdArr: string[] | undefined;
      try {
        tipMsgIdArr = await session.send(`${h.quote(session.messageId)}⏳ 正在生成金价走势图，请稍候...`);

        const actualNum = num !== undefined ? Number(num) : config.defaultNum;
        const actualUnit = unit ?? config.defaultUnit;
        const multiplier = getTimeUnitMultiplier(actualUnit);
        if (!multiplier) {
          await session.send(`❌ 不支持的时间单位: ${actualUnit}\n支持的单位: m/h/d/minute/hour/day/分/分钟/时/小时/天`);
          return;
        }

        const hoursBack = actualNum * multiplier;
        if (hoursBack <= 0 || hoursBack > 24 * 365) {
          await session.send('❌ 时间范围必须在 1分钟 到 365天 之间');
          return;
        }

        const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
        const priceData = await findGoldPricesSince(ctx, startTime);
        if (priceData.length === 0) {
          await session.send('暂无金价数据，请等待数据采集...');
          return;
        }

        const titleRange = `${actualNum}${getTimeUnitDisplayName(actualUnit)}`;
        const chartBase64 = await renderGoldPriceChart(ctx, {
          data: priceData,
          width: config.chartWidth,
          height: config.chartHeight,
          imageType: config.imageType,
          quality: config.imageQuality,
          title: `招行金价走势（最近${titleRange}）`,
          maxDataPoints: config.maxDataPoints,
          maxXAxisTicks: config.maxXAxisTicks,
          maxYAxisTicks: config.maxYAxisTicks,
          verboseConsoleOutput: config.verboseConsoleOutput,
          fontMode: config.fontMode,
          customFontPath: config.customFontPath,
        });

        await session.send(h.image(`data:image/${config.imageType};base64,${chartBase64}`));
      } catch (error) {
        logger.error(`生成金价走势图失败: ${formatError(error)}`);
        if (config.verboseConsoleOutput) {
          logger.error(`🔍 错误详情: ${formatErrorDetails(error)}`);
        }
        const errorMsg = '生成金价走势图失败，请稍后重试。';
        await session.send(config.verboseSessionOutput
          ? `${errorMsg}\n🔍 调试信息: ${formatError(error)}`
          : errorMsg);
      } finally {
        if (tipMsgIdArr?.length) {
          try {
            await session.bot.deleteMessage(session.channelId, tipMsgIdArr[0]);
          } catch (error) {
            if (config.verboseConsoleOutput) {
              logger.warn(`⚠️ 撤回提示消息失败: ${formatError(error)}`);
            }
          }
        }
      }
    });
}
