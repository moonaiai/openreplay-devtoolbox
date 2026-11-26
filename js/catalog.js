/* Tool catalog — mirrors the OpenReplay developer toolbox feature list */
(function () {
  'use strict';
  const DT = window.DT;
  DT.categoryNames = {
    colors: '颜色工具',
    encoding: '编码 / 解码',
    format: '格式化 / 校验',
    convert: '数据转换',
    text: '文本 / 进制',
    web: 'Web 开发',
    security: '安全 / 加密',
    media: '图片 / 视频',
    llm: 'AI / LLM'
  };

  const defs = [
    // 颜色工具
    ['rgb-to-hex', 'RGB 转 HEX', 'colors', '将 RGB 颜色值转换为十六进制', 'rgb hex 颜色'],
    ['rgba-to-hex', 'RGBA 转 HEX', 'colors', '将 RGBA 值转换为 hex，包含 alpha 通道', 'rgba hex alpha'],
    ['hex-to-rgb', 'HEX 转 RGB', 'colors', '将十六进制颜色转换为 RGB', 'hex rgb 颜色'],
    ['hex-to-rgba', 'HEX 转 RGBA', 'colors', '将 hex 颜色转换为 rgba()，可控制不透明度', 'hex rgba alpha'],
    ['hex-to-oklch', 'HEX 转 OKLCH', 'colors', '将 hex 代码转换为 OKLCH 色彩空间', 'oklch oklab 颜色'],
    ['color-picker', '颜色选择器', 'colors', '选取颜色并复制为 HEX、RGB、HSL 或 OKLCH', 'picker 取色'],
    ['color-contrast-checker', '颜色对比度检查器', 'colors', '检查两种颜色之间的 WCAG 对比度', 'wcag a11y contrast'],
    ['css-gradient-generator', 'CSS 渐变生成器', 'colors', '创建线性、径向和锥形渐变', 'gradient css'],
    ['box-shadow-generator', 'box-shadow 生成器', 'colors', '设计多层阴影并复制 CSS', 'shadow css'],

    // 编码 / 解码
    ['base64', 'Base64 编码器 / 解码器', 'encoding', '使用 Base64 编码和解码文本', 'base64 encode decode'],
    ['url-encoder', 'URL 编码器 / 解码器', 'encoding', '编码和解码 URL 与查询字符串', 'url encode uri component'],
    ['html-entities', 'HTML 实体编码器 / 解码器', 'encoding', '转义和反转义 HTML 实体', 'html entity escape'],
    ['image-to-base64', '图片转 Base64', 'encoding', '将图片转换为 data URI，并可反向转换', 'image data uri'],
    ['json-escape', 'JSON 转义 / 反转义', 'encoding', '转义和反转义 JSON 字符串内容', 'json string escape'],

    // 格式化 / 校验
    ['json-formatter', 'JSON 格式化工具', 'format', '格式化、美化和压缩 JSON', 'json pretty minify'],
    ['json-validator', 'JSON 校验器', 'format', '校验 JSON 并定位语法错误', 'json validate error'],
    ['xml-formatter', 'XML 格式化工具', 'format', '格式化、美化和校验 XML', 'xml pretty validate'],
    ['sql-formatter', 'SQL 格式化工具', 'format', '格式化常见方言的 SQL 查询', 'sql pretty'],
    ['yaml-validator', 'YAML 校验器', 'format', '校验 YAML 并转换为 JSON', 'yaml validate'],
    ['html-formatter', 'HTML 格式化工具', 'format', '格式化和美化 HTML', 'html pretty'],
    ['html-minifier', 'HTML 压缩工具', 'format', '压缩 HTML 以减小页面大小', 'html minify'],
    ['css-beautifier', 'CSS 美化工具', 'format', '美化和格式化 CSS', 'css pretty'],
    ['css-minifier', 'CSS 压缩工具', 'format', '压缩 CSS 以减小文件体积', 'css minify'],
    ['javascript-beautifier', 'JavaScript 美化工具', 'format', '美化和格式化 JavaScript', 'js pretty beautify'],
    ['javascript-minifier', 'JavaScript 压缩工具', 'format', '压缩 JavaScript 以缩减打包体积', 'js minify'],
    ['jsonl-validator', 'JSONL 校验器', 'format', '校验并检查 JSONL 微调数据集', 'jsonl dataset'],

    // 数据转换
    ['json-to-csv', 'JSON 转 CSV', 'convert', '将 JSON 数据转换为 CSV', 'json csv table'],
    ['csv-to-json', 'CSV 转 JSON', 'convert', '将 CSV 数据转换为 JSON', 'csv json parse'],
    ['json-yaml', 'JSON ⇄ YAML', 'convert', '在 JSON 与 YAML 之间相互转换', 'yaml json convert'],
    ['yaml-to-go', 'YAML 转 Go', 'convert', '从 YAML 生成 Go 结构体', 'yaml golang struct'],
    ['xml-to-json', 'XML ⇄ JSON', 'convert', '在 XML 与 JSON 之间相互转换', 'xml json convert'],
    ['markdown-html', 'Markdown ⇄ HTML', 'convert', '在 Markdown 与 HTML 之间相互转换，并提供预览', 'markdown html'],
    ['json-to-typescript', 'JSON 转 TypeScript', 'convert', '从 JSON 生成 TypeScript 类型', 'json ts type interface'],
    ['json-to-go', 'JSON 转 Go', 'convert', '从 JSON 生成 Go 结构体', 'json golang struct'],
    ['curl-converter', 'curl 转代码', 'convert', '将 curl 命令转换为 fetch、Python 等', 'curl fetch python http'],
    ['case-converter', '命名规范转换器', 'convert', '在各种命名规范之间转换文本', 'camel snake kebab pascal'],
    ['toml-to-json', 'TOML 转 JSON', 'convert', '在 TOML 与 JSON 之间相互转换', 'toml json'],
    ['jsonpath-tester', 'JSONPath 测试器', 'convert', '使用 JSONPath 表达式查询 JSON', 'jsonpath query'],
    ['json-schema-builder', 'JSON Schema 构建器', 'convert', '为 LLM 工具调用构建结构化输出 Schema', 'schema function calling'],

    // 文本 / 进制
    ['word-counter', '字数统计器', 'text', '统计字数、字符数和阅读时间', 'word count reading time'],
    ['diff-checker', '差异比较器', 'text', '比较两段文本并高亮变更', 'diff compare'],
    ['lorem-ipsum-generator', 'Lorem Ipsum 生成器', 'text', '为原型设计生成占位文本', 'lorem placeholder'],
    ['remove-duplicate-lines', '删除重复行', 'text', '删除文本中的重复行', 'dedupe lines'],
    ['sort-text', '文本行排序', 'text', '按字母或数字排序文本行', 'sort lines'],
    ['invisible-character-cleaner', '隐形字符清理器', 'text', '检测并删除隐藏的 Unicode 和提示词注入字符', 'zero width unicode prompt injection'],
    ['binary-translator', '二进制转换器', 'text', '在文本与二进制之间互相转换，并提供进制转换器', 'binary translator'],
    ['binary-to-decimal', '二进制转十进制', 'text', '将二进制数转换为十进制', 'bin dec'],
    ['decimal-to-binary', '十进制转二进制', 'text', '将十进制数字转换为二进制', 'dec bin'],
    ['hex-to-decimal', '十六进制转十进制', 'text', '将十六进制转换为十进制', 'hex dec'],
    ['decimal-to-hex', '十进制转十六进制', 'text', '将十进制数字转换为十六进制', 'dec hex'],
    ['binary-to-text', '二进制转文本', 'text', '将二进制解码为可读文本', 'binary text decode'],
    ['text-to-binary', '文本转二进制', 'text', '以 ASCII 或 UTF-8 将文本转换为二进制', 'text binary encode'],
    ['hex-to-binary', '十六进制转二进制', 'text', '将十六进制转换为二进制半字节', 'hex bin'],
    ['octal-to-decimal', '八进制转十进制', 'text', '将八进制数转换为十进制', 'oct dec'],
    ['binary-calculator', '二进制计算器', 'text', '进行加法、减法以及按位二进制运算', 'binary calculator bitwise'],
    ['ascii-table', 'ASCII 表', 'text', '十进制、十六进制、八进制和二进制的 ASCII 代码', 'ascii charset'],
    ['timestamp-converter', '时间戳转换器', 'text', '将时间戳转换为可读日期', 'unix timestamp date'],
    ['regex-tester', 'RegEx 测试器', 'text', '测试和调试正则表达式', 'regexp regexp tester'],
    ['chmod-calculator', 'Chmod 计算器', 'text', '计算 Unix 文件权限', 'chmod permissions unix'],
    ['px-to-rem', 'PX 转 REM', 'text', '按任意基准尺寸将像素转换为 rem', 'px rem css'],
    ['compression-comparison', '压缩比较', 'text', '用 Gzip、Deflate 等压缩文本并比较压缩比', 'gzip brotli zstd compression'],

    // Web 开发
    ['har-file-viewer', 'HAR 文件查看器', 'web', '检查和分析 HTTP Archive 文件', 'har network viewer'],
    ['cron-parser', 'Cron 表达式解析器', 'web', '解析、构建和解释 Cron 计划', 'cron schedule'],
    ['user-agent-parser', 'User-Agent 解析器', 'web', '从 UA 字符串识别浏览器、操作系统和设备', 'user agent browser'],
    ['url-parser', 'URL 解析器', 'web', '将 URL 拆分为各部分，并将查询参数转为 JSON', 'url parse query'],
    ['cookie-parser', 'Cookie 解析器', 'web', '检查 cookie 字符串和 Set-Cookie 头', 'cookie set-cookie'],
    ['meta-tag-previewer', 'Meta 标签预览器', 'web', '预览 Google、X 和 Facebook 的链接卡片', 'meta og seo preview'],
    ['meta-tag-generator', 'Meta 标签生成器', 'web', '生成 SEO、Open Graph 和 Twitter meta 标签', 'meta og twitter seo'],
    ['gitignore-generator', 'gitignore 生成器', 'web', '从语言和操作系统模板构建 .gitignore', 'gitignore templates'],
    ['htaccess-generator', 'htaccess 生成器', 'web', '生成 Apache .htaccess 重写和重定向规则', 'apache rewrite'],
    ['http-status-codes', 'HTTP 状态码', 'web', '每个 HTTP 状态码及其含义', 'http status codes'],
    ['webrtc-ice-test', 'WebRTC ICE 测试', 'web', '测试 STUN 服务器并收集 ICE 候选', 'webrtc ice stun'],
    ['webrtc-leak-test', 'WebRTC 泄露测试', 'web', '检测 WebRTC 是否泄露你的真实 IP', 'webrtc leak privacy'],
    ['file-drop', '一次性文件分享', 'web', '生成带过期时间的本地文件分享链接（实验版）', 'file share one time'],
    ['ip-lookup', 'IP 地址查询', 'web', '查询 IP 的归属地区、坐标、时区和网络信息', 'ip lookup geo whois asn isp'],

    // 安全 / 加密
    ['jwt-decoder', 'JWT 解码器', 'security', '解码并检查 JSON Web Token', 'jwt decode token'],
    ['jwt-generator', 'JWT 生成器', 'security', '使用 HS256 或 RS256 签发 JSON Web Token', 'jwt sign hs256 rs256'],
    ['token-generator', '令牌生成器', 'security', '生成安全的随机令牌', 'token random'],
    ['hash-generator', '哈希生成器', 'security', '计算 MD5、SHA-1/256/384/512 摘要', 'md5 sha hash'],
    ['password-generator', '密码生成器', 'security', '在本地生成高强度的随机密码', 'password random'],
    ['uuid-generator', 'UUID 生成器', 'security', '批量生成 UUID v4 和 v7 标识符', 'uuid guid'],
    ['hmac-generator', 'HMAC 生成器', 'security', '使用 SHA-1 到 SHA-512 生成 HMAC 签名', 'hmac sha'],
    ['aes-encryption', 'AES 加密', 'security', '使用 AES-GCM 或 AES-CBC 加密和解密文本', 'aes gcm cbc crypto'],
    ['bcrypt-generator', 'Bcrypt 生成器', 'security', '使用 bcrypt 哈希并验证密码', 'bcrypt password hash'],
    ['subnet-calculator', '子网计算器', 'security', '计算 IPv4 和 IPv6 子网范围', 'subnet ip network'],
    ['cidr-calculator', 'CIDR 计算器', 'security', '将 CIDR 表示法展开为地址范围', 'cidr ip range'],
    ['iam-policy-explainer', 'AWS IAM 策略解读器', 'security', '用通俗语言解读 AWS IAM 策略', 'aws iam policy json'],
    ['qr-code-generator', 'QR Code 生成器', 'security', '从文本或 URL 创建可下载的 QR Code', 'qr code barcode'],

    // 图片 / 视频
    ['favicon-generator', 'favicon 生成器', 'media', '从一张图片构建完整的 favicon 套件', 'favicon icon ico'],
    ['heic-to-jpg', 'HEIC 转 JPG', 'media', '在浏览器中将 HEIC 照片转换为 JPG', 'heic jpg iphone'],
    ['image-compressor', '图片压缩器', 'media', '私密地压缩 JPG、PNG 和 WebP 图片', 'image compress quality'],
    ['svg-to-png', 'SVG 转 PNG', 'media', '以任意倍率将 SVG 栅格化为 PNG', 'svg png raster'],
    ['png-to-jpg', 'PNG 转 JPG', 'media', '将 PNG 图片转换为 JPG', 'png jpg'],
    ['jpg-to-png', 'JPG 转 PNG', 'media', '将 JPG 图片转换为 PNG', 'jpg png'],
    ['webp-to-png', 'WebP 转 PNG', 'media', '将 WebP 图片转换为 PNG', 'webp png'],
    ['mov-to-mp4', 'MOV 转 MP4', 'media', '将 QuickTime MOV 转换为 MP4', 'mov mp4 video'],
    ['mkv-to-mp4', 'MKV 转 MP4', 'media', '将 MKV 转换为 MP4', 'mkv mp4 video'],
    ['webm-to-mp4', 'WebM 转 MP4', 'media', '将 WebM 转换为通用的 H.264 MP4', 'webm mp4 video'],
    ['mp4-to-webm', 'MP4 转 WebM', 'media', '将 MP4 转换为 WebM', 'mp4 webm video'],
    ['video-to-gif', '视频转 GIF 转换器', 'media', '把视频变成 GIF 动图，帧率、宽度可调', 'video gif frames'],
    ['gif-to-mp4', 'GIF 转 MP4', 'media', '把 GIF 动图转换为 MP4 视频', 'gif mp4'],
    ['video-compressor', '视频压缩', 'media', '通过分辨率与帧率压缩视频体积', 'video compress'],
    ['video-trimmer', '视频剪切工具', 'media', '从视频中截取时间段', 'video trim cut'],

    // AI / LLM
    ['llm-token-counter', 'LLM Token 计数器', 'llm', '统计并可视化 GPT、Claude、Gemini 等模型的 Token', 'token llm tiktoken'],
    ['llm-cost-calculator', 'LLM API 成本计算器', 'llm', '估算并比较各 LLM 模型的 API 成本', 'cost price llm api'],
    ['context-window-checker', '上下文窗口检查器', 'llm', '检查提示词是否能放入模型的上下文窗口', 'context window model']
  ];

  defs.forEach(d => DT.customTool({ id: d[0], name: d[1], cat: d[2], desc: d[3], keywords: d[4], type: 'replica' }));
})();
