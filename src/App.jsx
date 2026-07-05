import { AnimatePresence, motion } from "framer-motion";
import FrameTable from "./components/FrameTable";
import PunishChecker from "./components/PunishChecker";
import { DATA } from "./data/shared";
import { usePersistedState } from "./hooks/usePersistedState";
import { LanguageProvider, useLanguage } from "./i18n/LanguageContext";

const TABS = [
  { id: "punish", key: "tabPunish" },
  { id: "frames", key: "tabFrames" },
];

function AppInner() {
  const { t, lang, setLang } = useLanguage();
  const [tab, setTab] = usePersistedState("sf6.tab", "punish");

  return (
    <>
      <header>
        <div className="header-top">
          <h1>
            {t("titlePre")}<span className="accent">{t("titleAccent")}</span>{t("titlePost")}
          </h1>
          <div className="lang-switch">
            <button className={lang === "ja" ? "active" : ""} onClick={() => setLang("ja")}>
              {t("langJa")}
            </button>
            <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>
              {t("langEn")}
            </button>
          </div>
        </div>
        <nav id="tabs">
          {TABS.map((tb) => (
            <button
              key={tb.id}
              className={`tab${tab === tb.id ? " active" : ""}`}
              onClick={() => setTab(tb.id)}
            >
              {t(tb.key)}
            </button>
          ))}
        </nav>
      </header>

      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {tab === "frames" ? <FrameTable /> : <PunishChecker />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer>
        <p>
          {t("footerSource")}
          <a href="https://github.com/D4RKONION/FAT" target="_blank" rel="noopener noreferrer">
            FAT - Frame Assistant Tool
          </a>
          {t("footerLicense")}{DATA.meta.updated}{t("footerUpdateMethod")}
          <code>py scripts/fetch_framedata.py</code>
        </p>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}
