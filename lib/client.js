// dsh-plugin-workspace-open — client face (built bundle format).
// Author: deepseek v4
//
// Features:
//   1. "Open Workspace" buttons (session header + sidebar footer) that open the
//      current workspace directory in the OS file manager via
//      `ctx.workspaces.openPath(path)`.
//   2. Right-side workspace file panel (shell.overlay drawer): tree browsing of
//      the workspace and its sub-project structure via `ctx.workspaces.listDirectory`,
//      with lazy expand/collapse, file/folder icons, right-click menu
//      (open / copy path / reveal / refresh), zh/en i18n.
//
// Stability notes:
//   - Data comes exclusively from slot standard props (useSessions / useWorkspaces),
//     never from module-level runtime exports (those hooks do not exist there).
//   - The footer layout upgrade (full-width row above the Cordis panel) is gated
//     behind `@supports selector(:has(...))`; on browsers without `:has()` the
//     button degrades to a compact shrinkable control instead of overflowing.
//   - Every async failure is caught; a missing workspace only disables the button
//     or shows an empty panel.

window.__ModuleLoader__.load({
	id: "dsh-plugin-workspace-open",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const react = require("react");

		//#region dsh-plugin-workspace-open styles
		const css = [
			'.dsh-ws-open{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 8px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;line-height:1;white-space:nowrap;cursor:pointer;flex:none}',
			'.dsh-ws-open:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,0.14));color:var(--dsw-alias-label-primary)}',
			'.dsh-ws-open:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
			'.dsh-ws-open:disabled{opacity:0.45;cursor:default}',
			'.dsh-ws-open--active{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,0.16))}',
			'.dsh-ws-open__icon{display:inline-flex;flex:none}',
			'.dsh-ws-open__label{min-width:0;overflow:hidden;text-overflow:ellipsis}',
			'.dsh-ws-open--footer{height:49px;border-radius:12px;padding:0 10px;font-size:14px;order:-1;flex:0 1 auto;min-width:0;max-width:100%}',
			'.dsh-ws-open--footer.dsh-ws-open--rail{width:36px;height:36px;border-radius:50%;padding:0;justify-content:center;flex:none}',
			'@supports selector(:has(> .dsh-ws-open--footer)){',
			'  div:has(> .dsh-ws-open--footer){flex-direction:column;gap:2px}',
			'  .dsh-ws-open--footer{width:100%;justify-content:flex-start}',
			'}',
			'.wf-drawer{position:fixed;top:0;right:0;bottom:0;width:320px;max-width:85vw;z-index:2500;display:flex;flex-direction:column;background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-overlay));border-left:1px solid var(--dsw-alias-border-l2);box-shadow:-8px 0 24px rgba(0,0,0,0.18);pointer-events:auto}',
			'.wf-drawer-head{display:flex;align-items:center;justify-content:space-between;flex:none;height:40px;padding:0 10px 0 14px;border-bottom:1px solid var(--dsw-alias-border-l1)}',
			'.wf-drawer-title{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
			'.wf-drawer-close{cursor:pointer;width:26px;height:26px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:13px;flex:none}',
			'.wf-drawer-close:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,0.14));color:var(--dsw-alias-label-primary)}',
			'.wf-rootline{flex:none;padding:6px 14px;font-size:11px;color:var(--dsw-alias-label-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border-bottom:1px solid var(--dsw-alias-border-l1)}',
			'.wf-tree{flex:1;min-height:0;overflow:auto;padding:6px 6px 10px}',
			'.wf-trow{display:flex;align-items:center;gap:5px;height:26px;padding-right:8px;border-radius:6px;cursor:pointer;color:var(--dsw-alias-label-secondary);font-size:13px;white-space:nowrap;user-select:none}',
			'.wf-trow:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,0.12))}',
			'.wf-trow.wf-selected{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,0.2));color:var(--dsw-alias-label-primary)}',
			'.wf-trow.wf-hidden{opacity:0.55}',
			'.wf-chevron{display:inline-flex;flex:none;width:14px;height:14px;padding:0;border:0;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;align-items:center;justify-content:center;border-radius:4px}',
			'.wf-chevron:hover{color:var(--dsw-alias-label-primary)}',
			'.wf-chevron svg{transition:transform .12s ease}',
			'.wf-chevron-open svg{transform:rotate(90deg)}',
			'.wf-chevron-none{visibility:hidden}',
			'.wf-tic{display:inline-flex;flex:none}',
			'.wf-tname{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}',
			'.wf-hint{flex:none;font-size:11px;color:var(--dsw-alias-label-tertiary)}',
			'.wf-empty{display:flex;align-items:center;justify-content:center;min-height:60px;padding:12px;font-size:12px;color:var(--dsw-alias-label-tertiary);text-align:center}',
			'.wf-error{display:flex;align-items:center;justify-content:center;min-height:60px;padding:12px;font-size:12px;color:var(--dsw-alias-state-warn-primary,var(--dsw-alias-label-secondary));text-align:center;cursor:pointer}',
			'.wf-hintline{flex:none;padding:4px 14px 6px;font-size:11px;color:var(--dsw-alias-label-tertiary);border-top:1px solid var(--dsw-alias-border-l1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
			'.wf-menu-backdrop{position:fixed;inset:0;z-index:2550;pointer-events:auto}',
			'.wf-menu{position:fixed;z-index:2600;min-width:168px;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:4px;box-shadow:0 8px 24px rgba(0,0,0,0.25);pointer-events:auto}',
			'.wf-menu-item{padding:6px 10px;border-radius:6px;font-size:13px;cursor:pointer;color:var(--dsw-alias-label-primary);white-space:nowrap}',
			'.wf-menu-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,0.14))}'
		].join('\n');
		const tagId = "dsh-plugin-workspace-open/workspace-open.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion

		/** Required services (cordis fiber inject). */
		const inject = ["slots", "workspaces"];

		/** zh/en fallback dictionaries (used when the locale service is absent). */
		const DICT_ZH = {
			openLabel: "打开工作区",
			ariaLabel: "在文件资源管理器中打开工作区",
			filesLabel: "工作区文件",
			filesAria: "打开/关闭工作区文件面板",
			panelTitle: "工作区文件",
			panelEmpty: "没有可浏览的工作区",
			panelLoading: "加载中…",
			panelRetry: "加载失败，点击重试",
			close: "关闭",
			menuOpen: "打开",
			menuExpand: "展开/收起",
			menuCopy: "复制路径",
			menuReveal: "在文件管理器中显示",
			menuRefresh: "刷新",
			hintLine: "单击展开/选择 · 双击打开 · 右键菜单"
		};
		const DICT_EN = {
			openLabel: "Open Workspace",
			ariaLabel: "Open workspace in file explorer",
			filesLabel: "Files",
			filesAria: "Toggle workspace files panel",
			panelTitle: "Workspace Files",
			panelEmpty: "No workspace to browse",
			panelLoading: "Loading…",
			panelRetry: "Failed to load, click to retry",
			close: "Close",
			menuOpen: "Open",
			menuExpand: "Expand/Collapse",
			menuCopy: "Copy path",
			menuReveal: "Show in file manager",
			menuRefresh: "Refresh",
			hintLine: "Click to expand/select · Double-click to open · Right-click menu"
		};

		function folderIcon() {
			return react.createElement("svg", {
				width: 14,
				height: 14,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.3,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": true
			}, react.createElement("path", {
				d: "M1.75 4.25c0-.83.67-1.5 1.5-1.5h2.25l1.5 2h5.75c.83 0 1.5.67 1.5 1.5v5.5c0 .83-.67 1.5-1.5 1.5H3.25c-.83 0-1.5-.67-1.5-1.5v-7.5z"
			}));
		}

		function fileIcon() {
			return react.createElement("svg", {
				width: 14,
				height: 14,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.3,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": true
			}, react.createElement("path", {
				d: "M4 1.5h5l3 3v10H4z"
			}), react.createElement("path", {
				d: "M9 1.5v3h3"
			}));
		}

		function chevronIcon() {
			return react.createElement("svg", {
				width: 10,
				height: 10,
				viewBox: "0 0 10 10",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.4,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": true
			}, react.createElement("path", {
				d: "M3.5 2l3 3-3 3"
			}));
		}

		function filesToggleIcon() {
			return react.createElement("svg", {
				width: 14,
				height: 14,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.4,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": true
			}, react.createElement("path", {
				d: "M2.5 3.5h11"
			}), react.createElement("path", {
				d: "M2.5 8h7.5"
			}), react.createElement("path", {
				d: "M2.5 12.5h4.5"
			}));
		}

		function text(t, key, fallbackZh, fallbackEn) {
			if (typeof t !== "function") return fallbackZh;
			const value = t(key);
			return typeof value === "string" && value.length > 0 ? value : fallbackZh;
		}

		/**
		 * Resolve the path to open. Preference order:
		 *   1. the workspace that accounts the current session (canonical path);
		 *   2. the most recently active workspace;
		 *   3. the current session's cwd.
		 * Returns undefined when nothing resolvable exists (button disables).
		 */
		function resolveWorkspacePath(current, currentCwd, items, recentWorkspaceId) {
			let path;
			if (current !== undefined) {
				const owner = items.find(function (w) {
					return w.sessionIds.includes(current);
				});
				if (owner !== undefined) path = owner.path;
			}
			if (path === undefined && recentWorkspaceId !== undefined) {
				const recent = items.find(function (w) {
					return w.workspaceId === recentWorkspaceId;
				});
				if (recent !== undefined) path = recent.path;
			}
			if (path === undefined) path = currentCwd;
			return path;
		}

		/** File/directory guess by name; corrected lazily when a listing fails. */
		function guessKind(name) {
			if (typeof name !== "string" || name.length === 0) return "file";
			if (name.startsWith(".")) return name.slice(1).indexOf(".") >= 0 ? "file" : "dir";
			return name.indexOf(".") >= 0 ? "file" : "dir";
		}

		/** Shared drawer open state: the header toggle and the overlay drawer sync through it. */
		const drawerStore = (function () {
			let open = false;
			const listeners = new Set();
			return {
				getOpen: function () {
					return open;
				},
				setOpen: function (value) {
					open = !!value;
					for (const fn of [...listeners]) fn();
				},
				subscribe: function (fn) {
					listeners.add(fn);
					return function () {
						listeners.delete(fn);
					};
				}
			};
		})();

		/**
		 * Client plugin body.
		 */
		function apply(ctx) {
			const locale = ctx.get("locale");
			if (locale !== undefined) {
				try {
					ctx.effect(function () {
						return locale.register("open-workspace", {
							zh: DICT_ZH,
							en: DICT_EN
						});
					}, "workspace-open: dictionaries");
				} catch (error) {
					console.error("[workspace-open] locale registration failed", error);
				}
			}

			function openPath(path) {
				Promise.resolve(ctx.workspaces.openPath(path)).catch(function (error) {
					console.error("[workspace-open] openPath failed", error);
				});
			}

			function useOpenWorkspace(props) {
				const current = props.useSessions(function (s) {
					return s.current;
				});
				const currentCwd = props.useSessions(function (s) {
					if (s.current === undefined) return undefined;
					const row = s.byId[s.current];
					return row === undefined ? undefined : row.cwd;
				});
				const items = props.useWorkspaces(function (s) {
					return s.items;
				});
				const recentWorkspaceId = props.useWorkspaces(function (s) {
					return s.recentWorkspaceId;
				});
				const path = resolveWorkspacePath(current, currentCwd, items, recentWorkspaceId);
				const busyState = react.useState(false);
				const busy = busyState[0];
				const setBusy = busyState[1];
				const open = function () {
					if (path === undefined || busy) return;
					setBusy(true);
					Promise.resolve(ctx.workspaces.openPath(path)).then(function () {
						setBusy(false);
					}, function (error) {
						setBusy(false);
						console.error("[workspace-open] openPath failed", error);
					});
				};
				return { path: path, busy: busy, open: open };
			}

			function renderButton(props, footer, rail) {
				const aria = text(props.t, "ariaLabel", DICT_ZH.ariaLabel, DICT_EN.ariaLabel);
				const openLabel = text(props.t, "openLabel", DICT_ZH.openLabel, DICT_EN.openLabel);
				const state = useOpenWorkspace(props);
				const disabled = state.path === undefined || state.busy;
				const className = footer
					? rail ? "dsh-ws-open dsh-ws-open--footer dsh-ws-open--rail" : "dsh-ws-open dsh-ws-open--footer"
					: "dsh-ws-open";
				return react.createElement("button", {
					type: "button",
					className: className,
					title: aria,
					"aria-label": aria,
					disabled: disabled,
					onClick: state.open
				}, folderIcon(), footer && rail ? null : react.createElement("span", { className: "dsh-ws-open__label" }, openLabel));
			}

			function HeaderAction(props) {
				return renderButton(props, false, false);
			}

			function FooterAction(props) {
				return renderButton(props, true, props.wide !== true);
			}

			function HeaderFilesToggle(props) {
				const open = react.useSyncExternalStore(drawerStore.subscribe, drawerStore.getOpen);
				const label = text(props.t, "filesLabel", DICT_ZH.filesLabel, DICT_EN.filesLabel);
				const aria = text(props.t, "filesAria", DICT_ZH.filesAria, DICT_EN.filesAria);
				return react.createElement("button", {
					type: "button",
					className: "dsh-ws-open" + (open ? " dsh-ws-open--active" : ""),
					title: aria,
					"aria-label": aria,
					"aria-pressed": open,
					onClick: function () {
						drawerStore.setOpen(!open);
					}
				}, filesToggleIcon(), react.createElement("span", { className: "dsh-ws-open__label" }, label));
			}

			function FilesDrawer(props) {
				const open = react.useSyncExternalStore(drawerStore.subscribe, drawerStore.getOpen);
				const t = props.t;
				const current = props.useSessions(function (s) {
					return s.current;
				});
				const currentCwd = props.useSessions(function (s) {
					if (s.current === undefined) return undefined;
					const row = s.byId[s.current];
					return row === undefined ? undefined : row.cwd;
				});
				const items = props.useWorkspaces(function (s) {
					return s.items;
				});
				const recentWorkspaceId = props.useWorkspaces(function (s) {
					return s.recentWorkspaceId;
				});
				const root = resolveWorkspacePath(current, currentCwd, items, recentWorkspaceId);

				const expandedState = react.useState({});
				const expanded = expandedState[0];
				const setExpanded = expandedState[1];
				const childrenState = react.useState({});
				const children = childrenState[0];
				const setChildren = childrenState[1];
				const kindsState = react.useState({});
				const kinds = kindsState[0];
				const setKinds = kindsState[1];
				const loadingState = react.useState({});
				const loading = loadingState[0];
				const setLoading = loadingState[1];
				const errorsState = react.useState({});
				const errors = errorsState[0];
				const setErrors = errorsState[1];
				const selectedState = react.useState(null);
				const selected = selectedState[0];
				const setSelected = selectedState[1];
				const menuState = react.useState(null);
				const menu = menuState[0];
				const setMenu = menuState[1];

				const stateRef = react.useRef({ expanded: expanded, children: children, kinds: kinds, loading: loading });
				stateRef.current = { expanded: expanded, children: children, kinds: kinds, loading: loading };

				const loadDir = function (path) {
					const st = stateRef.current;
					if (st.loading[path] || st.children[path] !== undefined) return;
					setLoading(function (l) {
						return { ...l, [path]: true };
					});
					ctx.workspaces.listDirectory(path).then(function (res) {
						setChildren(function (c) {
							return { ...c, [path]: res.entries };
						});
						setKinds(function (k) {
							return { ...k, [path]: "dir" };
						});
						setErrors(function (e) {
							const n = { ...e };
							delete n[path];
							return n;
						});
						setLoading(function (l) {
							return { ...l, [path]: false };
						});
					}, function (error) {
						setKinds(function (k) {
							return { ...k, [path]: "file" };
						});
						setExpanded(function (e) {
							const n = { ...e };
							delete n[path];
							return n;
						});
						setErrors(function (e) {
							return { ...e, [path]: String((error && error.message) || error) };
						});
						setLoading(function (l) {
							return { ...l, [path]: false };
						});
					});
				};

				const toggle = function (path) {
					if (expanded[path]) {
						setExpanded(function (e) {
							const n = { ...e };
							delete n[path];
							return n;
						});
						return;
					}
					setExpanded(function (e) {
						return { ...e, [path]: true };
					});
					loadDir(path);
				};

				const refresh = function (path) {
					setChildren(function (c) {
						const n = { ...c };
						delete n[path];
						return n;
					});
					setKinds(function (k) {
						const n = { ...k };
						delete n[path];
						return n;
					});
					loadDir(path);
				};

				react.useEffect(function () {
					if (!open || root === undefined) return;
					loadDir(root);
				}, [open, root]);

				react.useEffect(function () {
					if (!open) return;
					const onKey = function (e) {
						if (e.key === "Escape") {
							setMenu(null);
							drawerStore.setOpen(false);
						}
					};
					window.addEventListener("keydown", onKey);
					return function () {
						window.removeEventListener("keydown", onKey);
					};
				}, [open]);

				if (!open) return null;

				const panelTitle = text(t, "panelTitle", DICT_ZH.panelTitle, DICT_EN.panelTitle);
				const panelEmpty = text(t, "panelEmpty", DICT_ZH.panelEmpty, DICT_EN.panelEmpty);
				const panelLoading = text(t, "panelLoading", DICT_ZH.panelLoading, DICT_EN.panelLoading);
				const panelRetry = text(t, "panelRetry", DICT_ZH.panelRetry, DICT_EN.panelRetry);
				const closeLabel = text(t, "close", DICT_ZH.close, DICT_EN.close);
				const hintLine = text(t, "hintLine", DICT_ZH.hintLine, DICT_EN.hintLine);
				const menuItems = menu
					? menu.kind === "dir"
						? [
								{ key: "toggle", label: text(t, "menuExpand", DICT_ZH.menuExpand, DICT_EN.menuExpand) },
								{ key: "copy", label: text(t, "menuCopy", DICT_ZH.menuCopy, DICT_EN.menuCopy) },
								{ key: "reveal", label: text(t, "menuReveal", DICT_ZH.menuReveal, DICT_EN.menuReveal) },
								{ key: "refresh", label: text(t, "menuRefresh", DICT_ZH.menuRefresh, DICT_EN.menuRefresh) }
							]
						: [
								{ key: "open", label: text(t, "menuOpen", DICT_ZH.menuOpen, DICT_EN.menuOpen) },
								{ key: "copy", label: text(t, "menuCopy", DICT_ZH.menuCopy, DICT_EN.menuCopy) },
								{ key: "reveal", label: text(t, "menuReveal", DICT_ZH.menuReveal, DICT_EN.menuReveal) },
								{ key: "refresh", label: text(t, "menuRefresh", DICT_ZH.menuRefresh, DICT_EN.menuRefresh) }
							]
					: [];

				const copyPath = function (path) {
					try {
						if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
							navigator.clipboard.writeText(path).catch(function () {});
						}
					} catch (error) {
						console.error("[workspace-open] copy failed", error);
					}
				};

				const runMenu = function (item) {
					const m = menu;
					setMenu(null);
					if (!m) return;
					if (item.key === "toggle") toggle(m.path);
					else if (item.key === "open") openPath(m.path);
					else if (item.key === "copy") copyPath(m.path);
					else if (item.key === "reveal") openPath(m.path);
					else if (item.key === "refresh") refresh(m.path);
				};

				const renderRows = function (path, depth) {
					const list = children[path] || [];
					const rows = [];
					for (let i = 0; i < list.length; i++) {
						const entry = list[i];
						const kind = kinds[entry.path] || guessKind(entry.name);
						const isDir = kind === "dir";
						const isOpen = !!expanded[entry.path];
						const isLoading = !!loading[entry.path];
						const isSel = selected === entry.path;
						const rowChildren = [
							isDir
								? react.createElement("button", {
										type: "button",
										tabIndex: -1,
										"aria-hidden": true,
										className: "wf-chevron" + (isOpen ? " wf-chevron-open" : ""),
										onClick: function (e) {
											e.stopPropagation();
											toggle(entry.path);
										}
									}, chevronIcon())
								: react.createElement("span", { className: "wf-chevron wf-chevron-none" }),
							react.createElement("span", { className: "wf-tic" }, isDir ? folderIcon() : fileIcon()),
							react.createElement("span", { className: "wf-tname", title: entry.path }, entry.name),
							isLoading ? react.createElement("span", { className: "wf-hint" }, "…") : null
						];
						rows.push(react.createElement("div", {
							key: entry.path,
							className: "wf-trow" + (isSel ? " wf-selected" : "") + (entry.hidden ? " wf-hidden" : ""),
							style: { paddingLeft: (6 + depth * 14) + "px" },
							onClick: function () {
								setSelected(entry.path);
								if (isDir) toggle(entry.path);
							},
							onDoubleClick: function () {
								if (!isDir) openPath(entry.path);
							},
							onContextMenu: function (e) {
								e.preventDefault();
								setSelected(entry.path);
								setMenu({ x: e.clientX, y: e.clientY, path: entry.path, kind: kind, name: entry.name });
							}
						}, rowChildren));
						if (isDir && isOpen && children[entry.path] !== undefined) rows.push(renderRows(entry.path, depth + 1));
					}
					return rows;
				};

				let body;
				if (root === undefined) {
					body = react.createElement("div", { className: "wf-empty" }, panelEmpty);
				} else if (children[root] === undefined) {
					body = errors[root] !== undefined
						? react.createElement("div", { className: "wf-error", title: errors[root], onClick: function () { refresh(root); } }, panelRetry)
						: react.createElement("div", { className: "wf-empty" }, panelLoading);
				} else {
					body = react.createElement("div", { className: "wf-tree" }, renderRows(root, 0));
				}

				return react.createElement("div", { className: "wf-drawer" },
					react.createElement("div", { className: "wf-drawer-head" },
						react.createElement("span", { className: "wf-drawer-title" }, panelTitle),
						react.createElement("button", {
							type: "button",
							className: "wf-drawer-close",
							title: closeLabel,
							"aria-label": closeLabel,
							onClick: function () {
								drawerStore.setOpen(false);
							}
						}, "✕")
					),
					root === undefined ? null : react.createElement("div", { className: "wf-rootline", title: root }, root),
					body,
					react.createElement("div", { className: "wf-hintline" }, hintLine),
					menu ? react.createElement(react.Fragment, null,
						react.createElement("div", {
							className: "wf-menu-backdrop",
							onClick: function () { setMenu(null); },
							onContextMenu: function (e) { e.preventDefault(); setMenu(null); }
						}),
						react.createElement("div", {
							className: "wf-menu",
							style: {
								left: Math.min(menu.x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 180),
								top: Math.min(menu.y, (typeof window !== "undefined" ? window.innerHeight : 800) - menuItems.length * 30 - 24)
							}
						}, menuItems.map(function (item) {
							return react.createElement("div", {
								key: item.key,
								className: "wf-menu-item",
								onClick: function () { runMenu(item); }
							}, item.label);
						}))
					) : null
				);
			}

			ctx.slots.inject("conversation.session.header.actions", function () {
				return ctx.slots.register({
					name: "conversation.session.header.actions",
					id: "workspace-open",
					order: 30,
					locale: "open-workspace"
				}, HeaderAction);
			});

			ctx.slots.inject("conversation.session.header.actions", function () {
				return ctx.slots.register({
					name: "conversation.session.header.actions",
					id: "workspace-files",
					order: 40,
					locale: "open-workspace"
				}, HeaderFilesToggle);
			});

			ctx.slots.inject("sidebar.footer.action", function () {
				return ctx.slots.register({
					name: "sidebar.footer.action",
					id: "workspace-open",
					order: -1,
					locale: "open-workspace"
				}, FooterAction);
			});

			ctx.slots.inject("shell.overlay", function () {
				return ctx.slots.register({
					name: "shell.overlay",
					id: "workspace-files-drawer",
					order: 10,
					locale: "open-workspace"
				}, FilesDrawer);
			});
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
