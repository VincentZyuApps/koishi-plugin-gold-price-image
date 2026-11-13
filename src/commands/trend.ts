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
  const command = ctx.command(`${config.imageCommandName} [num:number] [unit:string]`, '查看金价历史走势图');
  for (const alias of config.imageCommandAliases) command.alias(alias);

  command
    .usage([
      '参数说明：',
      `  [num]   时间跨度数值（正数，默认: ${config.defaultNum}，范围: 1分钟 ~ 365天）`,
      `  [unit]  时间单位（默认: ${config.defaultUnit}）`,
      '          • 分钟级: m, min, minute, 分, 分钟',
      '          • 小时级: h, hr, hour, 时, 小时',
      '          • 天数级: d, day, 天, 日',
    ].join('\n'))
    .example(`${config.imageCommandName}             查看最近 24 小时走势图（默认配置）`)
    .example(`${config.imageCommandName} 30 m          查看最近 30 分钟走势图`)
    .example(`${config.imageCommandName} 12 h          查看最近 12 小时走势图`)
    .example(`${config.imageCommandName} 7 d           查看最近 7 天走势图`)
    .example(`${config.imageCommandName} 3 天          支持中文单位（3天/6小时/30分钟等）`);

  command.action(async ({ session }, num, unit) => {
    let tipMsgIdArr: string[] | undefined;
    try {
      tipMsgIdArr = await session.send(`${h.quote(session.messageId)}⏳ 正在生成金价走势图，请稍候...`);

      const actualNum = num !== undefined ? Number(num) : config.defaultNum;
      if (Number.isNaN(actualNum)) {
        await session.send(`❌ 时间数值必须是有效的正数: ${num}\n💡 可发送「help ${config.imageCommandName}」查看使用示例`);
        return;
      }

      const actualUnit = unit ?? config.defaultUnit;
      const multiplier = getTimeUnitMultiplier(actualUnit);
      if (!multiplier) {
        await session.send(`❌ 不支持的时间单位: ${actualUnit}\n支持的单位: m/min/minute/分/分钟/h/hr/hour/时/小时/d/day/天/日\n💡 可发送「help ${config.imageCommandName}」查看详细说明`);
        return;
      }

      const hoursBack = actualNum * multiplier;
      if (hoursBack <= 0 || hoursBack > 24 * 365) {
        await session.send(`❌ 时间范围必须在 1分钟 到 365天 之间\n💡 可发送「help ${config.imageCommandName}」查看支持的数值范围`);
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
