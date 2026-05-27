# Andiii Digital Museum — 项目设计文档

> "Not a Portfolio, A Presence."

---

## 1. 项目概述

**Andiii Digital Museum** 是一个"数字美术馆"风格的个人网站，站长是东南大学软件工程学生 Andiii。

### 核心定位

- 纯 **vanilla HTML / CSS / JS**，无构建工具、无框架依赖
- **单页应用 (SPA)**：使用 hash 导航 + `<template>` 模板切换实现子页面
- 美术馆隐喻贯穿全站——每个 section 是一间"展厅"，导航是"走进展室"，聊天是"档案打印机"，碎片是"钉在墙上的手稿"
- 整体氛围定位：**深夜私人美术馆**

### 设计哲学

参考 BL/S (Black Lead Studio) 的 "Not a Portfolio, A Presence" 理念：

- 去除传统 UI chrome，将整个视口作为画布
- 滚动不是"浏览"而是"穿越空间"
- 动效是叙事，不是装饰
- 少即是多：更少的控制，更多的信任

---

## 2. 技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 3D 渲染 | Three.js | r128 | 500 粒子场背景 |
| 动画引擎 | GSAP + ScrollTrigger | 3.12.5 | 滚动驱动动画、页面转场 |
| 平滑滚动 | Lenis | 1.1.18 | 全局平滑滚动引擎 |
| 字体 | Google Fonts | — | Bodoni Moda / IBM Plex Mono / Noto Serif SC / Outfit |
| 部署 | Vercel | — | 静态托管 + Serverless Functions |
| AI 聊天 | Vercel Serverless API | — | DeepSeek AI 驱动的 Persona Echo |
| 音效 | Web Audio API | — | 合成音效，零音频文件依赖 |

---

## 3. 设计系统

### 3.1 色彩

```css
:root {
  --bg:    #050506;  /* 近黑背景 */
  --text:  #f2eadb;  /* 暖白文字 */
  --acid:  #d7ff49;  /* 酸绿 — 主强调色 */
  --ember: #ff5b35;  /* 橙红 — 辅助色 */
  --cyan:  #67d8ff;  /* 青色 — 辅助色 */
  --paper: #f4ebd3;  /* 纸张色，用于收据 UI */
  --ink:   #15110b;  /* 墨色 */
}
```

**设计意图**：极暗底色 + 暖白文字营造深夜画廊的沉浸感；酸绿 (`--acid`) 作为全场唯一高饱和强调色，用于交互焦点、链接和粒子；橙红和青色作为辅助点缀。

### 3.2 字体

| 字体 | 角色 | 适用场景 |
|------|------|----------|
| **Bodoni Moda** | 展示 / 标题字体 | Hero 标题、章节标题、大字号展示 |
| **IBM Plex Mono** | 等宽标签字体 | 导航标签、UI 元素、代码片段、数据标注 |
| **Noto Serif SC** | 中文衬线正文 | 中文段落、策展笔记、碎片手稿 |
| **Outfit** | 无衬线正文 | 英文正文、辅助说明、UI 文本 |

### 3.3 动效系统

**缓动曲线**

```css
--ease: cubic-bezier(0.16, 1, 0.3, 1);  /* 自定义弹性缓动 */
```

**动画层级**

| 层级 | 驱动 | 说明 |
|------|------|------|
| 滚动动画 | GSAP ScrollTrigger | 元素入场、视差、进度驱动 |
| 平滑滚动 | Lenis | 全局滚动阻尼 |
| 自定义光标 | requestAnimationFrame | dot + ring follower，lerp 追踪 |
| 页面转场 | GSAP Timeline | 5 条竖条 wipe 效果 |
| 卡片交互 | CSS + JS | 3D tilt 鼠标跟随效果 |

**自定义光标细节**

- 内圈 dot：即时跟随鼠标位置
- 外圈 ring：lerp 插值延迟跟随
- hover 状态：ring 放大、dot 缩小或变形
- 移动端隐藏，回退为系统光标

**页面转场**

- 5 条竖条从左到右依次覆盖视口（wipe in）
- 覆盖完成后切换 template 内容
- 竖条从右到左依次撤出（wipe out）
- 全程 GSAP Timeline 编排

### 3.4 背景效果

| 效果 | 实现 | 视觉作用 |
|------|------|----------|
| 网格线 | CSS repeating-linear-gradient (64px) | 美术馆空间感 |
| 径向光晕 | CSS radial-gradient | 酸绿 + 橙红氛围光 |
| 胶片颗粒 | SVG feTurbulence filter | 复古质感 |
| 粒子场 | Three.js (500 粒子) | 深空漂浮感 |

---

## 4. 页面结构

### 4.1 主页 Sections (Room 00–04)

主页由 5 个纵向排列的 section 组成，每个 section 是一个"展厅"：

| Section | Room 编号 | 名称 | 内容 |
|---------|-----------|------|------|
| Hero | Room 00 | 入口大厅 | 大标题 "Andiii"、副标题、向下滚动提示 |
| About | Room 01 | 策展人笔记 | 简介文字 + 身份档案入口按钮 |
| World | Room 02 | 展室大厅 | 三间展室入口卡片：摄影 / 代码 / 音乐 |
| Thoughts | Room 03 | 碎片墙 | 哲学片段、短句、灵感钉在墙上 |
| Contact | Room 04 | 信号台 | 联系方式 + Persona Echo 数字分身聊天入口 |

### 4.2 子页面 (Template-Swapped)

