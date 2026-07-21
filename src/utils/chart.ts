import type { GoldPriceChartOptions } from '../types';

export interface PreparedChartData {
  sampledData: GoldPriceChartOptions['data'];
  sampleStep: number;
  labels: string[];
  prices: number[];
  minPrice: number;
  maxPrice: number;
  averagePrice: number;
  priceRange: number;
  yAxisMin: number;
  yAxisMax: number;
  yAxisStep: number;
  isPositive: boolean;
  originalMinPrice: number;
  originalMaxPrice: number;
  originalAveragePrice: number;
  originalLastPrice: number;
  originalPriceChangePercent: number;
  originalIsPositive: boolean;
}

export function sampleGoldPriceData(
  data: GoldPriceChartOptions['data'],
  maxDataPoints: number,
): GoldPriceChartOptions['data'] {
  if (data.length <= maxDataPoints) return data;

  const step = Math.ceil(data.length / maxDataPoints);
  const sampledData = data.filter((_, index) => index % step === 0);
  if (sampledData[sampledData.length - 1] !== data[data.length - 1]) {
    sampledData.push(data[data.length - 1]);
  }
  return sampledData;
}

export function prepareChartData(
  data: GoldPriceChartOptions['data'],
  maxDataPoints: number,
  maxYAxisTicks: number,
): PreparedChartData {
  if (data.length === 0) throw new Error('无法渲染空的金价数据');

  const sampledData = sampleGoldPriceData(data, maxDataPoints);
  const sampleStep = Math.ceil(data.length / maxDataPoints);
  const labels = sampledData.map((item) => new Date(item.timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }));
  const prices = sampledData.map((item) => item.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const priceRange = maxPrice - minPrice;
  const paddingValue = 0.01;
  const yAxisMin = Math.floor((minPrice - paddingValue) * 100) / 100;
  const yAxisMax = Math.ceil((maxPrice + paddingValue) * 100) / 100;
  const visibleRange = yAxisMax - yAxisMin || 1;
  let yAxisStep = Number((visibleRange / Math.max(1, maxYAxisTicks - 1)).toFixed(3));
  if (yAxisStep < 0.01) yAxisStep = 0.01;

  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const isPositive = lastPrice - firstPrice >= 0;
  const allPrices = data.map((item) => item.price);
  const originalMinPrice = Math.min(...allPrices);
  const originalMaxPrice = Math.max(...allPrices);
  const originalAveragePrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;
  const originalFirstPrice = allPrices[0];
  const originalLastPrice = allPrices[allPrices.length - 1];
  const originalPriceChange = originalLastPrice - originalFirstPrice;

  return {
    sampledData,
    sampleStep,
    labels,
    prices,
    minPrice,
    maxPrice,
    averagePrice,
    priceRange,
    yAxisMin,
    yAxisMax,
    yAxisStep,
    isPositive,
    originalMinPrice,
    originalMaxPrice,
    originalAveragePrice,
    originalLastPrice,
    originalPriceChangePercent: (originalPriceChange / originalFirstPrice) * 100,
    originalIsPositive: originalPriceChange >= 0,
  };
}
