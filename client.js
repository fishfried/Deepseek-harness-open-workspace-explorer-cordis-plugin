// Open Workspace in File Explorer — DeepSeek Harness 动态 Cordis 插件（Client 端）
// 作者：deepseek v4
//
// 用途：在会话标题栏和侧边栏底部各加一个「打开工作区」按钮，
//       一键用系统文件资源管理器打开当前工作区文件夹。
// 特性：中英文 i18n 随界面语言自动切换；底部按钮靠左、占满整行、位于 Cordis 面板上方。
//
// 使用方法：在 DSH Web GUI 的 Cordis 面板中新建插件（idPrefix 建议 wsopen），
//           把本文件内容原样粘贴到「Client 代码」区域，然后 Run 并在界面点勾授权。
//           本文件内容即 cordis_define 的 code.client 值（函数体）。

return {
  apply(ctx) {
    const slots = ctx.get('slots')
    const workspaces = ctx.get('workspaces')
    const locale = ctx.get('locale')
    if (slots === undefined || workspaces === undefined) return

    if (locale !== undefined) {
      ctx.effect(function () {
        return locale.register('open-workspace', {
          zh: {
            openLabel: '打开工作区',
            ariaLabel: '在文件资源管理器中打开工作区'
          },
          en: {
            openLabel: 'Open Workspace',
            ariaLabel: 'Open workspace in file explorer'
          }
        })
      }, 'open-workspace: dictionaries')
    }

    const disposeStyles = styles.insert([
      '.dsh-ws-open{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 8px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;line-height:1;white-space:nowrap;cursor:pointer;flex:none}',
      '.dsh-ws-open:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,0.14));color:var(--dsw-alias-label-primary)}',
      '.dsh-ws-open:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.dsh-ws-open:disabled{opacity:0.45;cursor:default}',
      '.dsh-ws-open__icon{display:inline-flex;flex:none}',
      '.dsh-ws-open--footer{width:100%;height:49px;border-radius:12px;padding:0 10px;font-size:14px;justify-content:flex-start;order:-1}',
      '.dsh-ws-open--footer.dsh-ws-open--rail{width:36px;height:36px;border-radius:50%;padding:0;justify-content:center;order:-1}',
      'div:has(> .dsh-ws-open--footer){flex-direction:column;gap:2px}'
    ].join('\n'))

    function folderIcon() {
      return React.createElement('svg', {
        width: 16,
        height: 16,
        viewBox: '0 0 16 16',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.4,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        className: 'dsh-ws-open__icon'
      }, React.createElement('path', {
        d: 'M1.75 4.25c0-.83.67-1.5 1.5-1.5h2.25l1.5 2h5.75c.83 0 1.5.67 1.5 1.5v5.5c0 .83-.67 1.5-1.5 1.5H3.25c-.83 0-1.5-.67-1.5-1.5v-7.5z'
      }))
    }

    function useOpenWorkspace(useSessions) {
      const cwd = useSessions(function (s) {
        const current = s.current
        if (current === undefined) return undefined
        const row = s.byId[current]
        return row === undefined ? undefined : row.cwd
      })
      const busyState = React.useState(false)
      const busy = busyState[0]
      const setBusy = busyState[1]
      const open = function () {
        if (cwd === undefined || busy) return
        setBusy(true)
        workspaces.openPath(cwd).catch(function (err) {
          console.error('open-workspace: openPath failed', err)
        }).finally(function () {
          setBusy(false)
        })
      }
      return { cwd: cwd, busy: busy, open: open }
    }

    function translate(t, key, fallback) {
      return typeof t === 'function' ? t(key) : fallback
    }

    function HeaderAction(props) {
      const aria = translate(props.t, 'ariaLabel', '在文件资源管理器中打开工作区')
      const openLabel = translate(props.t, 'openLabel', '打开工作区')
      const state = useOpenWorkspace(props.useSessions)
      const disabled = state.cwd === undefined || state.busy
      return React.createElement('button', {
        type: 'button',
        className: 'dsh-ws-open',
        title: aria,
        'aria-label': aria,
        disabled: disabled,
        onClick: state.open
      }, folderIcon(), React.createElement('span', { className: 'dsh-ws-open__label' }, openLabel))
    }

    function FooterAction(props) {
      const aria = translate(props.t, 'ariaLabel', '在文件资源管理器中打开工作区')
      const openLabel = translate(props.t, 'openLabel', '打开工作区')
      const state = useOpenWorkspace(props.useSessions)
      const disabled = state.cwd === undefined || state.busy
      const rail = props.wide !== true
      return React.createElement('button', {
        type: 'button',
        className: rail ? 'dsh-ws-open dsh-ws-open--footer dsh-ws-open--rail' : 'dsh-ws-open dsh-ws-open--footer',
        title: aria,
        'aria-label': aria,
        disabled: disabled,
        onClick: state.open
      }, folderIcon(), rail ? null : React.createElement('span', { className: 'dsh-ws-open__label' }, openLabel))
    }

    slots.inject('conversation.session.header.actions', function () {
      return slots.register({
        name: 'conversation.session.header.actions',
        id: 'open-workspace',
        order: 30,
        locale: 'open-workspace'
      }, HeaderAction)
    })

    slots.inject('sidebar.footer.action', function () {
      return slots.register({
        name: 'sidebar.footer.action',
        id: 'open-workspace',
        order: -1,
        locale: 'open-workspace'
      }, FooterAction)
    })
  }
}
