// dsh-plugin-workspace-open — client face (built bundle format).
// Author: deepseek v4
//
// Registers two entry points that open the CURRENT session's workspace
// directory in the OS file manager via `ctx.workspaces.openPath(path)`:
//   - conversation.session.header.actions  (session header action row)
//   - sidebar.footer.action                (sidebar footer, above the Cordis panel)
// Includes zh/en i18n via the `locale` service and `open-workspace` namespace.
//
// Stability notes:
//   - Data comes exclusively from slot standard props (useSessions / useWorkspaces),
//     never from module-level runtime exports (those hooks do not exist there).
//   - The footer layout upgrade (full-width row above the Cordis panel) is gated
//     behind `@supports selector(:has(...))`; on browsers without `:has()` the
//     button degrades to a compact shrinkable control instead of overflowing.
//   - Every async failure is caught; a missing workspace only disables the button.

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
			'.dsh-ws-open__icon{display:inline-flex;flex:none}',
			'.dsh-ws-open__label{min-width:0;overflow:hidden;text-overflow:ellipsis}',
			'.dsh-ws-open--footer{height:49px;border-radius:12px;padding:0 10px;font-size:14px;order:-1;flex:0 1 auto;min-width:0;max-width:100%}',
			'.dsh-ws-open--footer.dsh-ws-open--rail{width:36px;height:36px;border-radius:50%;padding:0;justify-content:center;flex:none}',
			'@supports selector(:has(> .dsh-ws-open--footer)){',
			'  div:has(> .dsh-ws-open--footer){flex-direction:column;gap:2px}',
			'  .dsh-ws-open--footer{width:100%;justify-content:flex-start}',
			'}'
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
		const FALLBACK_ZH = {
			openLabel: "打开工作区",
			ariaLabel: "在文件资源管理器中打开工作区"
		};
		const FALLBACK_EN = {
			openLabel: "Open Workspace",
			ariaLabel: "Open workspace in file explorer"
		};

		function folderIcon() {
			return react.createElement("svg", {
				width: 16,
				height: 16,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.4,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": true,
				className: "dsh-ws-open__icon"
			}, react.createElement("path", {
				d: "M1.75 4.25c0-.83.67-1.5 1.5-1.5h2.25l1.5 2h5.75c.83 0 1.5.67 1.5 1.5v5.5c0 .83-.67 1.5-1.5 1.5H3.25c-.83 0-1.5-.67-1.5-1.5v-7.5z"
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

		/**
		 * Client plugin body: register a session-header action and a sidebar footer
		 * action that open the current workspace directory through the gateway RPC
		 * `host.openPath` (Invoke-Item on Windows / open on macOS / xdg-open on
		 * Linux), exposed as `ctx.workspaces.openPath(path)`.
		 */
		function apply(ctx) {
			const locale = ctx.get("locale");
			if (locale !== undefined) {
				try {
					ctx.effect(function () {
						return locale.register("open-workspace", {
							zh: FALLBACK_ZH,
							en: FALLBACK_EN
						});
					}, "workspace-open: dictionaries");
				} catch (error) {
					console.error("[workspace-open] locale registration failed", error);
				}
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
				const aria = text(props.t, "ariaLabel", FALLBACK_ZH.ariaLabel, FALLBACK_EN.ariaLabel);
				const openLabel = text(props.t, "openLabel", FALLBACK_ZH.openLabel, FALLBACK_EN.openLabel);
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

			ctx.slots.inject("conversation.session.header.actions", function () {
				return ctx.slots.register({
					name: "conversation.session.header.actions",
					id: "workspace-open",
					order: 30,
					locale: "open-workspace"
				}, HeaderAction);
			});

			ctx.slots.inject("sidebar.footer.action", function () {
				return ctx.slots.register({
					name: "sidebar.footer.action",
					id: "workspace-open",
					order: -1,
					locale: "open-workspace"
				}, FooterAction);
			});
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
