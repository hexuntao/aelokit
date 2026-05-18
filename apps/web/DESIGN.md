# AeloKit Web Design Guidance

本文件定义 `apps/web` 的产品设计方向。目标是让 AI 编码 Agent 在实现页面、
组件和 AI workspace 时保持一致审美。

## 设计方向

```txt
OpenAI Developers + Vercel + Linear 的工程感
```

面向开发者和 AI 产品构建者：高级、克制、清晰，像一个可以长期工作的工程产品，而不是一次性营销页面。

## 设计关键词

- 克制。
- 留白。
- 清晰层级。
- 低饱和。
- 细边框。
- 文档感。
- 控制台感。
- 高级但不花哨。
- 轻微 glass / blur，但不要重毛玻璃。
- 面向开发者和 AI 产品构建者。

## 禁止风格

- 不要赛博霓虹。
- 不要游戏化。
- 不要卡通化。
- 不要夸张渐变。
- 不要重阴影。
- 不要过度动效。
- 不要密集卡片堆叠。
- 不要传统企业后台的沉重风格。
- 不要营销腔 SaaS landing 风格。

## Layout 规则

- 优先使用清晰网格、分区、边框、留白。
- Dashboard 使用 calm workspace 感，信息密度适中，便于长期扫描。
- AI Workspace 推荐三栏结构：
  - Sidebar。
  - Main Conversation / Canvas。
  - Right Context Panel。
- 移动端允许降级为 drawer / tabs。
- 页面优先可读性和任务流，不追求炫技。
- 不要用大面积装饰图形替代真实任务界面。
- 面板、表格、列表、editor/canvas 要有稳定尺寸和清楚的空/加载/错误状态。

## AI UI 规则

- Chat message 可读性优先。
- Tool call 使用低噪音状态卡片，突出状态、输入摘要、结果和可恢复动作。
- Sources / Citations 要明确但不抢主视觉。
- Memory / Workflow / Prompt 放右侧上下文面板。
- Artifact / Canvas 以文档编辑体验为主，保持可读、可复制、可继续编辑。
- Streaming 状态要自然，避免强动画。
- 错误状态要明确可恢复，说明可以重试、编辑输入或查看原因。
- AI 输出不能伪装成确定事实；需要保留来源、状态或提示。
- AI 状态色只用于表达状态，不做装饰。

## 组件规则

- 优先复用已有 `components/ui`。
- 不要为了新页面随意引入新 UI 库。
- 不要硬编码大量 magic values；优先使用已有 token、spacing、radius、surface 和 border 习惯。
- Tailwind class 要可维护，避免单个元素堆叠过长且不可读的 class。
- 文案要短、清楚、工程化。
- 空状态、加载状态、错误状态必须设计。
- 交互组件要有清楚 focus states、disabled states 和 pending states。
- 图标用于增强识别，不要替代关键文字信息。

## 色彩和视觉

不要写具体颜色 token，除非仓库已有 token。描述原则：

- neutral first。
- low contrast surfaces。
- subtle borders。
- clear focus states。
- restrained accent color。
- dark mode / light mode 都要考虑。
- AI 状态色只用于表达状态，不做装饰。
- 背景层次靠 surface、border、spacing、type scale，而不是靠重阴影或强渐变。

## 文案气质

- 像开发者文档和工程控制台，不像广告页。
- CTA 简短直接，避免“解锁增长飞轮”这类营销腔。
- 状态文案告诉用户发生了什么、下一步能做什么。
- 对 AI 能力保持准确，不夸大确定性。
