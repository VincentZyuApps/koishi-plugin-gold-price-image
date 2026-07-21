import type { Context } from 'koishi';
import type { GoldPriceData, GoldPriceQuote } from './types';

declare module 'koishi' {
  interface Tables {
    gold_price_data: GoldPriceData;
  }
}

export function setupGoldPriceDatabase(ctx: Context): void {
  ctx.model.extend('gold_price_data', {
    id: 'unsigned',
    timestamp: 'timestamp',
    price: 'double',
    productCode: 'string',
    productName: 'string',
  }, {
    autoInc: true,
  });
}

export async function saveGoldPrice(ctx: Context, quote: GoldPriceQuote): Promise<void> {
  await ctx.database.create('gold_price_data', {
    timestamp: new Date(),
    price: quote.averagePrice,
    productCode: 'FQAMBPRCZ1',
    productName: '招行黄金',
  });
}

export async function findGoldPricesSince(ctx: Context, startTime: Date): Promise<GoldPriceData[]> {
  return ctx.database
    .select('gold_price_data')
    .where({ timestamp: { $gte: startTime } })
    .orderBy('timestamp', 'asc')
    .execute();
}
