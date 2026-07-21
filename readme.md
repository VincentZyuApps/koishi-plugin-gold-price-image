# 💰 koishi-plugin-gold-price-image

[![npm](https://img.shields.io/npm/v/koishi-plugin-gold-price-image?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-gold-price-image)

📈 招行金价走势图 Koishi 插件

## ⚠️ 重要提示

**🔴 本插件需要启用 `puppeteer`、`http` 和 `database` 服务才能正常使用！**

请确保在 Koishi 控制台中已经安装并启用了以下插件：
- 📦 `puppeteer` - 用于渲染图表
- 🌐 `http` - 用于网络请求
- 💾 `database` - 用于存储历史数据

如果没有安装这些插件，本插件将无法工作！

---

## 🚀 功能介绍

- 🔄 **定时抓取** - 自动从招行API抓取实时金价数据
- 📊 **精美图表** - 使用 Chart.js 渲染专业的金价走势图
- 💾 **数据存储** - 自动存储历史数据到数据库
- 🎨 **自定义范围** - 支持查看不同时间范围的金价走势
- 📈 **统计信息** - 自动计算最高价、最低价、平均价

## 📖 使用方法

### 基础命令

```
金价              # 获取当前招行金价
金价走势          # 查看最近24小时金价走势
```

### 指定时间范围

```
金价走势 1 h      # 查看最近1小时
金价走势 6 h      # 查看最近6小时
金价走势 24 h     # 查看最近24小时
金价走势 7 d      # 查看最近7天
金价走势 30 d     # 查看最近30天
```

## ⚙️ 配置说明

### 基础配置

- **命令名称** - 默认为 `金价`，可自定义
- **抓取间隔** - 默认每5分钟抓取一次，可调整为1-1440分钟

### API配置

- **API地址** - 招行金价API（默认已配置）
- **请求参数** - API请求参数（默认已配置）

### 图表配置

- **图表宽度** - 默认1600像素
- **图表高度** - 默认900像素
- **最大数据点** - 默认144个
- **图片格式** - 支持 PNG、JPEG、WEBP
- **图片质量** - 0-100，默认90

### 字体配置

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `fontMode` | `lxgw` | 字体模式，可选 `system`、`lxgw`、`custom` |
| `customFontPath` | 空字符串 | 自定义字体绝对路径，仅在 `custom` 模式使用 |
| `fontAssetParts` | `data / fonts / LXGWWenKaiMono-Regular.ttf` | 禁用的只读数组，展示相对于 `ctx.baseDir` 的共享字体路径 |
| `chartJsAssetParts` | `data / assets / gold-price-image / chart.umd.min.js` | 禁用的只读数组，展示相对于 `ctx.baseDir` 的 Chart.js 运行路径 |

字体模式严格执行，不会自动回退到其他模式：

- `system` 直接使用浏览器系统字体，不检查或下载字体文件。
- `lxgw` 使用共享的 `ctx.baseDir/data/fonts/LXGWWenKaiMono-Regular.ttf`；文件缺失时先从
[Gitee Release](https://gitee.com/vincent-zyu/koishi-plugin-awa-quote-image/releases/tag/fonts)
下载，失败后尝试
[GitHub Release](https://github.com/VincentZyuApps/koishi-plugin-awa-quote-image/releases/tag/fonts)。下载结果会校验文件大小和 SHA-256，校验通过后才会原子替换正式字体文件。
- `custom` 严格使用 `customFontPath` 指定的绝对路径，支持 TTF、OTF、WOFF 和 WOFF2。

所选字体缺失、路径无效、下载失败、校验失败或浏览器加载失败时，当前出图命令会直接报错。

### Chart.js 运行资产

插件启动与渲染前会把内置 `assets/chart.umd.min.js` 同步到 `ctx.baseDir/data/assets/gold-price-image/chart.umd.min.js`。运行副本缺失或 SHA-256 与内置版本不一致时会自动原子恢复。

如果运行目录无法创建或复制失败，插件会临时使用包内 `assets/chart.umd.min.js` 保证出图，并在日志中明确提示该 fallback 会继续占用 `external` 或 `node_modules` 中的插件文件。

托管字体和 Chart.js 运行资产均直接相对于 `ctx.baseDir` 定位，不使用 `process.cwd()`。

## 📊 图表特性

- 🎨 渐变色背景
- 📈 平滑曲线展示
- 💡 实时数据标注
- 📊 统计信息展示（当前价、最高价、最低价、平均价）
- 🖱️ 数据点悬停提示
- 📱 响应式设计

## 🔧 技术栈

- **Koishi** - 聊天机器人框架
- **Chart.js** - 图表渲染库
- **Puppeteer** - 浏览器自动化
- **Koishi 定时器** - 定时任务调度

## 📝 注意事项

- ⏰ 插件会在下一个符合抓取间隔的整数分钟开始采集
- 💾 数据会自动存储到数据库，不会丢失
- 📊 首次使用需要等待数据采集
- 🔄 定时任务会在插件卸载时自动停止
