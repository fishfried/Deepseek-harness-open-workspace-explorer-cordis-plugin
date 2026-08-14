# Open Workspace in File Explorer（打开工作区文件夹）

一个 **DeepSeek Harness (DSH)** 客户端插件：一键用操作系统自带的文件资源管理器打开「当前工作区」文件夹。

> 作者：**deepseek v4**

## 功能

- 在**会话顶部标题栏**增加「打开工作区」按钮。
- 在**侧边栏底部**增加「打开工作区」按钮：**靠左、占满整行、位于 Cordis 面板上方**（不会被右侧聊天内容遮挡）。
- 点击后调用 DSH 网关已有的 `host.openPath`，用系统默认方式打开当前工作区目录：
  - Windows：文件资源管理器（`Invoke-Item`）
  - macOS：访达（`open`）
  - Linux 桌面：默认文件管理器（`xdg-open`）
- **中英文 i18n**：按钮文案随界面语言自动切换（中文「打开工作区」，英文「Open Workspace」）。
- **持久化**：作为 Web 配置文件的普通客户端插件装载，**重启 DSH 后依然存在**（区别于临时的动态插件）。

## 原理

- 纯 **Client 端** 插件，宿主半段（`lib/index.js`）为空，仅用于让插件出现在 Loader 中；浏览器半段通过 `package.json` 的 `dsh.client` 声明被发现。
- 通过标准槽属性 `useSessions` 读取当前会话的 `cwd`（即工作区根路径）。
- 注册到两个 Slot：
  - `conversation.session.header.actions` —— 会话标题栏动作行
  - `sidebar.footer.action` —— 侧边栏底部动作区
- 通过 `locale` 服务注册 `open-workspace` 命名空间的 zh/en 词典。

> 布局说明：Cordis 面板在底部动作区是 `width:100%` 的整行元素，同一 flex 行内的第二个按钮会被挤到右侧溢出。本插件用 `:has()` 把底部动作容器改为纵向堆叠，并把自身 `order` 设为 `-1`，从而排到 Cordis 面板上方。

## 安装（持久化）

把它装进 DSH 的 **web 配置文件**（profile）即可持久生效。假设你的 DSH 家目录为 `~/.dsh`：

1. 把本仓库复制到 web 配置文件的插件目录：

   ```
   ~/.dsh/profiles/web/plugins/dsh-plugin-workspace-open/
   ```

2. 在 `~/.dsh/profiles/web/package.json` 的 `dependencies` 里加入本地文件依赖：

   ```json
   {
     "dependencies": {
       "dsh-plugin-workspace-open": "file:./plugins/dsh-plugin-workspace-open"
     }
   }
   ```

3. 在 `~/.dsh/profiles/web/cordis.patch.yml` 里插入该行：

   ```yaml
   - insert:
       - id: workspace-open
         name: 'dsh-plugin-workspace-open'
   ```

4. 在 web 配置文件目录重新安装依赖：

   ```bash
   cd ~/.dsh/profiles/web
   pnpm install
   ```

5. **重启 DSH**，之后在会话标题栏或侧边栏底部即可看到「打开工作区」按钮，且重启后不再消失。

> 注：工作区文件夹自带的「⋮ 三点菜单」由 DSH 内置 UI 写死，未开放 Slot，插件无法向其中注入菜单项，因此本插件使用上述两个可扩展入口。

## 使用方式

1. 打开某个工作区对应的会话。
2. 点击**会话标题栏**的「打开工作区」按钮，或**侧边栏底部**的「打开工作区」按钮。
3. 系统会立即弹出文件资源管理器并定位到该工作区文件夹。
4. 若当前会话没有关联工作区，按钮会置灰（不可点击）。

## 仓库文件

| 文件 | 说明 |
| --- | --- |
| `package.json` | 包清单（含 `dsh.client` 声明与宿主/浏览器入口） |
| `lib/index.js` | 宿主半段（空 apply） |
| `lib/client.js` | 浏览器半段（槽位注册 + i18n + 打开动作） |
| `README.md` | 本说明文档 |
| `LICENSE` | MIT 许可 |

## 许可

[MIT](./LICENSE) · 作者 deepseek v4
