import { NOTRANSLATE_CLASS } from "@/utils/constants/dom-labels"

// WXT prepends `:host { all: initial !important }` inside each isolated UI.
// These declarations must live after that reset to restore the zero-sized
// overlay geometry. Keep the host static so a host appended to the end of the
// page cannot become the containing block for absolutely positioned portals.
export const OVERLAY_SHADOW_ROOT_CSS = `
:host {
  display: block !important;
  height: 0 !important;
  overflow: visible !important;
  position: static !important;
  width: 0 !important;
}
`

export function insertShadowRootUIWrapperInto(container: HTMLElement, shadowHost: HTMLElement) {
  shadowHost.classList.add(NOTRANSLATE_CLASS)

  const wrapper = document.createElement("div")
  wrapper.className = `text-base antialiased font-sans text-foreground z-[2147483647] ${NOTRANSLATE_CLASS}`
  container.append(wrapper)

  return wrapper
}

/**
 * Move the UI host out of <body> and under <html>.
 *
 * Reader modes (SimpRead, for one) keep the same <body> but hide it, rebuild the
 * article into a sibling node under <html>, and drop whatever extensions had
 * injected into <body>. A host anchored to <html> survives that rebuild, and
 * stays visible while `body { display: none }` is in effect.
 */
export function moveShadowHostToDocumentRoot(shadowHost: HTMLElement) {
  const root = shadowHost.ownerDocument?.documentElement
  if (root && shadowHost.parentElement !== root) root.append(shadowHost)
}

/**
 * Re-attach a host that a page removed behind our back, keeping its shadow tree
 * (and so its React state) intact. Only a disconnected host is re-appended:
 * while a selection popup is inside a native <dialog> the host is connected but
 * not a child of <html>, and must be left alone.
 */
export function keepShadowHostConnected(shadowHost: HTMLElement): () => void {
  const root = shadowHost.ownerDocument?.documentElement
  if (!root) return () => {}

  let scheduled = false
  const reattach = () => {
    if (!shadowHost.isConnected) root.append(shadowHost)
  }
  const observer = new MutationObserver(() => {
    if (scheduled || shadowHost.isConnected) return
    scheduled = true
    // Mutations arrive in batches; re-checking once per batch is enough.
    queueMicrotask(() => {
      scheduled = false
      reattach()
    })
  })
  observer.observe(root, { childList: true, subtree: true })
  return () => observer.disconnect()
}

/** Keep an existing UI and its React state when a client router replaces <body>. */
export function reattachShadowHostOnBodySwap(shadowHost: HTMLElement): () => void {
  let currentBody = document.body
  const observer = new MutationObserver(() => {
    const nextBody = document.body
    if (!nextBody || nextBody === currentBody) return

    currentBody = nextBody
    if (shadowHost.parentElement !== nextBody) nextBody.append(shadowHost)
  })

  // Only direct children of <html> matter. Changes inside <body> cannot trigger this observer.
  observer.observe(document.documentElement, { childList: true })
  return () => observer.disconnect()
}
