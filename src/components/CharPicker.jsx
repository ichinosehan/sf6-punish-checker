import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CHAR_NAMES, charDisplayName } from "../data/shared";
import { useLanguage } from "../i18n/LanguageContext";
import CharIcon from "./CharIcon";

export default function CharPicker({ id, value, onChange }) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="char-picker" ref={ref}>
      <button id={id} type="button" className="cp-button" onClick={() => setOpen((v) => !v)}>
        <CharIcon char={value} className="cp-current-icon" />
        <span>{charDisplayName(value, lang)}</span>
        <span className="cp-caret">▾</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="cp-pop"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
          >
            {CHAR_NAMES.map((c) => (
              <button
                key={c}
                type="button"
                className={`cp-item${c === value ? " active" : ""}`}
                title={charDisplayName(c, lang)}
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
              >
                <CharIcon char={c} className="cp-item-icon" />
                <span className="cp-item-name">{charDisplayName(c, lang)}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
