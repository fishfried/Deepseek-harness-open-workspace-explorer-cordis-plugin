/**
 * dsh-plugin-workspace-open, host face.
 *
 * Pure UI plugin: the empty apply exists so the plugin appears in the host
 * cordis.yml / Loader; the browser half ships via exports["./client"],
 * discovered through the package.json dsh.client declaration. The native
 * open action is served by the existing gateway RPC `host.openPath`
 * (@deepseek-ai/dsh-host-apiproxy), invoked client-side through
 * `ctx.workspaces.openPath(path)`.
 *
 * Author: deepseek v4
 */

/** Host plugin body — no host-side behavior for this surface plugin. */
function apply() {}

export { apply };
