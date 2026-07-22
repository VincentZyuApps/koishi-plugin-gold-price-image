import { readFileSync } from 'fs';
import { resolve } from 'path';

const KOISHI_LOGO_BASE64 = 'data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAABU0lEQVR42p2UQSsFYRSGnxnqLuytKWKpKFkQNsS%2FsOHPWPADLCmxU5S7UzYWNrJR7lYiRF2FeWzOMKZ7mXHqNNP5vvP2nu%2B850CY2lP4X1K31ZbaDm%2BpO%2Bpyp5wfAXVEPfRvO1JHf4AVQGbUh7j4EZ4VkrNCXPVRnf3CUBN1SH2KC28VGOV3ntRhNclZHdcAKYM11QR1oVBOXctzFlNgBTC8qmXxPQEegbVeYApIgJT6tg%2F0AdMp0B%2FBpCabK2AAmAAa%2F2GRBft1oBFPkqTAba7LCiAfQC9wClwAY1HJHepuiO29Yrsf1Dn1uiDU3RTYCtTkl1Leg8k9MB4NGgReI28rV3azgyCz0og01Xl1Uz1QX8uCTELm3UbkTF1VJ9Wr0tn3iBSGdjYG0XivE3VN3VD31PM4a3cc2tIGGI0VkTO7rLxGuiy25ejmjfqsvkSXui62TxaK03td4FXTAAAAAElFTkSuQmCC';

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, '../package.json'), 'utf-8'),
);

const COLLAPSIBLE_STYLE = 'margin: 12px 0; overflow: hidden; border: 2px solid #f57c00; border-radius: 13px; background: linear-gradient(135deg, #fff9e6 0%, #ffe8cc 100%); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);';
const SUMMARY_STYLE = 'cursor: pointer; padding: 12px 16px; color: #d32f2f; font-weight: 700;';
const COLLAPSIBLE_BODY_STYLE = 'padding: 4px 16px 14px; border-top: 2px solid #f57c00; background: rgba(255, 255, 255, 0.98); color: #2d3748;';

