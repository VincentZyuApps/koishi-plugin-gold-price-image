import { readFileSync } from 'fs';
import { resolve } from 'path';

const KOISHI_LOGO_BASE64 = 'data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAABU0lEQVR42p2UQSsFYRSGnxnqLuytKWKpKFkQNsS%2FsOHPWPADLCmxU5S7UzYWNrJR7lYiRF2FeWzOMKZ7mXHqNNP5vvP2nu%2B850CY2lP4X1K31ZbaDm%2BpO%2Bpyp5wfAXVEPfRvO1JHf4AVQGbUh7j4EZ4VkrNCXPVRnf3CUBN1SH2KC28VGOV3ntRhNclZHdcAKYM11QR1oVBOXctzFlNgBTC8qmXxPQEegbVeYApIgJT6tg%2F0AdMp0B%2FBpCabK2AAmAAa%2F2GRBft1oBFPkqTAba7LCiAfQC9wClwAY1HJHepuiO29Yrsf1Dn1uiDU3RTYCtTkl1Leg8k9MB4NGgReI28rV3azgyCz0og01Xl1Uz1QX8uCTELm3UbkTF1VJ9Wr0tn3iBSGdjYG0XivE3VN3VD31PM4a3cc2tIGGI0VkTO7rLxGuiy25ejmjfqsvkSXui62TxaK03td4FXTAAAAAElFTkSuQmCC';

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, '../package.json'), 'utf-8'),
);

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

<h2>💬 交流反馈</h2>
<p>🐛 Bug 反馈 / 💡 建议 / 👨‍💻 插件开发交流，欢迎加群：</p>
<p><del>💬 插件使用问题 / 🐛 Bug反馈 / 👨‍💻 插件开发交流，欢迎加入QQ群：<b>259248174</b> 🎉（这个群G了）</del></p>
<p>💬 插件使用问题 / 🐛 Bug反馈 / 👨‍💻 插件开发交流，欢迎加入QQ群：<b>1085190201</b> 🎉</p>
<p>💡 在群里直接艾特我，回复的更快哦~ ✨</p>

<h2 style="color: #ff4444; font-weight: 900; font-size: 24px; margin: 20px 0;">⚠️ 重要提示：需要开启 <b>puppeteer</b>、<b>http</b> 和 <b>database</b> 插件，本插件才能正常使用！</h2>
<p><b>⏰ cron 是可选服务：</b>默认 <code>simple</code> 采集模式不需要 cron；选择 <code>cron</code> 模式时必须安装并启用 <code>koishi-plugin-cron</code>，缺失时不会回退简单模式。</p>

<h3>📊 功能介绍</h3>
<ul>
  <li>🔄 定时抓取招行金价数据</li>
  <li>📈 使用 Chart.js 渲染精美的金价走势图</li>
  <li>💾 数据库存储历史数据</li>
  <li>🎨 支持自定义时间范围查询</li>
</ul>

<h3>⏰ 定时采集模式</h3>
<ul>
  <li><code>simple</code>（默认）：按 <code>fetchIntervalMinutes</code> 设置的分钟间隔采集，支持 1 至 1440 分钟。</li>
  <li><code>cron</code>：按五段式 <code>fetchCronExpression</code> 采集，默认 <code>*/5 * * * *</code>。</li>
  <li>上一轮采集尚未完成时会跳过新任务，避免并发请求和重复写入。</li>
</ul>

<h3>📝 使用方法</h3>
<h4>💰 实时金价查询</h4>
<ul>
  <li><code>金价</code> - 获取当前招行金价（实时数据）</li>
</ul>

<h4>📈 历史走势图</h4>
<ul>
  <li><code>金价走势</code> - 查看最近24小时金价走势图（默认）</li>
  <li><code>金价走势 6 h</code> - 查看最近6小时</li>
  <li><code>金价走势 30 分钟</code> - 查看最近30分钟</li>
  <li><code>金价走势 7 d</code> - 查看最近7天</li>
  <li><code>金价走势 30 天</code> - 查看最近30天</li>
</ul>
<h5>参数说明：</h5>
<ul>
  <li><code>数量</code>：时间数量（数字），默认 24</li>
  <li><code>单位</code>：时间单位，默认 h（小时）</li>
</ul>
<h5>支持的时间单位：</h5>
<ul>
  <li>分钟：<code>m</code>, <code>minute</code>, <code>分</code>, <code>分钟</code></li>
  <li>小时：<code>h</code>, <code>hour</code>, <code>时</code>, <code>小时</code></li>
  <li>天：<code>d</code>, <code>day</code>, <code>天</code>, <code>日</code></li>
</ul>

<h3>🔤 字体说明</h3>
<ul>
  <li><code>system</code>：使用浏览器系统默认字体，不检查或下载字体文件。</li>
  <li><code>lxgw</code>（默认）：从 Gitee / GitHub 下载并校验共享字体 <code>ctx.baseDir/data/fonts/LXGWWenKaiMono-Regular.ttf</code>。</li>
  <li><code>custom</code>：严格使用 <code>customFontPath</code> 中填写的绝对路径。</li>
  <li>字体模式严格执行，所选字体缺失、下载失败、校验失败或浏览器加载失败时直接报错，不自动回退。</li>
</ul>

<h3>📦 Chart.js 运行资产</h3>
<ul>
  <li>内置 Chart.js 会复制到 <code>ctx.baseDir/data/assets/gold-price-image/chart.umd.min.js</code>，并按 SHA-256 自动恢复缺失或修改的副本。</li>
  <li>复制失败时使用插件包内 <code>assets/chart.umd.min.js</code>，日志会明确提示该 fallback 正在占用 external 或 node_modules 中的插件文件。</li>
</ul>
`;
