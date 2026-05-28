# 网站优化进度文档

**最后更新**: 2026-05-28 晚间

---

## 已完成的修改

### 1. Phase 1: 设计系统变量重构 ✅
**文件**: `style.css` (`:root` 块)

新增变量组：
- **背景层**: `--bg-grid`, `--bg-grid-90`, `--bg-glow-1`, `--bg-glow-2`
- **字号层级**: `--fs-hero`, `--fs-display`, `--fs-title`, `--fs-heading`, `--fs-body`, `--fs-small`, `--fs-label`, `--fs-micro`
- **间距层级**: `--space-xs/sm/md/lg/xl/2xl`
- **动画时长**: `--dur-fast/normal/slow/enter`
- **缓动曲线族**: `--ease`, `--ease-out`, `--ease-in-out`, `--ease-spring`, `--ease-bounce`

---

### 2. Phase 2: 动效系统升级 ✅

#### 2.1 Three.js 粒子鼠标交互修复 ✅
**文件**: `three-scene.js` (第 93-108 行)

- 修复了 `state.mouseX/Y` 被监听但从未使用的问题
- 添加了鼠标驱动的粒子位移（lerp 平滑，系数 0.02）
- 粒子会跟随鼠标产生微弱的视差漂移

#### 2.2 3D Tilt 跳变修复 ✅
**文件**: `main.js` (第 189-205 行)

- `applyTilt()`: 添加 `transition: none` 防止拖拽时卡顿
- `resetTilt()`: 先动画回 resting state（0.5s），再清理 inline style
- 使用 `transitionend` 事件 + `{ once: true }` 自动清理监听器

#### 2.3 滚动入场动画多样化 ✅
**文件**: `main.js` (第 89-132 行)

替换原来的统一 `y:42 + opacity:0`，改为按元素类型配置：
- `.section-label`: 从左滑入 (`x: -30`)
- `.section-title`: 从下方缩放淡入 (`y:60, scale:0.95`)
- `.world-card`: stagger + rotateX (`rotateX: 8`)
- `.thought-tile`: stagger + 轻微旋转 (`rotation: ±2`)
- `.archive-item`: 左右交替滑入 (`x: ±40`)

#### 2.4 Hero 视差效果 ✅
**文件**: `main.js` (新增 `initHeroParallax()`)

- Hero 三层圆环随滚动向上移动并淡出（速度递增）
- Hero 标题随滚动向上移动并淡出（较慢）
- 使用 ScrollTrigger + scrub 实现平滑滚动驱动

#### 2.5 子页面入场 stagger ✅
**文件**: `transition.js` (第 153-174 行)

- sub-hero: 使用 `clipPath: inset(0 100% 0 0)` 实现 wipe 揭示效果
- sections: 从下方 stagger 入场 (`y:50, stagger:0.12`)

#### 2.6 光标区域形态变化 ✅
**文件**: `main.js` (第 47-53 行) + `style.css` (第 236-266 行)

- 新增 `initCursorRegions()` 检测当前 section
- 通过 `data-cursor-room` 属性控制光标形态
- 不同展室的光标样式：
  - Room 00 (Hero): 60px, acid 色, exclusion 混合模式
  - Room 01 (About): 44px, 暖白
  - Room 02 (World): 50px, 圆角 6px, 青色
  - Room 03 (Thoughts): 24px, 方形, 暖白
  - Room 04 (Contact): 56px, 橙红

---

### 3. Phase 3: 视觉增强 ✅

#### 3.1 Hero 渐变文字 ✅
**文件**: `style.css` (第 658-682 行)

- 将原来的 `color: rgba(242,234,219,0.18)` 替换为渐变文字
- 渐变色: 暖白 → 酸绿 → 暖白 → 橙红 → 暖白
- 使用 `background-clip: text` + `background-size: 200% 200%`
- 8s 循环位移动画，营造"流动微光"效果

#### 3.2 大屏断点优化 ✅
**文件**: `style.css` (末尾新增)

- `@media (min-width: 1200px)`:
  - world-grid gap 缩小
  - world-card min-height 增大
  - about-layout gap 增大
  - photo-gallery 改为 4 列

