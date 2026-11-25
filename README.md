# OpenDevToolbox — 开发者工具箱 Chrome 插件

一个本地优先的 Chrome Manifest V3 扩展：把 [OpenReplay 开发者工具箱](https://openreplay.com/zh/tools/) 每个工具的**控件区**原样打包到本地。输入项、按钮、结果区、样式和工具自己的 JS 逻辑都保留；官网导航栏、页脚、FAQ、相关推荐等页面外围内容不包含。点击工具即可在插件弹窗内看到官网同款工具本体（例如 `timestamp-converter` 的时间戳 / 单位 / 日期输入、六行结果表、每行复制按钮）。统计脚本已移除、资源全部本地化，离线可用。

仅保留复刻版，不再附带另行实现的本地版。另附带轻量会话录制 / 回放（迷你 OpenReplay）。所有计算都在浏览器本地完成，不上传任何数据。

## 安装

1. 打开 Chrome，地址栏输入 `chrome://extensions`
2. 打开右上角「开发者模式」
3. 点击「加载已解压的扩展程序」，选择本目录 `openreplay-devtoolbox`
4. 点击工具栏图标，工具箱直接显示在弹出的窗口中（800×600，Chrome 弹窗上限）；点工具后会在同一个弹窗内展示工具本体

也可以直接打开 `app.html` 以普通网页形式预览工具箱（录制 / 回放功能需要扩展环境）。

## 使用

- **工具箱**：顶部搜索框支持中英文关键词（按 `/` 快速聚焦），左侧按 9 个分类筛选。
- **工具**：点击工具卡片，弹窗内直接显示官网同款工具控件；工具区另有「新标签页打开」按钮，需要更大画面时可点它。
- **会话录制 / 回放**：侧栏底部「会话录制 / 回放」→ 开始录制当前标签页 → 在页面上操作 → 停止并保存。回放视图提供 DOM 快照时间轴、控制台 / 网络 / 错误 / 交互标签页；会话可导出 / 导入 JSON。
- **主题**：右上角按钮切换深色 / 浅色，偏好保存在本地。

### 复刻页的生成

```
scripts/build_replica.py    # 抓取官网中文工具页、Astro JS/CSS chunk 与静态资源并本地化、裁成工具控件区
replica/pages/*.html        # 106 个本地化页面（只保留工具控件本体，无官网导航/页脚/FAQ/相关推荐）
replica/pages/*.inline-*.js # 官网页面中的内联脚本被抽成同目录 JS 文件
replica/assets/             # 官网 JS/CSS chunk
replica/root/               # 官网图片、图标等静态资源
```

页面中的 GTM / Ahrefs / OpenReplay tracker 统计脚本已移除或替换为空实现。需要重新生成时运行：

```
python3 scripts/build_replica.py
```

## 工具覆盖（105 个）

| 分类 | 数量 | 示例 |
| --- | ---: | --- |
| 颜色工具 | 9 | RGB/HEX/OKLCH 转换、颜色选择器、WCAG 对比度、渐变、box-shadow |
| 编码 / 解码 | 5 | Base64、URL、HTML 实体、图片 data URI、JSON 转义 |
| 格式化 / 校验 | 12 | JSON/XML/SQL/HTML/CSS/JS 格式化与压缩、JSONL 校验 |
| 数据转换 | 13 | JSON⇄CSV/YAML/XML/TOML、JSON→TS/Go/Schema、curl、Markdown |
| 文本 / 进制 | 22 | diff、字数、正则、时间戳、cron、进制互转、ASCII、chmod |
| Web 开发 | 13 | HAR 查看器、UA/URL/Cookie 解析、meta 标签、ICE/泄露测试、gitignore |
| 安全 / 加密 | 13 | JWT 编解码、MD5/SHA、HMAC、AES、UUID/密码、子网、QR Code |
| 图片 / 视频 | 15 | 图片转换 / 压缩、favicon、SVG→PNG、视频截取与帧导出 |
| AI / LLM | 3 | Token 估算、成本计算、上下文窗口检查 |

## 已知限制

- Chrome 扩展 MV3 的 CSP 禁止 `eval` / `new Function`。原站脚本中依赖它的少数工具（`jsonpath-tester`、`heic-to-jpg`、`jpg-to-png`、`png-to-jpg`、`webp-to-png`、`svg-to-png`、`image-compressor`）在扩展页内可能无法正常执行核心逻辑；点「新标签页打开」后作为普通网页打开不受此限制，或点「官网 ↗」在线使用。
- 会话录制只保存在本机，不上传。

## REA（逆向分析工具）说明

按你提供的 README 安装了 REA CLI：`rea-agents@6.7.0`（6.8+ 要求更新的 Node，本机 Node 22.22.2 兼容 6.7）。安装位置：

```
/Users/guohualiang/node_modules/.bin/rea   # rea@6.7.0
```

已用 `rea analyze-javascript-application` 对本项目做静态分析；分析器报告 `cleanup_incomplete`（临时资源清理未确认，属于 REA 的运行环境问题），但成功遍历并解析了项目 JS 文件。若要让 REA 作为 MCP 服务供智能体调用，可在可信目录执行 `npx rea-agents setup` 后重启智能体（该步骤会修改智能体配置，因此未自动执行）。

## 致谢与许可

工具页结构、样式与逐工具脚本来自公开的 OpenReplay 工具站，版权归 OpenReplay Inc. 所有；本项目仅做本地化、裁剪工具控件区与去统计处理，与其无隶属关系。OpenReplay 是 OpenReplay Inc. 的商标。扩展外壳为原创代码，图标为本项目生成；打包后的复刻页面无远程脚本依赖、无遥测。
