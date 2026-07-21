export type FontMode = 'system' | 'lxgw' | 'custom';
export type FetchScheduleMode = 'simple' | 'cron';

export interface GoldPriceData {
  id: number;
  timestamp: Date;
  price: number;
  productCode: string;
  productName: string;
}

export interface GoldPriceQuote {
  buyPrice: number;
  sellPrice: number;
  averagePrice: number;
  updateTime: string;
}

export interface GoldPriceApiResult {
  quote: GoldPriceQuote | null;
  response: unknown;
}

export interface GoldPriceChartOptions {
  data: Array<Pick<GoldPriceData, 'timestamp' | 'price'>>;
  width: number;
  height: number;
  imageType: 'png' | 'jpeg' | 'webp';
  quality: number;
  title: string;
  maxDataPoints: number;
  maxXAxisTicks: number;
  maxYAxisTicks: number;
  verboseConsoleOutput: boolean;
  fontMode: FontMode;
  customFontPath: string;
}
