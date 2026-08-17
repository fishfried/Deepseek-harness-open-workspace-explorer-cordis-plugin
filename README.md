# Open Workspace in File Explorer（打开工作区文件夹 + 右侧工作区文件面板）

一个 **DeepSeek Harness (DSH)** 客户端插件：一键用操作系统自带的文件资源管理器打开「当前工作区」文件夹，并在**右侧提供工作区文件树面板**（展示工作区及其次级项目结构）。

> 作者：**deepseek v4**

## 功能

- 在**会话顶部标题栏**增加「打开工作区」按钮。
- 在**侧边栏底部**增加「打开工作区」按钮：**靠左、占满整行、位于 Cordis 面板上方**（不会被右侧聊天内容遮挡）。
- 点击后调用 DSH 网关已有的 `host.openPath`，用系统默认方式打开当前工作区目录：
  - Windows：文件资源管理器（`Invoke-Item`）
  - macOS：访达（`open`）
  - Linux 桌面：默认文件管理器（`xdg-open`）
- **右侧工作区文件面板**（`shell.overlay` 抽屉）：会话标题栏新增「工作区文件」开关按钮，点击在右侧展开/收起**工作区目录树**：
  - 树形展示工作区及其**次级项目/文件夹结构**（懒加载逐层展开）；
  - 单击展开/选择、双击用系统默认应用打开文件、右键菜单（打开 / 复制路径 / 在文件管理器中显示 / 刷新）；
  - 隐藏文件/文件夹置灰显示；加载失败可点击重试。
- **中英文 i18n**：按钮与面板文案随界面语言自动切换。
- **持久化**：作为配置文件（profile）的普通客户端插件装载，**重启 DSH 后依然存在**（区别于临时的动态插件）。

## 原理

- 纯 **Client 端** 插件，宿主半段（`lib/index.js`）为空，仅用于让插件出现在 Loader 中；浏览器半段通过 `package.json` 的 `dsh.client` 声明被发现。
- 通过**标准槽属性** `useSessions` / `useWorkspaces` 读取数据（绝不依赖模块级导出的 hook——那类 hook 并不存在，这是历史上 UI 消失的根因）。
- 打开路径按优先级解析：① 当前会话所属工作区的规范路径 → ② 最近活跃工作区 → ③ 当前会话 `cwd`；均不可得时按钮置灰而不是报错。
- 文件树通过客户端服务 `workspaces.listDirectory(path)` 逐层浏览（走网关 `host.listDirectory` 的 browse 能力），双击/右键通过 `workspaces.openPath(path)` 打开；文件/文件夹类型按名称启发式判断，展开失败时自动纠正为文件。
- 注册到四个 Slot：
  - `conversation.session.header.actions` —— 会话标题栏动作行（打开工作区 + 文件面板开关）
  - `sidebar.footer.action` —— 侧边栏底部动作区
  - `shell.overlay` —— 右侧文件面板抽屉
- 通过 `locale` 服务注册 `open-workspace` 命名空间的 zh/en 词典（服务缺失时回退到内置中文文案）。

> 布局与兼容性：Cordis 面板在底部动作区是 `width:100%` 的整行元素，同一 flex 行内的第二个按钮会被挤到右侧溢出。本插件把布局升级（纵向堆叠、占满整行、`order:-1` 排到 Cordis 面板上方）放在 `@supports selector(:has(...))` 之后：支持 `:has()` 的浏览器获得最佳布局；不支持的浏览器自动降级为紧凑可伸缩按钮，**不会溢出或消失**。

## 安装（持久化）

### Web 配置文件（profiles/web）

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

5. **重启 DSH**。

### 桌面版（DSH Desktop，profiles/desktop）

桌面版使用独立的 `profiles/desktop` 配置文件，需要单独安装：

1. 把本仓库复制到 desktop 配置文件的插件目录：

   ```
   ~/.dsh/profiles/desktop/plugins/dsh-plugin-workspace-open/
   ```

2. 在 `~/.dsh/profiles/desktop/package.json` 的 `dependencies` 里加入本地文件依赖：

   ```json
   {
     "dependencies": {
       "dsh-plugin-workspace-open": "file:./plugins/dsh-plugin-workspace-open"
     }
   }
   ```

3. 在 `~/.dsh/profiles/desktop/cordis.patch.yml` 里插入该行：

   ```yaml
   - insert:
       - id: workspace-open
         name: 'dsh-plugin-workspace-open'
   ```

4. 让桌面版能解析到该包（两种方式任选其一）：
   - 在 `~/.dsh/profiles/desktop` 目录执行 `pnpm install`（推荐，由 pnpm 管理链接）；或
   - 在 `~/.dsh/profiles/node_modules/` 下建一个指向插件目录的符号链接/junction：
     ```bash
     # Windows（PowerShell）
     New-Item -ItemType Junction -Path "$HOME\.dsh\profiles\node_modules\dsh-plugin-workspace-open" -Target "$HOME\.dsh\profiles\desktop\plugins\dsh-plugin-workspace-open"
     ```

5. **重启 DSH 桌面版**。

> 桌面版与 Web 版各自独立装载插件，升级插件时记得**同步两个 profile 的副本**（本仓库是唯一权威源）。

## 使用方式

1. 打开某个工作区对应的会话。
2. 点击**会话标题栏**的「打开工作区」按钮，或**侧边栏底部**的「打开工作区」按钮 → 系统立即弹出文件资源管理器并定位到该工作区文件夹。
3. 点击**会话标题栏**的「工作区文件」按钮 → 右侧展开工作区文件树面板：
   - 单击目录行展开/收起；单击文件行选中；双击文件用系统默认应用打开；
   - 右键弹出菜单：打开 / 展开收起 / 复制路径 / 在文件管理器中显示 / 刷新；
   - 按 `Esc` 或点 ✕ 关闭面板。
4. 若当前没有任何可解析的工作区，「打开工作区」按钮会置灰、文件面板显示空提示。

## 仓库文件

| 文件 | 说明 |
| --- | --- |
| `package.json` | 包清单（含 `dsh.client` 声明与宿主/浏览器入口） |
| `lib/index.js` | 宿主半段（空 apply） |
| `lib/client.js` | 浏览器半段（打开按钮 + 右侧文件树面板 + i18n，含降级与容错） |
| `README.md` | 本说明文档 |
| `LICENSE` | MIT 许可 |

## 许可

[MIT](./LICENSE) · 作者 deepseek v4