- `@media (min-width: 1440px)`:
  - hero-title 字号增大
  - section padding 增大
  - hero-circle 尺寸增大
  - photo-gallery 改为 5 列
  - manuscript-wall 改为 4 列

---

## 其他 Agent 的修改（需统筹）

### style.css 中的其他改动：
1. **全局过渡**: `*` 选择器添加了 `transition-property` 和 `transition-duration: 0s`
2. **Hover 过渡**: `*:hover` 设置 `transition-duration: 0.2s`
3. **字体平滑**: `html` 添加了 `-webkit-font-smoothing: antialiased`
4. **文本渲染**: `body` 添加了 `text-rendering: optimizeLegibility`
5. **新增变量**: `--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)`
6. **Hero-kicker hover**: span 添加了 hover 变色效果
7. **卡片样式**: world-card、thought-tile 等添加了渐变背景和更丰富的 hover 效果

### transition.js 中的其他改动：
1. **Sound Room**: `initializeSubPage()` 新增了 `page-music` 的 `initSoundRoom` 调用

---

### 4. Phase 4: 交互创新 ✅

#### 4.1 音频反馈 ✅
**新文件**: `sound.js` + `index.html` 引入 + `main.js` 绑定

- 使用 Web Audio API 生成极简音效（纯正弦波，无外部音频文件）
- hover 音效: 1200Hz, 50ms, 音量 0.015
- click 音效: 800Hz, 100ms, 音量 0.03
- nav 音效: 200→600Hz 扫频, 300ms, 音量 0.025
- 首次用户交互后自动解锁 AudioContext
- 绑定到所有 `a, button, .world-card, .thought-tile, .archive-item`

#### 4.2 Glitch 效果 ✅
**文件**: `style.css` (hero-title hover)

- Hero 标题 hover 时触发 0.3s 的 glitch 动画
- 使用 `clip-path: inset()` + `translate` 实现数字故障感
- `steps(2)` 缓动营造帧跳跃感
- 动画结束后自动恢复渐变流动效果

---

### 5. 磁性光标效果 ✅
**文件**: `main.js` (`moveCursor` 函数)

- 光标靠近 `a, button, .world-card, .thought-tile, .archive-item` 时被"吸附"向元素中心
- 吸附阈值: 元素尺寸 × 0.6
- 吸附强度: 距离比 × 0.35
- 使用 lerp 平滑（0.12 系数）

### 6. Variable Font 轴动画 ✅
**文件**: `style.css` + `main.js`

- Hero 标题添加 `font-variation-settings: "opsz" 96`
- 滚动时从 96 → 24 渐变（serif 细节从粗到细）
- 使用 ScrollTrigger + scrub 驱动

### 7. 删除 pages/ 目录 ✅
**原因**: `pages/` 下的独立 HTML 未被任何代码引用，SPA 使用 `index.html` 中的 `<template>`。删除以避免混淆。

### 8. 转场面板间隙修复 ✅
**文件**: `style.css` (`.pt-panel`)
- 面板宽度从 20% 改为 20.1%，left 从 0/20/40/60/80 改为 0/19.9/39.9/59.9/79.9
- 消除子像素渲染导致的黑色间隙

### 9. 网格空位补齐规则 ✅
**统一规则**: 网格中出现空位时，添加装饰性占位元素补齐。

**实现方式**:
- 联系信号台: 添加 `signal-link--empty` 占位块（"© 2026 · 深夜美术馆"）
- 光影笔记: 添加 `photo-item--filler` 占位块（"更多光影，正在路上。"）
- **CSS 类**: `.photo-item--filler` + `.signal-link--empty`（虚线边框、不可点击、弱化文字）

**应用位置**:
- `.signal-board`（2列网格，5个链接 → 第6格占位）
- `.photo-gallery`（4列网格，12张照片 → 末尾占位）

---

## 协调结果
- ✅ 全局 `transition-duration: 0s` 不会与 tilt fix 冲突（JS 直接设置 inline style 覆盖）
- ✅ `--ease-bounce` 已定义但未使用（留给后续动画使用）
- ✅ `initSoundRoom` 已由其他 agent 实现（main.js 第 311 行，含 5 首曲目 + 歌词展示）

