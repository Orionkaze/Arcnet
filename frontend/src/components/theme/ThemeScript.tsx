/**
 * Applies the saved theme before first paint.
 *
 * This runs synchronously in <head>, so the correct `data-theme` is on <html>
 * by the time anything renders — without it the app would paint dark and then
 * snap to light on hydration (flash of wrong theme).
 *
 * Server component: no "use client", the script is inlined into the HTML.
 */
export function ThemeScript() {
  const script = `(function(){try{var t=localStorage.getItem("caliber-theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
