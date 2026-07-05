import { createContext, useContext, useEffect } from "react";
import { usePersistedState } from "../hooks/usePersistedState";
import { t as translate } from "./strings";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = usePersistedState("sf6.lang", "ja");

  useEffect(() => {
    document.title = translate(lang, "docTitle");
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key) => translate(lang, key);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