---

## 关键文件清单

| 文件 | 行数 | 本次修改 |
|------|------|----------|
| `style.css` | ~3120 | :root 变量、光标区域、渐变文字、大屏断点、Glitch、VF 转场修复、网格占位 |
| `main.js` | ~340 | 滚动动画、Tilt 修复、Hero 视差、光标区域、音效绑定、VF 动画 |
| `three-scene.js` | ~110 | 粒子鼠标交互修复 |
| `transition.js` | ~210 | 子页面入场 stagger |
| `sound.js` | ~70 | **新文件** - Web Audio 音效反馈 |
| `index.html` | ~610 | Vibe 展柜内容、联系页占位、光影笔记占位 |

---

### 10. 匿名评论留言墙 + 数字分身自动回复 ✅
**新增功能**: Gallery 05 — 留言墙

**后端**:
- `functions/api/comments.js` — 新增 API 端点，支持 GET/POST/OPTIONS
- 使用 Cloudflare Workers KV (`COMMENTS_KV`) 存储评论
- POST 提交后自动调用 DeepSeek API 生成 Andiii 数字分身回复
- IP 频率限制：每 60 秒一条
- 输入校验：昵称 ≤30 字符，消息 ≤300 字符
- `functions/api/chat.js` — 导出 `PERSONA` 常量供 comments.js 复用
- `wrangler.toml` — 绑定 KV namespace `COMMENTS_KV` (id: `9bf7928a972a47489fc2d85c6e68941c`)

**前端**:
- `index.html` — 新增 `#guestbook` section (Gallery 05)，含表单 + 评论墙
- `style.css` — 约 250 行新样式：装饰网格背景、流动光球、便签纸卡片（胶带效果 + 倾斜 + hover 浮起）、Andiii 回复标注（橙色竖线 + 斜体）、极简底线表单、响应式
- `comments.js` — 新文件：评论加载/提交/渲染/XSS 防护/字数计数/错误提示
- `main.js` — 评论区元素加入 `infiniteAnimSelectors` 动画观察器

**设计亮点**:
- 便签纸美学：每张评论有"透明胶带"装饰、轻微随机旋转、hover 时提起
- 表单 focus 时酸橙绿底线高亮 + 渐变按钮
- 数字分身回复以橙色左边框 + 斜体 + 延迟入场动画呈现
- 空状态菱形图标呼吸动画
- 提交成功/失败 toast 通知

## 关键文件清单

| 文件 | 行数 | 本次修改 |
|------|------|----------|
| `style.css` | ~3420 | :root 变量、光标区域、渐变文字、大屏断点、Glitch、VF 转场修复、网格占位、留言墙样式 |
| `main.js` | ~500 | 滚动动画、Tilt 修复、Hero 视差、光标区域、音效绑定、VF 动画、评论区动画 |
| `three-scene.js` | ~110 | 粒子鼠标交互修复 |
| `transition.js` | ~210 | 子页面入场 stagger |
| `sound.js` | ~70 | **新文件** - Web Audio 音效反馈 |
| `comments.js` | ~150 | **新文件** - 匿名评论留言墙逻辑 |
| `index.html` | ~660 | Vibe 展柜内容、联系页占位、光影笔记占位、留言墙 section |
| `functions/api/chat.js` | ~205 | 导出 PERSONA 常量 |
| `functions/api/comments.js` | ~150 | **新文件** - 评论 API (KV + 数字分身回复) |
| `wrangler.toml` | ~12 | 添加 [[kv_namespaces]] |

---

## 测试要点

打开 `index.html` 后检查：
1. Hero 标题是否有渐变流动效果
2. 滚动时各 section 入场动画是否多样化
3. 鼠标移动时粒子是否跟随
4. 3D Tilt 卡片离开时是否平滑回弹
5. 光标形态是否随区域变化
6. 子页面转场是否有 clip-path wipe 效果
7. 大屏（1440px+）布局是否合理
8. 控制台无错误
