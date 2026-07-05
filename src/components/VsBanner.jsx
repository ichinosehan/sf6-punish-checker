import { AnimatePresence, motion } from "framer-motion";
import { charDisplayName } from "../data/shared";
import { useLanguage } from "../i18n/LanguageContext";
import CharIcon from "./CharIcon";

function VsSide({ char, role }) {
  const { lang } = useLanguage();
  return (
    <div className="vs-side">
      <AnimatePresence mode="wait">
        <motion.div
          key={char}
          initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.6, rotate: 8 }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
        >
          <CharIcon char={char} className="vs-icon" />
        </motion.div>
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <motion.div
          key={char}
          className="vs-name"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {charDisplayName(char, lang)}
        </motion.div>
      </AnimatePresence>
      <div className="vs-role">{role}</div>
    </div>
  );
}

export default function VsBanner({ self, opp }) {
  const { t } = useLanguage();
  return (
    <div className="vs-banner">
      <VsSide char={self} role={t("selfRole")} />
      <motion.div
        className="vs-text"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.05 }}
      >
        VS
      </motion.div>
      <VsSide char={opp} role={t("oppRole")} />
    </div>
  );
}
