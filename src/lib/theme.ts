export type Theme = "light" | "dark";
export function getTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}
export function setTheme(t: Theme) {
  document.documentElement.classList.toggle("dark", t === "dark");
  localStorage.setItem("theme", t);
}
export const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`;
