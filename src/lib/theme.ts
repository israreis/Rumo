export type Theme = "light" | "dark";

/** Status-bar colour of the installed app follows the page ground (linho / café). */
const BAR = { light: "#f3eee4", dark: "#1c1814" } as const;

export function getTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}
export function setTheme(t: Theme) {
  document.documentElement.classList.toggle("dark", t === "dark");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", BAR[t]);
  localStorage.setItem("theme", t);
}
export const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');document.addEventListener('DOMContentLoaded',function(){var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',d?'${BAR.dark}':'${BAR.light}')})}catch(e){}})()`;
