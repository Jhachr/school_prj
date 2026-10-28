# 科研教练 Skill 客户交付页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** 构建一个可离线打开、面向非技术客户、以五阶段教师旅程为主线并包含四幅一致风格插图的单页交付手册。

**Architecture:** 使用语义化 HTML、独立 CSS 和原生 JavaScript，不依赖构建工具、CDN 或在线字体。零依赖检查脚本验证章节、离线资源、真实数字、图片替代文本和交互挂钩；插图提纲与提示词随交付目录保存，保证可追溯和可重新生成。

**Tech Stack:** HTML5、CSS3、原生 JavaScript、Node.js 内置文件系统、Codex imagegen、baoyu-article-illustrator

---

## 文件结构

- Create: deliverables/research-proposal-coach-client-guide/index.html — 完整客户正文。
- Create: deliverables/research-proposal-coach-client-guide/styles.css — 视觉、响应式和打印规则。
- Create: deliverables/research-proposal-coach-client-guide/script.js — 导航、阶段切换和轻动画。
- Create: deliverables/research-proposal-coach-client-guide/README.md — 打开与维护说明。
- Create: deliverables/research-proposal-coach-client-guide/scripts/check-page.mjs — 静态交付检查。
- Create: deliverables/research-proposal-coach-client-guide/imgs/outline.md — 插图提纲。
- Create: deliverables/research-proposal-coach-client-guide/imgs/prompts/*.md — 四个提示词。
- Generate: deliverables/research-proposal-coach-client-guide/imgs/*.png — 四幅插图。

### Task 1: 建立可失败的交付检查

**Files:**
- Create: deliverables/research-proposal-coach-client-guide/scripts/check-page.mjs

- [ ] **Step 1: 写入检查脚本**

~~~js
import { access, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sectionIds = ['overview', 'why', 'journey', 'capabilities', 'quickstart', 'example', 'trust', 'evidence', 'delivery', 'faq'];
const metrics = ['2 轮', '5 阶段', '9 个辅导模块', '9 组核心规则', '13 个模板', '24 个真实交互评测场景', '79 项自动化测试'];
const images = ['01-scene-research-journey.png', '02-flowchart-five-stage-path.png', '03-framework-human-ai-teamwork.png', '04-framework-quality-guardrails.png'];
const html = await readFile(join(root, 'index.html'), 'utf8');
const css = await readFile(join(root, 'styles.css'), 'utf8');
const js = await readFile(join(root, 'script.js'), 'utf8');
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

for (const id of sectionIds) expect(html.includes('id="' + id + '"'), '缺少章节 #' + id);
for (const metric of metrics) expect(html.includes(metric), '缺少真实投入数据：' + metric);
for (const image of images) {
  expect(html.includes('imgs/' + image), '页面未引用图片：' + image);
  await access(join(root, 'imgs', image)).catch(() => failures.push('图片不存在：' + image));
}
expect(!/(?:src|href)=["']https?:\/\//i.test(html), 'HTML 包含外部网络资源');
expect((html.match(/<img\b[^>]*\balt=["'][^"']+["']/g) || []).length >= 4, '四幅图片都必须有非空 alt');
expect(html.includes('aria-current="page"'), '导航缺少 aria-current 初始状态');
expect((html.match(/<details\b/g) || []).length >= 5, 'FAQ 至少需要 5 个 details');
expect(css.includes('prefers-reduced-motion'), 'CSS 缺少减弱动画规则');
expect(css.includes('@media print'), 'CSS 缺少打印规则');
expect(js.includes('IntersectionObserver'), '脚本缺少滚动观察器');
expect(js.includes('data-stage-tab'), '脚本缺少阶段切换挂钩');

if (failures.length) {
  console.error(failures.map((item) => 'FAIL: ' + item).join('\n'));
  process.exit(1);
}
console.log('PASS: 客户交付页结构、资源与离线约束检查通过');
~~~

- [ ] **Step 2: 运行并确认失败**

Run:

~~~bash
node deliverables/research-proposal-coach-client-guide/scripts/check-page.mjs
~~~

Expected: 非零退出，错误包含 ENOENT 和 index.html。

- [ ] **Step 3: 提交检查脚本**

~~~bash
git add deliverables/research-proposal-coach-client-guide/scripts/check-page.mjs
git commit -m "test: add client guide delivery checks"
~~~

### Task 2: 写入客户视角的语义化正文

**Files:**
- Create: deliverables/research-proposal-coach-client-guide/index.html
- Create: deliverables/research-proposal-coach-client-guide/styles.css
- Create: deliverables/research-proposal-coach-client-guide/script.js

- [ ] **Step 1: 创建最小 CSS 和 JS**

styles.css:

~~~css
:root { color-scheme: light; }
~~~

script.js:

~~~js
document.documentElement.classList.add('has-js');
~~~

- [ ] **Step 2: 创建完整 HTML**

固定文档头、离线资源和导航：

~~~html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="专科院校教师科研教练 Skill 客户交付与使用指南">
  <title>科研教练 Skill｜客户交付指南</title>
  <link rel="stylesheet" href="styles.css">
  <script src="script.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">跳到主要内容</a>
  <header class="site-header">
    <a class="brand" href="#overview">科研教练 Skill</a>
    <nav aria-label="页面导航">
      <a href="#overview" aria-current="page">交付概览</a>
      <a href="#journey">使用旅程</a>
      <a href="#capabilities">当前能力</a>
      <a href="#quickstart">如何使用</a>
      <a href="#evidence">研发与验证</a>
      <a href="#delivery">交付清单</a>
    </nav>
  </header>
  <main id="main"></main>
  <footer><p>科研教练 Skill · 客户交付指南</p></footer>
</body>
</html>
~~~

在 main 中按此顺序写完整章节：

1. overview：标题“从一个真实问题出发，走到一份站得住的研究方案”，使用设计稿核心价值陈述、两个行动入口和封面图。
2. why：三张问题卡“无从开始 / 直接生成不等于研究成立 / 材料彼此断开”，说明两轮客户沟通推动“代写提效”转为“引导教练”。
3. journey：五个 data-stage-tab 按钮和五个 data-stage-panel 面板。每个面板写“教师现在做什么 / Skill 如何帮助 / 本阶段得到什么 / 何时进入下一步”；第四阶段注明按需启用。
4. capabilities：设计稿 4.4 中九张用户任务卡，逐项完整出现。
5. quickstart：教师模式或临时使用、自然语言说明困惑、每轮完成一个关键动作；放人机协作图。
6. example：将“我想研究学生积极性”演示为真实场景、研究问题、干预、指标和成果；明确是演示数据。
7. trust：六条质量边界逐项完整出现；放四层护栏图。
8. evidence：逐项写“2 轮 / 5 阶段 / 9 个辅导模块 / 9 组核心规则 / 13 个模板 / 24 个真实交互评测场景 / 79 项自动化测试”及客户意义。
9. delivery：Skill、模块、模板、工具、测试、评测、Trae CN / Codex / 自定义目录安装，以及 2—3 位教师第一周试用建议。
10. faq：至少六组 details/summary，回答是否代替思考、能否直接提交、目标支持、聊天保存、学校规则维护、反馈迭代。

四图路径固定为：

~~~html
<img src="imgs/01-scene-research-journey.png" alt="教师在科研教练陪伴下，从模糊问题走向结构化研究成果的旅程插图">
<img src="imgs/02-flowchart-five-stage-path.png" alt="科研教练五阶段使用旅程：真实问题、研究问题、证据设计、工具验证和目标成果">
<img src="imgs/03-framework-human-ai-teamwork.png" alt="教师、科研教练 Skill 与专家之间的协作分工">
<img src="imgs/04-framework-quality-guardrails.png" alt="来源、质量、隐私和对话健康四层研究护栏">
~~~

- [ ] **Step 3: 运行检查**

~~~bash
node deliverables/research-proposal-coach-client-guide/scripts/check-page.mjs
~~~

Expected: 失败项只涉及四幅图片、prefers-reduced-motion、@media print、IntersectionObserver 和 data-stage-tab。

- [ ] **Step 4: 提交正文**

~~~bash
git add deliverables/research-proposal-coach-client-guide/index.html deliverables/research-proposal-coach-client-guide/styles.css deliverables/research-proposal-coach-client-guide/script.js
git commit -m "feat: add client journey guide content"
~~~

### Task 3: 实现视觉系统与响应式布局

**Files:**
- Modify: deliverables/research-proposal-coach-client-guide/styles.css

- [ ] **Step 1: 写入设计令牌与基础样式**

~~~css
:root {
  color-scheme: light;
  --ink: #18332d;
  --ink-soft: #425b54;
  --paper: #f7f1e5;
  --paper-deep: #eee3d0;
  --surface: #fffdf8;
  --sage: #9fbea8;
  --coral: #df806f;
  --sun: #edc76d;
  --line: rgba(24, 51, 45, .18);
  --shadow: 0 18px 60px rgba(40, 49, 39, .10);
  --radius: 1.4rem;
  --content: 72rem;
}
~~~

实现 box-sizing、系统中文字体栈、1.65 行高、可见 focus-visible、跳转链接、图片自适应、最大内容宽度和按钮状态。

- [ ] **Step 2: 实现编辑式组件**

为 site-header、hero、problem-grid、journey-shell、stage-tabs、stage-panel、capability-grid、steps、example-flow、guardrail-grid、metrics-grid、delivery-grid 和 details 编写独立样式。卡片使用轻微错位边框或短手绘下划线，不使用玻璃拟态、霓虹或后台仪表盘风格。

- [ ] **Step 3: 添加响应式、减弱动画和打印规则**

~~~css
@media (max-width: 760px) {
  .site-header nav { overflow-x: auto; scrollbar-width: none; }
  .hero, .journey-shell, .delivery-grid { grid-template-columns: 1fr; }
  .metrics-grid, .capability-grid { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
@media print {
  .site-header, .skip-link, .hero-actions { display: none !important; }
  body { background: #fff; color: #000; }
  section, article, details { break-inside: avoid; box-shadow: none !important; }
  details > * { display: block !important; }
}
~~~

- [ ] **Step 4: 运行检查并提交**

~~~bash
node deliverables/research-proposal-coach-client-guide/scripts/check-page.mjs
git add deliverables/research-proposal-coach-client-guide/styles.css
git commit -m "style: add warm editorial client guide theme"
~~~

Expected: CSS 相关失败消失。

### Task 4: 实现渐进增强交互

**Files:**
- Modify: deliverables/research-proposal-coach-client-guide/script.js
- Modify: deliverables/research-proposal-coach-client-guide/index.html

- [ ] **Step 1: 写入完整交互**

~~~js
document.documentElement.classList.add('has-js');
const stageTabs = [...document.querySelectorAll('[data-stage-tab]')];
const stagePanels = [...document.querySelectorAll('[data-stage-panel]')];

function activateStage(tab) {
  const panelId = tab.getAttribute('aria-controls');
  stageTabs.forEach((item) => item.setAttribute('aria-selected', String(item === tab)));
  stagePanels.forEach((panel) => { panel.hidden = panel.id !== panelId; });
}
stageTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateStage(tab));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const next = stageTabs[(index + direction + stageTabs.length) % stageTabs.length];
    next.focus();
    activateStage(next);
  });
});
if (stageTabs[0]) activateStage(stageTabs[0]);

const navLinks = [...document.querySelectorAll('.site-header nav a')];
const sections = navLinks.map((link) => document.querySelector(link.hash)).filter(Boolean);
const sectionObserver = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  navLinks.forEach((link) => {
    if (link.hash === '#' + visible.target.id) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}, { rootMargin: '-20% 0px -65%', threshold: [0, .25, .6] });
sections.forEach((section) => sectionObserver.observe(section));

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const metricObserver = new IntersectionObserver((entries, observer) => {
  entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
    if (!reduceMotion) entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  });
}, { threshold: .6 });
document.querySelectorAll('[data-count]').forEach((metric) => metricObserver.observe(metric));
~~~

数字正文保持真实值，动画只改变装饰属性，避免屏幕阅读器读到持续变化的内容。

- [ ] **Step 2: 运行检查并提交**

~~~bash
node deliverables/research-proposal-coach-client-guide/scripts/check-page.mjs
git add deliverables/research-proposal-coach-client-guide/script.js deliverables/research-proposal-coach-client-guide/index.html
git commit -m "feat: add accessible client guide interactions"
~~~

Expected: JavaScript 相关失败消失，只剩图片不存在。

### Task 5: 生成可追溯的四幅插图

**Files:**
- Create: deliverables/research-proposal-coach-client-guide/imgs/outline.md
- Create: deliverables/research-proposal-coach-client-guide/imgs/prompts/01-scene-research-journey.md
- Create: deliverables/research-proposal-coach-client-guide/imgs/prompts/02-flowchart-five-stage-path.md
- Create: deliverables/research-proposal-coach-client-guide/imgs/prompts/03-framework-human-ai-teamwork.md
- Create: deliverables/research-proposal-coach-client-guide/imgs/prompts/04-framework-quality-guardrails.md
- Generate: deliverables/research-proposal-coach-client-guide/imgs/*.png

- [ ] **Step 1: 写入插图提纲**

~~~yaml
---
type: mixed
density: balanced
style: sketch-notes
palette: macaron
language: zh
image_count: 4
---
~~~

每图记录 Position、Purpose、Visual Content 和 Filename。

- [ ] **Step 2: 在生成图片前写完四个提示词**

每个文件使用 YAML frontmatter 指定 type、style、palette、aspect_ratio、output，正文包含 PURPOSE / COMPOSITION / ZONES / LABELS / COLORS / STYLE / AVOID。

1. 封面 16:10：左侧模糊便签与课堂，中央教师和克制的教练引导，右侧结构化成果；短标签“真实问题 / 研究设计 / 可实施成果”。
2. 五阶段 16:9：一条可回退路径，五个阶段短标签完整，第四阶段标“按需”；不画成不可回头的流水线。
3. 协作 4:3：三方“教师 / 科研教练 Skill / 专家复核”，职责“真实情境与决定 / 结构、证据与方法提醒 / 最终判断”。
4. 护栏 4:3：中心“可信研究成果”，四周“来源 / 质量 / 隐私 / 对话健康”。

统一要求暖米纸、深墨绿线稿、珊瑚/浅黄/鼠尾草绿块面、自然手绘质感、中文短标签清晰；避免机器人、代码窗口、科技蓝光、校徽和虚构统计。

- [ ] **Step 3: 验证提示词数量**

~~~bash
test "$(find deliverables/research-proposal-coach-client-guide/imgs/prompts -name '*.md' | wc -l | tr -d ' ')" = 4
~~~

Expected: 退出码 0。

- [ ] **Step 4: 使用 Codex imagegen 批量生成四图**

分别传入四个已保存提示词文件的完整内容和输出文件名。一次最多并行 4 张；失败项目只重试一次，不重新生成成功项目。

- [ ] **Step 5: 逐图目视检查**

检查风格、内容、中文短标签、数字和品牌。文字不合格时写新提示词和新输出名重新生成，不用脚本覆盖文字。

- [ ] **Step 6: 运行检查并提交**

~~~bash
node deliverables/research-proposal-coach-client-guide/scripts/check-page.mjs
git add deliverables/research-proposal-coach-client-guide/imgs
git commit -m "feat: add client guide illustrations"
~~~

Expected: PASS: 客户交付页结构、资源与离线约束检查通过。

### Task 6: 完成交付说明与浏览器验收

**Files:**
- Create: deliverables/research-proposal-coach-client-guide/README.md
- Modify if needed: index.html、styles.css、script.js

- [ ] **Step 1: 写入 README**

~~~markdown
# 科研教练 Skill 客户交付指南

## 打开方式
双击 index.html；页面不依赖网络。也可以在本目录运行 python3 -m http.server 8000 后访问 http://localhost:8000。

## 推荐演示顺序
开场价值 → 五阶段旅程 → 三步上手 → 使用示例 → 质量护栏 → 研发与验证 → 交付清单。

## 整体复制
复制整个 research-proposal-coach-client-guide 目录，不要只复制 index.html。

## 内容维护
正文、样式、交互分别在 index.html、styles.css、script.js；插图提纲和提示词位于 imgs/。

## 自检
运行 node scripts/check-page.mjs。
~~~

- [ ] **Step 2: 检查桌面视图**

~~~bash
python3 -m http.server 8000 --directory deliverables/research-proposal-coach-client-guide
~~~

Expected: 浏览器 1440×900 下导航、首屏、五阶段、FAQ 和图片正常。

- [ ] **Step 3: 检查移动视图和键盘**

在 390×844 下无横向滚动；仅使用 Tab、Shift+Tab、Enter、Space 和左右键完成导航、阶段切换与 FAQ 展开；焦点清晰。

- [ ] **Step 4: 检查离线和关闭 JavaScript**

以 file:// 打开 index.html，样式和图片可见；关闭 JavaScript 后五阶段正文、锚点和 FAQ 仍可用。

- [ ] **Step 5: 提交说明和修正**

~~~bash
git add deliverables/research-proposal-coach-client-guide
git commit -m "docs: add client guide handoff instructions"
~~~

### Task 7: 最终回归

- [ ] **Step 1: 运行交付页检查**

~~~bash
node deliverables/research-proposal-coach-client-guide/scripts/check-page.mjs
~~~

Expected: PASS: 客户交付页结构、资源与离线约束检查通过。

- [ ] **Step 2: 运行 Skill 全量测试**

~~~bash
node --test skills/research-proposal-coach/tests/*.test.mjs
~~~

Expected: 79 项通过，0 失败。

- [ ] **Step 3: 校验 Skill 结构和补丁格式**

~~~bash
python3 /Users/jhachr/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/research-proposal-coach
git diff --check
~~~

Expected: Skill 校验成功；git diff --check 无输出且退出码 0。

- [ ] **Step 4: 确认工作树和提交历史**

~~~bash
git status --short
git log --oneline -8
~~~

Expected: 工作树干净；最近提交按检查、正文、样式、交互、插图、说明顺序可追溯。

