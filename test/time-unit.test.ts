import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { parseGoldPriceResponse } from '../src/api';
import {
  CHART_ASSET_PATH_RELATIVE_TO_BASE_DIR,
  FONT_ASSET_PATH_RELATIVE_TO_BASE_DIR,
} from '../src/config';
import { getLxgwWenKaiPathByBaseDir, resolveRenderFont } from '../src/font';
import { getRuntimeChartJsPath } from '../src/render';
import {
  getNextSimpleFetchTime,
  normalizeFetchCronExpression,
  setupGoldPriceCollector,
} from '../src/scheduler';
import { sampleGoldPriceData } from '../src/utils/chart';
import { getTimeUnitDisplayName, getTimeUnitMultiplier } from '../src/utils/time';

test('💰✅ parseGoldPriceResponse parses a valid CMB response', () => {
  assert.deepEqual(parseGoldPriceResponse({
    data: {
      FQAMBPRCZ1: {
        zBuyPrc: '742.10',
        zSelPrc: '740.30',
      },
      NowTime: '2026-07-22 12:00:00',
    },
  }), {
    buyPrice: 742.1,
    sellPrice: 740.3,
    averagePrice: 741.2,
    updateTime: '2026-07-22 12:00:00',
  });
});

test('💰🚫 parseGoldPriceResponse rejects malformed or non-numeric prices', () => {
  assert.equal(parseGoldPriceResponse(null), null);
  assert.equal(parseGoldPriceResponse({ data: {} }), null);
  assert.equal(parseGoldPriceResponse({
    data: { FQAMBPRCZ1: { zBuyPrc: 'invalid', zSelPrc: '740.30' } },
  }), null);
});

test('⏱️🌐 time unit helpers preserve supported aliases and title labels', () => {
  assert.equal(getTimeUnitMultiplier('minutes'), 1 / 60);
  assert.equal(getTimeUnitMultiplier('HOUR'), 1);
  assert.equal(getTimeUnitMultiplier('天'), 24);
  assert.equal(getTimeUnitMultiplier('week'), undefined);
  assert.equal(getTimeUnitDisplayName('m'), '分钟');
  assert.equal(getTimeUnitDisplayName('小时'), '小时');
  assert.equal(getTimeUnitDisplayName('day'), '天');
});

test('⏰📐 simple scheduling aligns long intervals without truncating hours', () => {
  const now = new Date(2026, 6, 22, 12, 10, 30).getTime();
  const nextNinetyMinutes = new Date(getNextSimpleFetchTime(now, 90));
  assert.equal(nextNinetyMinutes.getHours(), 13);
  assert.equal(nextNinetyMinutes.getMinutes(), 30);
  assert.equal(nextNinetyMinutes.getSeconds(), 0);

  const nextDay = new Date(getNextSimpleFetchTime(now, 1440));
  assert.equal(nextDay.getDate(), 23);
  assert.equal(nextDay.getHours(), 0);
  assert.equal(nextDay.getMinutes(), 0);
});

test('🗓️🔒 cron expressions are normalized and restricted to five fields', () => {
  assert.equal(normalizeFetchCronExpression('  */5   * * * *  '), '*/5 * * * *');
  assert.throws(() => normalizeFetchCronExpression('*/5 * * *'), /必须是五段式/);
  assert.throws(() => normalizeFetchCronExpression('0 */5 * * * *'), /必须是五段式/);
});

test('🧩⏰ cron mode registers through the injected child context', () => {
  let registeredExpression = '';
  const cronCtx = {
    cron(expression: string) {
      registeredExpression = expression;
      return () => undefined;
    },
  } as any;
  const ctx = {
    ...cronCtx,
    inject(services: string[], callback: (childCtx: unknown) => void) {
      assert.deepEqual(services, ['cron']);
      callback(cronCtx);
    },
    on(event: string, callback: () => void) {
      if (event === 'ready') callback();
    },
  } as any;
  const logger = { info() {}, warn() {}, error() {} } as any;

  setupGoldPriceCollector(ctx, {
    fetchScheduleMode: 'cron',
    fetchCronExpression: '  */5   * * * *  ',
  } as any, logger);

  assert.equal(registeredExpression, '*/5 * * * *');
});

test('📊📍 sampleGoldPriceData keeps chronological samples and the final point', () => {
  const data = Array.from({ length: 10 }, (_, index) => ({
    timestamp: new Date(2026, 0, 1, 0, index),
    price: 700 + index,
  }));
  assert.deepEqual(
    sampleGoldPriceData(data, 3).map(({ price }) => price),
    [700, 704, 708, 709],
  );
  assert.equal(sampleGoldPriceData(data, 20), data);
});

test('📁🔒 managed asset paths are derived only from baseDir and fixed parts', () => {
  const baseDir = path.resolve('koishi-instance');
  assert.equal(
    getLxgwWenKaiPathByBaseDir(baseDir),
    path.join(baseDir, ...FONT_ASSET_PATH_RELATIVE_TO_BASE_DIR),
  );
  assert.equal(
    getRuntimeChartJsPath(baseDir),
    path.join(baseDir, ...CHART_ASSET_PATH_RELATIVE_TO_BASE_DIR),
  );
});

test('🔤🎯 font modes are strict and custom mode requires an absolute path', async () => {
  const ctx = {
    baseDir: path.resolve('koishi-instance'),
    logger: () => ({ info() {}, warn() {}, error() {} }),
  } as any;

  const systemFont = await resolveRenderFont(ctx, 'gold-price-image', 'system', '');
  assert.equal(systemFont.source, 'system');
  await assert.rejects(
    resolveRenderFont(ctx, 'gold-price-image', 'custom', ''),
    /customFontPath 为空/,
  );
  await assert.rejects(
    resolveRenderFont(ctx, 'gold-price-image', 'custom', path.join('fonts', 'custom.ttf')),
    /必须使用绝对路径/,
  );
});
