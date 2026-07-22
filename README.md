# Spark Prompts

精选 **AI 提示词画廊** 静态站点：搜索、分类筛选、收藏、详情弹窗与一键复制。  
适合部署到 **GitHub Pages**，并绑定自定义域名分享使用。

灵感来自 [Banana Prompt Quicker Gallery](https://glidea.github.io/banana-prompt-quicker/#gallery) 一类的提示词展示站，本项目为独立实现，无扩展依赖。

**完整产品与技术方案**（架构 / 本地 / 上线 / 路线图）见：[`docs/完整方案.md`](docs/完整方案.md)

### 5 分钟上手

| 步骤 | 做什么 |
|------|--------|
| 1 | 双击 `start.bat` 本地验收 |
| 2 | 改 `js/config.js`（品牌、GitHub 链接） |
| 3 | 改 `js/data.js`（自己的提示词） |
| 4 | 推 GitHub → 开启 Pages |
| 5 | （可选）`CNAME` + DNS 绑域名 |

## 本地预览（完整方案）

本项目是**纯静态**站点，Windows 上有三种打开方式：

### 方式一：一键服务器（推荐）

双击项目根目录的 **`start.bat`**。

会按顺序自动尝试：

1. `python -m http.server`（端口 8080）
2. `py -3 -m http.server`
3. `npx serve`
4. 内置 **PowerShell 静态服务器**（`tools/local-server.ps1`，无需 Python/Node）

浏览器会自动打开 `http://127.0.0.1:8080/`（或脚本提示的端口）。  
关闭黑色命令行窗口即停止服务。

### 方式二：直接打开网页（零依赖）

双击 **`打开网页.bat`**，或直接双击 **`index.html`**。

- 搜索、筛选、收藏、弹窗均可使用  
- 部分浏览器在 `file://` 下可能限制剪贴板 API；若复制失败，请改用方式一  

更详细的中文说明见：`本地使用说明.txt`。

### 方式三：命令行

```bash
cd spark-prompts
python -m http.server 8080 --bind 127.0.0.1
# 或
powershell -ExecutionPolicy Bypass -File tools\local-server.ps1
```

## 目录结构

```
spark-prompts/
├── index.html          # 页面入口
├── css/styles.css      # 样式（含深/浅色）
├── js/data.js          # 提示词数据（主要维护这里）
├── js/app.js           # 交互逻辑
├── CNAME.example       # 自定义域名示例
└── README.md
```

## 添加 / 修改提示词

编辑 `js/data.js` 中的 `PROMPT_DATA` 数组，字段说明：

| 字段 | 说明 |
|------|------|
| `id` | 唯一 ID |
| `title` | 标题 |
| `category` | 分类（需在 `CATEGORIES` 中声明） |
| `tags` | 标签数组 |
| `type` | `generate` 生成 / `edit` 编辑 |
| `date` | `YYYY-MM-DD`，用于「近一周」筛选 |
| `cover` | CSS 渐变或图片 URL |
| `emoji` | 卡片图标 |
| `summary` | 短描述 |
| `prompt` | 完整提示词正文 |

同步维护 `CATEGORIES` 与可选的 `ANNOUNCEMENTS`。

## 部署到 GitHub Pages

1. 新建 GitHub 仓库（例如 `spark-prompts`）。
2. 将本目录文件推送到仓库根目录（`index.html` 在根上）：

```bash
cd spark-prompts
git init
git add .
git commit -m "Initial commit: Spark Prompts gallery"
git branch -M main
git remote add origin https://github.com/<你的用户名>/spark-prompts.git
git push -u origin main
```

3. 仓库 **Settings → Pages**：
   - Source: **Deploy from a branch**
   - Branch: `main` / `/ (root)`
4. 等待一两分钟，访问：  
   `https://<你的用户名>.github.io/spark-prompts/`

若仓库名为 `<用户名>.github.io`，站点会在域名根路径。

### 自定义域名

1. 复制 `CNAME.example` 为 `CNAME`，写入你的域名，例如：

```
prompts.example.com
```

2. 在域名 DNS 添加：
   - **Apex 域名**：GitHub 文档中的 A 记录；或
   - **子域名**：CNAME 指向 `<用户名>.github.io`
3. Pages 设置里填写同一自定义域名，并开启 HTTPS。

官方说明：https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site

## 功能一览

- 响应式卡片画廊
- 关键词搜索（标题 / 标签 / 正文）
- 分类下拉 + 类型筛选（生成 / 编辑 / 近一周 / 收藏）
- 详情弹窗 + 一键复制
- 本地收藏（`localStorage`）
- 深色 / 浅色主题
- 公告轮播

## License

MIT — 可自由修改与分享。
