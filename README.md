# Open Workspace in File Explorer（打开工作区文件夹）

一个 **DeepSeek Harness (DSH)** 动态 Cordis 插件：一键用操作系统自带的文件资源管理器打开「当前工作区」文件夹。

> 作者：**deepseek v4**

## 功能

- 在**会话顶部标题栏**增加「打开工作区」按钮。
- 在**侧边栏底部**增加「打开工作区」按钮：**靠左、占满整行、位于 Cordis 面板上方**（不会被右侧聊天内容遮挡）。
- 点击后调用 DSH 内置的 `workspaces.openPath()`，用系统默认方式打开当前工作区目录：
  - Windows：文件资源管理器（`Invoke-Item`）
  - macOS：访达（`open`）
  - Linux 桌面：默认文件管理器（`xdg-open`）
- **中英文 i18n**：按钮文案随界面语言自动切换（中文「打开工作区」，英文「Open Workspace」）。

## 原理

- 纯 **Client 端** 插件，无需 Host 半段（`workspaces.openPath` 已内置「用系统默认应用打开路径」的能力）。
- 通过标准槽属性 `useSessions` 读取当前会话的 `cwd`（即工作区根路径）。
- 注册到两个 Slot：
  - `conversation.session.header.actions` —— 会话标题栏动作行
  - `sidebar.footer.action` —— 侧边栏底部动作区（宽屏显示图标 + 文字并占满整行，窄栏收起时仅显示图标）
- 通过 `locale` 服务注册 `open-workspace` 命名空间的 zh/en 词典，并用 `locale` 槽选项注入 `t` 翻译函数。

> 布局说明：Cordis 面板在底部动作区是 `width:100%` 的整行元素，同一 flex 行内的第二个按钮会被挤到右侧溢出。本插件用 `:has()` 将底部动作容器改为纵向堆叠，并把自身 `order` 设为 `-1`，从而排到 Cordis 面板上方。

## 安装 / 加载

在 DSH Web GUI 中：

1. 点击侧边栏底部（设置旁）的 **Cordis** 面板按钮。
2. 新建插件（Define），`idPrefix` 填入 `wsopen`（3–6 位小写字母）。
3. 在 **Client 代码** 区域粘贴 `client.js` 的完整内容。
4. 运行（Run），并在界面弹出的授权处点勾（单击勾 = 授权当前版本，双击勾 = 授权后续版本）。
5. 完成后，在会话标题栏或侧边栏底部即可看到「打开工作区」按钮。

> 注：工作区文件夹自带的「⋮ 三点菜单」由 DSH 内置 UI 写死，未开放 Slot，插件无法向其中注入菜单项，因此本插件使用上述两个可扩展入口。

## 使用方式

1. 打开某个工作区对应的会话。
2. 点击**会话标题栏**的「打开工作区」按钮，或**侧边栏底部**的「打开工作区」按钮。
3. 系统会立即弹出文件资源管理器并定位到该工作区文件夹。
4. 若当前会话没有关联工作区，按钮会置灰（不可点击）。

## 仓库文件

| 文件 | 说明 |
| --- | --- |
| `client.js` | 插件 Client 源码（即 `cordis_define` 的 `code.client` 值，可直接粘贴） |
| `README.md` | 本说明文档 |
| `LICENSE` | MIT 许可 |

## 许可

[MIT](./LICENSE) · 作者 deepseek v4
