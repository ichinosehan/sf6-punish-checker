import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { CHARS, CHAR_NAMES, charDisplayName, fastestPunisher } from "../data/shared";
import { usePersistedBool, usePersistedState } from "../hooks/usePersistedState";
import { noteKey, usePunishNotes } from "../hooks/usePunishNotes";
import { countText } from "../i18n/strings";
import { useLanguage } from "../i18n/LanguageContext";
import CharPicker from "./CharPicker";
import PunishAccordionItem from "./PunishAccordionItem";
import VsBanner from "./VsBanner";

export default function PunishChecker() {
  const { t, lang } = useLanguage();
  const [opp, setOpp] = usePersistedState("sf6.pnOpp", CHAR_NAMES[0]);
  const [self, setSelf] = usePersistedState("sf6.pnSelf", CHAR_NAMES[1]);
  const [search, setSearch] = useState("");
  const [showSmall, setShowSmall] = usePersistedBool("sf6.pnSmall", false);
  const [boActive, setBoActive] = usePersistedBool("sf6.pnBo", false);
  const [starOnly, setStarOnly] = usePersistedBool("sf6.pnStarOnly", false);
  const [notes, updateNote] = usePunishNotes();

  const oppC = CHARS[opp] ? opp : CHAR_NAMES[0];
  const selfC = CHARS[self] ? self : CHAR_NAMES[1];
  const boPenalty = boActive ? 4 : 0; // バーンアウト中はガード硬直+4F＝猶予-4F

  const targets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CHARS[oppC].moves
      .filter((m) => m.ob !== null && m.ob < 0)
      .filter((m) => m.cat !== "taunt" && !m.n.startsWith("Drive Impact"))
      .filter((m) => showSmall || -m.ob - boPenalty > 3)
      .filter((m) => !starOnly || notes[noteKey(selfC, oppC, m)]?.pick)
      .filter((m) => !q || (m.n + " " + (m.j || "") + " " + m.i).toLowerCase().includes(q))
      .sort((a, b) => b.ob - a.ob); // 不利が小さい順（大幅マイナスは自明なので後ろへ）
  }, [oppC, selfC, search, showSmall, boPenalty, starOnly, notes]);

  const fastest = useMemo(() => fastestPunisher(selfC), [selfC]);
  const withPunish = targets.filter((m) => -m.ob - boPenalty >= fastest).length;

  return (
    <section className="view">
      <VsBanner self={selfC} opp={oppC} />

      <div className="controls">
        <label>
          {t("selfLabel")}
          <CharPicker id="pn-self" value={selfC} onChange={setSelf} />
        </label>
        <label>
          {t("oppLabel")}
          <CharPicker id="pn-opp" value={oppC} onChange={setOpp} />
        </label>
        <input
          type="search"
          placeholder={t("searchPunish")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="chk">
          <input type="checkbox" checked={showSmall} onChange={(e) => setShowSmall(e.target.checked)} />
          {t("showSmall")}
        </label>
        <label className="chk">
          <input type="checkbox" checked={boActive} onChange={(e) => setBoActive(e.target.checked)} />
          {t("boActive")}
        </label>
        <label className="chk">
          <input type="checkbox" checked={starOnly} onChange={(e) => setStarOnly(e.target.checked)} />
          {t("showStarred")}
        </label>
      </div>

      <p className="note">{t("note")}</p>

      <p className="count">
        {countText(lang, charDisplayName(oppC, lang), targets.length, charDisplayName(selfC, lang), withPunish, boActive)}
      </p>

      <div id="pn-list">
        <AnimatePresence initial={false}>
          {targets.map((m) => {
            const w = Math.max(-m.ob - boPenalty, 0);
            const nk = noteKey(selfC, oppC, m);
            return (
              <motion.div
                key={m.n + m.i}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <PunishAccordionItem
                  m={m}
                  self={selfC}
                  window={w}
                  boActive={boActive}
                  note={notes[nk]}
                  onNote={(n) => updateNote(nk, n)}
                  starOnly={starOnly}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
