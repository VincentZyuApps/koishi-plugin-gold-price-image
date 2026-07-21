import path from 'path';
import { createHash, randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { mkdir, readFile, rename, stat, unlink, writeFile } from 'fs/promises';
import type { Context } from 'koishi';
import { FONT_ASSET_PARTS } from './config';
import type { FontMode } from './types';

export const LXGW_WENKAI_FILE_NAME = FONT_ASSET_PARTS[FONT_ASSET_PARTS.length - 1];

const GITEE_RELEASE_BASE = 'https://gitee.com/vincent-zyu/koishi-plugin-awa-quote-image/releases/download/fonts';
const GITHUB_RELEASE_BASE = 'https://github.com/VincentZyuApps/koishi-plugin-awa-quote-image/releases/download/fonts';
const LXGW_WENKAI_INTEGRITY = {
  size: 24755236,
  sha256: 'ee9faa6479c5b2434f9bceca8e2e7b643f699f4f3d067aac9609261e07c6be61',
};
const DOWNLOAD_SOURCES = [
  { source: 'Gitee', url: `${GITEE_RELEASE_BASE}/${LXGW_WENKAI_FILE_NAME}` },
  { source: 'GitHub', url: `${GITHUB_RELEASE_BASE}/${LXGW_WENKAI_FILE_NAME}` },
];
const SYSTEM_FONT_FAMILY = "'Microsoft YaHei', 'PingFang SC', 'SimHei', sans-serif";
const preparationTasks = new Map<string, Promise<boolean>>();
const fontDataCache = new Map<string, { mtimeMs: number; size: number; dataUri: string; format: string }>();

export interface ResolvedRenderFont {
  fontFaceCss: string;
  fontFamily: string;
  source: 'custom' | 'lxgw' | 'system';
  checkFamily?: string;
  path?: string;
}

export function getFontDirByBaseDir(baseDir: string): string {
  return path.join(baseDir, ...FONT_ASSET_PARTS.slice(0, -1));
}

export function getLxgwWenKaiPathByBaseDir(baseDir: string): string {
  return path.join(baseDir, ...FONT_ASSET_PARTS);
}

function verifyFontBuffer(buffer: Buffer): boolean {
  if (buffer.length !== LXGW_WENKAI_INTEGRITY.size) return false;
  return createHash('sha256').update(buffer).digest('hex') === LXGW_WENKAI_INTEGRITY.sha256;
}

async function verifyManagedFont(filePath: string): Promise<boolean> {
  if (!existsSync(filePath)) return false;
  try {
    return verifyFontBuffer(await readFile(filePath));
  } catch {
    return false;
  }
}

async function replaceFile(sourcePath: string, targetPath: string): Promise<void> {
  try {
    await rename(sourcePath, targetPath);
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? String(error.code) : '';
    if (code !== 'EEXIST' && code !== 'EPERM') throw error;
    await unlink(targetPath).catch(() => undefined);
    await rename(sourcePath, targetPath);
  }
}

async function downloadManagedFont(ctx: Context, pluginName: string, targetPath: string): Promise<boolean> {
  const logger = ctx.logger(pluginName);
  await mkdir(path.dirname(targetPath), { recursive: true });
  let lastError: unknown;

  for (const candidate of DOWNLOAD_SOURCES) {
    const temporaryPath = `${targetPath}.${process.pid}.${randomUUID()}.tmp`;
    try {
      logger.info(`📥 开始从 ${candidate.source} 下载字体: ${LXGW_WENKAI_FILE_NAME}`);
      const response = await ctx.http.get(candidate.url, {
        responseType: 'arraybuffer',
        timeout: 60000,
      });
      const buffer = Buffer.from(response);
      if (!verifyFontBuffer(buffer)) {
        throw new Error('字体文件大小或 SHA-256 校验失败');
      }
      await writeFile(temporaryPath, buffer, { flag: 'wx' });
      if (!(await verifyManagedFont(temporaryPath))) {
        throw new Error('字体写入后的 SHA-256 校验失败');
      }
      await replaceFile(temporaryPath, targetPath);
      logger.info(`✅ 字体下载并校验成功: ${LXGW_WENKAI_FILE_NAME} (${candidate.source})`);
      return true;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(`⚠️ 从 ${candidate.source} 下载字体失败: ${message}`);
    } finally {
      await unlink(temporaryPath).catch(() => undefined);
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  logger.error(`❌ Gitee 与 GitHub 字体源均不可用，LXGW 字体准备失败: ${message}`);
  return false;
}

async function prepareManagedFont(ctx: Context, pluginName: string): Promise<boolean> {
  const targetPath = getLxgwWenKaiPathByBaseDir(ctx.baseDir);
  if (await verifyManagedFont(targetPath)) return true;

  if (existsSync(targetPath)) {
    ctx.logger(pluginName).warn(`⚠️ ${LXGW_WENKAI_FILE_NAME} 校验失败，将重新下载`);
  }
  return downloadManagedFont(ctx, pluginName, targetPath);
}

export function ensureManagedLxgwFont(ctx: Context, pluginName: string): Promise<boolean> {
  const targetPath = getLxgwWenKaiPathByBaseDir(ctx.baseDir);
  const existingTask = preparationTasks.get(targetPath);
  if (existingTask) return existingTask;

  const task = prepareManagedFont(ctx, pluginName);
  preparationTasks.set(targetPath, task);
  void task.then((ready) => {
    if (!ready) preparationTasks.delete(targetPath);
  }, () => {
    preparationTasks.delete(targetPath);
  });
  return task;
}

function getFontMetadata(filePath: string): { mime: string; format: string } {
  switch (path.extname(filePath).toLowerCase()) {
    case '.otf': return { mime: 'font/otf', format: 'opentype' };
    case '.woff': return { mime: 'font/woff', format: 'woff' };
    case '.woff2': return { mime: 'font/woff2', format: 'woff2' };
    default: return { mime: 'font/ttf', format: 'truetype' };
  }
}

async function loadFontData(filePath: string): Promise<{ dataUri: string; format: string }> {
  const fileStat = await stat(filePath);
  if (!fileStat.isFile() || fileStat.size === 0) throw new Error('字体路径不是有效文件');

  const cached = fontDataCache.get(filePath);
  if (cached && cached.mtimeMs === fileStat.mtimeMs && cached.size === fileStat.size) {
    return cached;
  }

  const buffer = await readFile(filePath);
  const signature = buffer.subarray(0, 4).toString('latin1');
  const isSfnt = buffer.length >= 4 && buffer.readUInt32BE(0) === 0x00010000;
  if (!isSfnt && !['OTTO', 'true', 'typ1', 'ttcf', 'wOFF', 'wOF2'].includes(signature)) {
    throw new Error('字体文件头无效或格式不受支持');
  }
  const metadata = getFontMetadata(filePath);
  const loaded = {
    mtimeMs: fileStat.mtimeMs,
    size: fileStat.size,
    dataUri: `data:${metadata.mime};base64,${buffer.toString('base64')}`,
    format: metadata.format,
  };
  fontDataCache.set(filePath, loaded);
  return loaded;
}

async function createEmbeddedFont(filePath: string, family: string, source: 'custom' | 'lxgw'): Promise<ResolvedRenderFont> {
  const fontData = await loadFontData(filePath);
  return {
    fontFaceCss: `@font-face { font-family: '${family}'; src: url('${fontData.dataUri}') format('${fontData.format}'); font-style: normal; font-weight: 400; font-display: block; }`,
    fontFamily: `'${family}', ${SYSTEM_FONT_FAMILY}`,
    source,
    checkFamily: family,
    path: filePath,
  };
}

export async function resolveRenderFont(
  ctx: Context,
  pluginName: string,
  fontMode: FontMode,
  customFontPath: string,
): Promise<ResolvedRenderFont> {
  const logger = ctx.logger(pluginName);
  if (fontMode === 'system') {
    return {
      fontFaceCss: '',
      fontFamily: SYSTEM_FONT_FAMILY,
      source: 'system',
    };
  }

  if (fontMode === 'custom') {
    const runtimePath = String(customFontPath || '').trim();
    if (!runtimePath) {
      throw new Error('字体模式为 custom，但 customFontPath 为空');
    }
    if (!path.isAbsolute(runtimePath)) {
      throw new Error(`自定义字体必须使用绝对路径: ${runtimePath}`);
    }
    try {
      const customFont = await createEmbeddedFont(path.normalize(runtimePath), 'GoldPriceCustomFont', 'custom');
      logger.info(`🔤 使用自定义字体: ${runtimePath}`);
      return customFont;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`自定义字体加载失败: ${runtimePath} (${message})`);
    }
  }

  if (fontMode !== 'lxgw') {
    throw new Error(`不支持的字体模式: ${fontMode}`);
  }

  const managedPath = getLxgwWenKaiPathByBaseDir(ctx.baseDir);
  const managedReady = await ensureManagedLxgwFont(ctx, pluginName);
  if (!managedReady) {
    throw new Error(`LXGW 字体下载或 SHA-256 校验失败: ${managedPath}`);
  }

  try {
    return await createEmbeddedFont(managedPath, 'GoldPriceLxgwWenKaiMono', 'lxgw');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`LXGW 字体加载失败: ${managedPath} (${message})`);
  }
}
