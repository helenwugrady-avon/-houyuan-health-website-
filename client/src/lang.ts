import { createContext, useContext } from "react";

/* Language switch: the whole site shows ONE language at a time.
   Default is Chinese (the site's main audience is in China); the visitor's
   choice is remembered in localStorage by the App root. `LANG` is a module
   mirror of the current choice so plain helper functions (outside React
   components) can pick text too; the App root keeps it in sync and holds
   the state, so switching re-renders the whole tree. */
export type Lang = "zh" | "en";

export let LANG: Lang = "zh";
export function setLANG(l: Lang) {
  LANG = l;
}

/** Pick the value for the current language (strings, or JSX fragments). */
export function T<X>(zh: X, en: X): X {
  return LANG === "zh" ? zh : en;
}

export const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "zh",
  setLang: () => {},
});

export function useLang() {
  return useContext(LangContext);
}