子页面通过 `<template>` 元素预定义，切换时替换 main 容器内容：

| 页面 | 模板 ID | 内容描述 |
|------|---------|----------|
| **身份档案** | `tpl-about` | 地点、专业、兴趣、信仰等结构化信息 |
| **摄影画廊** | `tpl-photography` | CSS 生成艺术占位图，画廊网格布局 |
| **代码展柜** | `tpl-coding` | 项目展品卡片，含描述、技术栈、链接 |
| **夜间声场** | `tpl-music` | 唱片封面 + 波形可视化 |
| **碎片手稿** | `tpl-thoughts` | 纸张质感卡片，钉在墙上的手稿风格 |
| **信号台** | `tpl-contact` | Persona Echo 收据打印机聊天 + 社交链接 |

---

## 5. 交互功能

### 5.1 自定义光标

- 双层结构：内圈 dot (实心小圆) + 外圈 ring (空心大圆)
- 外圈使用 lerp 线性插值实现延迟跟随
- hover 到可交互元素时 ring 放大、改变混合模式
- 移动端自动禁用

### 5.2 卡片 3D Tilt

- 监听 mousemove 事件，计算鼠标相对卡片中心的偏移
- 应用 `rotateX` / `rotateY` transform
- 离开卡片时平滑归零
- 配合 `perspective` 和 `transform-style: preserve-3d`

### 5.3 页面转场

- 导航触发时，5 条竖条 wipe 覆盖视口
- 覆盖完成后：移除旧 template 内容、插入新 template、初始化新页面逻辑
- 竖条撤出，新页面元素依次入场动画
- 全程 GSAP Timeline 管理时序

### 5.4 Persona Echo (收据打印机聊天)

- 视觉风格：热敏收据纸 + 点阵字体
- 消息以"逐行打印"动画出现
- 后端：Vercel Serverless Function 调用 DeepSeek API
- 人格数据：`skills/immortals/andiii/` 目录下的数字分身配置

### 5.5 Three.js 粒子背景

- 500 个点粒子组成漂浮场
- 颜色：酸绿 + 暖白混合
- 响应鼠标移动产生微弱位移
- 低性能设备降级或关闭

### 5.6 Lenis 平滑滚动

- 全局初始化，阻尼系数可调
- 与 GSAP ScrollTrigger 同步
- 导航锚点跳转时使用 Lenis.scrollTo

### 5.7 响应式设计

| 断点 | 布局变化 |
|------|----------|
| > 900px | 桌面布局，完整动画体验 |
| 520–900px | 平板适配，减少粒子数量 |
| < 520px | 移动布局，禁用自定义光标，简化动画 |

---

## 6. 文件架构

```
E:\About Andiii\
├── index.html              # 主入口 + 所有 <template> 子页面模板
├── style.css               # 全部样式（CSS 变量设计系统）
├── main.js                 # 核心 UI 交互（光标、tilt、导航、模板切换）
├── chat.js                 # 收据打印机聊天 UI 逻辑
├── three-scene.js          # Three.js 粒子场景
├── transition.js           # 页面转场（wipe 动画）
├── sound.js                # Web Audio API 声音系统（合成音效）
├── local-server.js         # 本地开发服务器
├── vercel.json             # Vercel 部署配置
├── api/
│   └── chat.js             # Vercel Serverless — DeepSeek AI 聊天接口
├── assets/                 # 静态资源（图片、图标等）
├── pages/                  # 页面相关资源
├── chat-data/              # 聊天相关数据
├── skills/
│   └── immortals/
│       └── andiii/         # 数字分身人格数据
└── screenshot.png          # 项目截图
```

### 职责划分

| 文件 | 核心职责 |
|------|----------|
| `index.html` | DOM 结构、所有 `<template>` 定义、脚本加载顺序 |
| `style.css` | 设计系统变量、布局、组件样式、响应式断点、背景效果 |
| `main.js` | 自定义光标、3D tilt、导航逻辑、模板切换调度、ScrollTrigger 初始化 |
| `chat.js` | Persona Echo 聊天 UI、收据打印动画、API 通信 |
| `three-scene.js` | Three.js 场景初始化、粒子系统、动画循环、resize 处理 |
| `transition.js` | GSAP wipe 转场 Timeline、模板内容替换协调 |
| `sound.js` | Web Audio 合成音效、交互反馈声音 |
| `api/chat.js` | DeepSeek API 调用、请求/响应处理、错误处理 |

---

## 7. 设计理念

### 核心隐喻：深夜私人美术馆

整站以"深夜独自走入一间私人美术馆"为体验原型：

1. **入口大厅 (Hero)**：推门而入，看到馆名，暗示还有更多空间
2. **策展人笔记 (About)**：墙上一段手写文字，告诉你这是谁的收藏
3. **展室大厅 (World)**：走廊尽头有三扇门，每扇通往不同媒介的展览
4. **碎片墙 (Thoughts)**：走廊侧面钉满了零散的手稿和笔记
5. **信号台 (Contact)**：角落里一台老式收据打印机，你可以和它对话

### 设计原则

- **空间感 > 导航感**：用户不是在"切换页面"，而是在"穿越展厅"
- **氛围 > 功能**：优先营造沉浸感，功能以不破坏氛围的方式存在
- **减法美学**：移除一切非必要的 UI 元素——没有导航栏、没有面包屑、没有 footer
- **动效即叙事**：每个动画都有叙事目的，不是纯粹的视觉装饰
- **信任用户**：不提供过多控制，让用户自己探索

---

*文档最后更新：2026-05-27*
