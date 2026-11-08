# 灵动词库 · 浏览器插件

把灵动词库（https://lingdongtech.de5.net/）的词库装进浏览器：点工具栏图标弹出一个 460×720 的小窗，
按分类列出全部提示词，**点任意一条即复制整段提示词正文**。

## 目录

```
extension/
├── manifest.json        # Manifest V3
├── background.js        # 点击图标打开/聚焦小窗
├── popup.html           # 小窗页面
├── popup.css
├── popup.js             # 载入数据、搜索、分类、点击复制
├── data/prompts.json    # 词库快照（由 tools/build-extension.ps1 从根目录 prompts.json 复制）
└── icons/               # 16 / 48 / 128 图标
```

## 安装（开发者模式加载）

1. 解压本目录（或网站上下载的 `lingdong-prompts-extension.zip`），确认 `manifest.json` 在这一层。
2. Chrome 打开 `chrome://extensions`（Edge 为 `edge://extensions`），右上角打开「开发者模式」。
3. 点「加载已解压的扩展程序」，选中该目录。
4. 点击工具栏上的「灵动词库」图标打开小窗。

## 收藏

- 条目右侧的 ♡ 点一下就把该提示词加入「我的收藏」，再点一下取消。
- 「我的收藏」和「科研提示词」「有趣提示词」是同一层的分类，点标签即可只看收藏。
- 收藏用 `chrome.storage.local` 存在本机（键名 `ld.favorites`），不占配额、不上传，换浏览器不会同步。

## 数据来源

- 打开小窗时先请求 `https://lingdongtech.de5.net/prompts.json`（4 秒超时），拿到就用**线上最新**数据。
- 请求失败（断网 / 站点临时不可用）时回退到内置的 `data/prompts.json` 快照，功能不受影响。
- 小窗底部会标出当前是「在线」还是「离线」。

## 打包 / 更新

在仓库根目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File tools\build-extension.ps1
```

脚本会：

1. 把根目录 `prompts.json` 复制到 `extension/data/prompts.json`；
2. 检查 `manifest.json` 里声明的图标文件是否存在；
3. 把 `extension/*` 打成 `downloads/lingdong-prompts-extension.zip`（站点下载按钮指向它）。

只想更新数据、不重新打包时加 `-SkipZip`。

## 权限说明

| 权限 | 用途 |
|------|------|
| `storage` | 保存「我的收藏」列表（`chrome.storage.local`） |
| `clipboardWrite` | 点击条目时写入剪贴板 |
| `host_permissions: https://lingdongtech.de5.net/*` | 拉取线上最新词库 |

不读取浏览记录、不注入任何页面，除了拉取 `prompts.json` 外不发起网络请求。