export const usage = `
<h1>💰 Koishi 插件：招行金价走势图 💰</h1>
<h2>🎯 插件版本：v${pkg.version}</h2>

<p>
  <a href="https://www.npmjs.com/package/koishi-plugin-gold-price-image" target="_blank">
    <img src="https://img.shields.io/npm/v/koishi-plugin-gold-price-image?style=flat-square&logo=npm" alt="npm version">
  </a>
  <a href="https://www.npmjs.com/package/koishi-plugin-gold-price-image" target="_blank">
    <img src="https://img.shields.io/npm/dm/koishi-plugin-gold-price-image?style=flat-square&logo=npm" alt="npm downloads">
  </a>
  <br>
  <a href="https://github.com/VincentZyuApps/koishi-plugin-gold-price-image" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
  </a>
  <a href="https://gitee.com/vincent-zyu/koishi-plugin-gold-price-image" target="_blank">
    <img src="https://img.shields.io/badge/Gitee-C71D23?style=for-the-badge&logo=gitee&logoColor=white" alt="Gitee">
  </a>
  <br>
  <a href="https://forum.koishi.xyz/t/topic/xxxxx" target="_blank">
    <img src="https://img.shields.io/badge/Koishi%20Forum-xxxxx-5546A3?style=for-the-badge&logo=${KOISHI_LOGO_BASE64}&logoColor=white" alt="Koishi Forum">
  </a>
  <a href="https://qm.qq.com/q/ZN7fxZ3qCq" target="_blank">
    <img src="https://img.shields.io/badge/QQ群-1085190201-12B7F5?style=flat-square&logo=qq&logoColor=white" alt="QQ群">
  </a>
</p>

<h2 style="color: #ff4444; font-weight: 900; font-size: 24px; margin: 20px 0;">⚠️ 重要提示：需要开启 <b>puppeteer</b>、<b>http</b> 和 <b>database</b> 插件，本插件才能正常使用！</h2>
<p><b>⏰ cron 是可选服务：</b>默认 <code>simple</code> 采集模式不需要 cron；选择 <code>cron</code> 模式时必须安装并启用 <code>koishi-plugin-cron</code>，缺失时不会回退简单模式。</p>

<h3>🚀 快速使用</h3>
<ul>
  <li><code>gold</code> 或 <code>当前金价</code> - 获取当前招行金价</li>
  <li><code>gold-image</code> 或 <code>金价走势</code> - 查看最近 24 小时金价走势图</li>
</ul>

<details style="${COLLAPSIBLE_STYLE}">
  <summary style="${SUMMARY_STYLE}">📊 功能与定时采集</summary>
  <div style="${COLLAPSIBLE_BODY_STYLE}">
    <ul>
      <li>🔄 定时抓取招行金价数据</li>
      <li>📈 使用 Chart.js 渲染金价走势图</li>
      <li>💾 数据库存储历史数据</li>
      <li>🎨 支持自定义时间范围查询</li>
      <li><code>simple</code>（默认）：按 <code>fetchIntervalMinutes</code> 设置的分钟间隔采集，支持 1 至 1440 分钟。</li>
      <li><code>cron</code>：按五段式 <code>fetchCronExpression</code> 采集，默认 <code>*/5 * * * *</code>。</li>
      <li>上一轮采集未完成时会跳过新任务，避免并发请求和重复写入。</li>
    </ul>
  </div>
</details>

<details style="${COLLAPSIBLE_STYLE}">
  <summary style="${SUMMARY_STYLE}">📝 完整命令与时间参数</summary>
  <div style="${COLLAPSIBLE_BODY_STYLE}">
    <ul>
      <li><code>gold-image 30 m</code> - 查看最近 30 分钟</li>
      <li><code>gold-image 45 minutes</code> - 查看最近 45 分钟</li>
      <li><code>gold-image 90 分钟</code> - 查看最近 90 分钟</li>
      <li><code>gold-image 6 h</code> - 查看最近 6 小时</li>
      <li><code>gold-image 12 hours</code> - 查看最近 12 小时</li>
      <li><code>gold-image 3 小时</code> - 查看最近 3 小时</li>
      <li><code>gold-image 1 day</code> - 查看最近 1 天</li>
      <li><code>gold-image 7 d</code> - 查看最近 7 天</li>
      <li><code>gold-image 30 天</code> - 查看最近 30 天</li>
    </ul>
    <p><b>参数：</b>数量默认为 <code>24</code>，单位默认为 <code>h</code>。</p>
    <ul>
      <li>分钟：<code>m</code>, <code>minute</code>, <code>minutes</code>, <code>分</code>, <code>分钟</code></li>
      <li>小时：<code>h</code>, <code>hour</code>, <code>hours</code>, <code>时</code>, <code>小时</code></li>
      <li>天：<code>d</code>, <code>day</code>, <code>days</code>, <code>天</code>, <code>日</code></li>
    </ul>
  </div>
</details>

<details style="${COLLAPSIBLE_STYLE}">
  <summary style="${SUMMARY_STYLE}">🔤 字体模式</summary>
  <div style="${COLLAPSIBLE_BODY_STYLE}">
    <ul>
      <li><code>system</code>：使用浏览器系统默认字体，不检查或下载字体文件。</li>
      <li><code>lxgw</code>（默认）：从 Gitee / GitHub 下载并校验 <code>ctx.baseDir/data/fonts/LXGWWenKaiMono-Regular.ttf</code>。</li>
      <li><code>custom</code>：严格使用 <code>customFontPath</code> 中填写的绝对路径。</li>
      <li>所选字体缺失、下载失败、校验失败或浏览器加载失败时直接报错，不自动回退。</li>
    </ul>
  </div>
</details>

<details style="${COLLAPSIBLE_STYLE}">
  <summary style="${SUMMARY_STYLE}">📦 Chart.js 运行资产</summary>
  <div style="${COLLAPSIBLE_BODY_STYLE}">
    <ul>
      <li>内置 Chart.js 会复制到 <code>ctx.baseDir/data/assets/gold-price-image/chart.umd.min.js</code>，并按 SHA-256 自动恢复缺失或修改的副本。</li>
      <li>复制失败时使用插件包内 <code>assets/chart.umd.min.js</code>，日志会明确提示该 fallback 会占用 external 或 node_modules 中的插件文件。</li>
    </ul>
  </div>
</details>

<details style="${COLLAPSIBLE_STYLE}">
  <summary style="${SUMMARY_STYLE}">💬 交流反馈</summary>
  <div style="${COLLAPSIBLE_BODY_STYLE}">
    <p>🐛 Bug 反馈 / 💡 建议 / 👨‍💻 插件开发交流，欢迎加入 QQ 群：<b>1085190201</b> 🎉</p>
    <p><del>旧 QQ 群：<b>259248174</b>（已停用）</del></p>
    <p>💡 在群里直接艾特我，回复会更快哦~ ✨</p>
  </div>
</details>
`;
