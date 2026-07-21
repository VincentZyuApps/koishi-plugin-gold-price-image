import { readFileSync } from 'fs';
import { resolve } from 'path';

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, '../package.json'), 'utf-8'),
);

export const usage = `
<h1>💰 Koishi 插件：招行金价走势图 💰</h1>
<h2>🎯 插件版本：v${pkg.version}</h2>

<h2 style="color: #ff4444; font-weight: 900; font-size: 24px; margin: 20px 0;">⚠️ 重要提示：需要开启 <b>puppeteer</b>、<b>http</b> 和 <b>database</b> 插件，本插件才能正常使用！</h2>

<h3>📊 功能介绍</h3>
<ul>
  <li>🔄 定时抓取招行金价数据</li>
  <li>📈 使用 Chart.js 渲染精美的金价走势图</li>
  <li>💾 数据库存储历史数据</li>
  <li>🎨 支持自定义时间范围查询</li>
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
