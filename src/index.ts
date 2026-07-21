import type { Context } from 'koishi';
import type { Config as GoldPriceConfig } from './config';
import { registerCurrentPriceCommand } from './commands/current';
import { registerPriceTrendCommand } from './commands/trend';
import { setupGoldPriceCollector } from './api';
import { setupGoldPriceDatabase } from './database';
import { ensureManagedLxgwFont } from './font';
import { ensureChartJsAsset } from './render';

export const inject = {
  required: ['database', 'puppeteer', 'http'],
};

export const name = 'gold-price-image';
const PLUGIN_NAME = name;

export { Config } from './config';
export { usage } from './usage';

export function apply(ctx: Context, config: GoldPriceConfig): void {
  const logger = ctx.logger(PLUGIN_NAME);

  setupGoldPriceDatabase(ctx);
  setupGoldPriceCollector(ctx, config, logger);
  registerCurrentPriceCommand(ctx, config, logger);
  registerPriceTrendCommand(ctx, config, logger);

  void ensureChartJsAsset(ctx, PLUGIN_NAME).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`❌ apply 阶段 Chart.js 运行资产预检查失败: ${message}`);
  });

  if (config.fontMode === 'lxgw') {
    void ensureManagedLxgwFont(ctx, PLUGIN_NAME).then((ready) => {
      if (!ready) logger.error('❌ apply 阶段 LXGW 字体预检查失败，lxgw 模式出图时将直接报错');
    }).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`❌ apply 阶段 LXGW 字体预检查失败，lxgw 模式出图时将直接报错: ${message}`);
    });
  }
}
