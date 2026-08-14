// dsh-plugin-workspace-open — client face (built bundle format).
// Author: deepseek v4
//
// Registers two entry points that open the CURRENT session's workspace
// directory in the OS file manager via `ctx.workspaces.openPath(path)`:
//   - conversation.session.header.actions  (session header action row)
//   - sidebar.footer.action                (sidebar footer, above the Cordis panel)
// Includes zh/en i18n via the `locale` service and `open-workspace` namespace.

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
			'.dsh-ws-open--footer{width:100%;height:49px;border-radius:12px;padding:0 10px;font-size:14px;justify-content:flex-start;order:-1}',
			'.dsh-ws-open--footer.dsh-ws-open--rail{width:36px;height:36px;border-radius:50%;padding:0;justify-content:center;order:-1}',
			'div:has(> .dsh-ws-open--footer){flex-direction:column;gap:2px}'
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

		function translate(t, key, fallback) {
			return typeof t === "function" ? t(key) : fallback;
		}

		/**
		 * Client plugin body: register a session-header action and a sidebar footer
		 * action that open the current session's workspace directory through the
		 * gateway RPC `host.openPath` (Invoke-Item on Windows / open on macOS /
		 * xdg-open on Linux), exposed as `ctx.workspaces.openPath(path)`.
		 */
		function apply(ctx) {
			const locale = ctx.get("locale");
			if (locale !== undefined) {
				ctx.effect(function () {
					return locale.register("open-workspace", {
						zh: {
							openLabel: "打开工作区",
							ariaLabel: "在文件资源管理器中打开工作区"
						},
						en: {
							openLabel: "Open Workspace",
							ariaLabel: "Open workspace in file explorer"
						}
					});
				}, "workspace-open: dictionaries");
			}

			function useCurrentWorkspaceCwd(useSessions) {
				return useSessions(function (s) {
					const current = s.current;
					if (current === undefined) return undefined;
					const row = s.byId[current];
					return row === undefined ? undefined : row.cwd;
				});
			}

			function useOpenWorkspace(useSessions) {
				const cwd = useCurrentWorkspaceCwd(useSessions);
				const busyState = react.useState(false);
				const busy = busyState[0];
				const setBusy = busyState[1];
				const open = function () {
					if (cwd === undefined || busy) return;
					setBusy(true);
					ctx.workspaces.openPath(cwd).catch(function (err) {
						console.error("[workspace-open] openPath failed", err);
					}).finally(function () {
						setBusy(false);
					});
				};
				return { cwd: cwd, busy: busy, open: open };
			}

			function HeaderAction(props) {
				const aria = translate(props.t, "ariaLabel", "在文件资源管理器中打开工作区");
				const openLabel = translate(props.t, "openLabel", "打开工作区");
				const state = useOpenWorkspace(props.useSessions);
				const disabled = state.cwd === undefined || state.busy;
				return react.createElement("button", {
					type: "button",
					className: "dsh-ws-open",
					title: aria,
					"aria-label": aria,
					disabled: disabled,
					onClick: state.open
				}, folderIcon(), react.createElement("span", { className: "dsh-ws-open__label" }, openLabel));
			}

			function FooterAction(props) {
				const aria = translate(props.t, "ariaLabel", "在文件资源管理器中打开工作区");
				const openLabel = translate(props.t, "openLabel", "打开工作区");
				const state = useOpenWorkspace(props.useSessions);
				const disabled = state.cwd === undefined || state.busy;
				const rail = props.wide !== true;
				return react.createElement("button", {
					type: "button",
					className: rail ? "dsh-ws-open dsh-ws-open--footer dsh-ws-open--rail" : "dsh-ws-open dsh-ws-open--footer",
					title: aria,
					"aria-label": aria,
					disabled: disabled,
					onClick: state.open
				}, folderIcon(), rail ? null : react.createElement("span", { className: "dsh-ws-open__label" }, openLabel));
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
