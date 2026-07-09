import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { CHARS, displayName, punishersFor, fastestPunisher } from "../data/shared";
import { moveId } from "../hooks/usePunishNotes";
import { guardLabel, noPunishText, windowLabel } from "../i18n/strings";
import { useLanguage } from "../i18n/LanguageContext";
import { CatBadge, FrameValue, MoveName } from "./MoveCells";

export default function PunishAccordionItem({ m, self, window: w, boActive, note, onNote, starOnly }) {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  let list = open ? punishersFor(self, w) : null;
  // ★のみ表示中は候補テーブルも採用技だけに絞る（猶予変化で★技が消えた時は全件に戻す）
  if (list && starOnly && note?.pick) {
    const only = list.filter((x) => moveId(x) === note.pick);
    if (only.length) list = only;
  }
  const picked = note?.pick
    ? CHARS[self].moves.find((x) => moveId(x) === note.pick)
    : null;

  return (
    <div className={`pn-move${open ? " open" : ""}`}>
      <div className="pn-head" onClick={() => setOpen((v) => !v)}>
        <motion.span className="arrow" animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.15 }}>
          ▶
        </motion.span>
        <MoveName m={m} />
        <span className="mv-cmd">{m.i}</span>
        <CatBadge m={m} />
        {picked && <span className="pn-pick">★{displayName(picked, lang)}</span>}
        <span className="pn-window">
          {guardLabel[lang]} {String(m.obR)} ／ {windowLabel[lang]} <span className="w">{w}F</span>
          {boActive && <span className="bo-mark">BO</span>}
        </span>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="pn-body">
              <PunishBody list={list} w={w} note={note} onNote={onNote} />
              {list.length === 0 && (
                <p className="pn-none">{noPunishText(lang, fastestPunisher(self), w)}</p>
              )}
              {picked && (
                <div className="combo-memo">
                  <label>{t("comboLabel")}</label>
                  <textarea
                    rows={2}
                    placeholder={t("comboPh")}
                    value={note.combo || ""}
                    onChange={(e) => onNote({ ...note, combo: e.target.value })}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PunishBody({ list, w, note, onNote }) {
  const { t } = useLanguage();
  if (!list.length) return null;

  const toggleStar = (m) => {
    const id = moveId(m);
    const combo = note?.combo || "";
    if (note?.pick === id) {
      onNote(combo ? { combo } : null); // ★解除（メモがあれば残す）
    } else {
      onNote({ pick: id, combo });
    }
  };

  return (
    <table>
      <thead>
        <tr>
          <th></th>
          <th>{t("colName")}</th><th>{t("colCmd")}</th><th>{t("colStartup")}</th>
          <th>{t("colReach")}</th><th>{t("colDamage")}</th><th>{t("colPcAdv")}</th><th></th>
        </tr>
      </thead>
      <tbody>
        {list.map((m) => {
          const starred = note?.pick === moveId(m);
          return (
            <tr key={m.n + m.i} className={starred ? "starred" : ""}>
              <td>
                <button
                  type="button"
                  className={`star-btn${starred ? " on" : ""}`}
                  title={t("pickTitle")}
                  onClick={() => toggleStar(m)}
                >
                  ★
                </button>
              </td>
              <td>
                <MoveName m={m} />
                {m.su === w && <span className="exact">{t("exact")}</span>}
              </td>
              <td className="mv-cmd">{m.i}</td>
              <td className="num">{m.su}F</td>
              <td className="num">{m.rng ?? t("dash")}</td>
              <td className="num">{m.dmg ?? t("dash")}</td>
              <td><FrameValue raw={m.pcR} parsed={m.pc} /></td>
              <td><CatBadge m={m} /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
