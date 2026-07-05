import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { punishersFor, fastestPunisher } from "../data/shared";
import { guardLabel, noPunishText, windowLabel } from "../i18n/strings";
import { useLanguage } from "../i18n/LanguageContext";
import { CatBadge, FrameValue, MoveName } from "./MoveCells";

export default function PunishAccordionItem({ m, self, window: w, boActive }) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const list = open ? punishersFor(self, w) : null;

  return (
    <div className={`pn-move${open ? " open" : ""}`}>
      <div className="pn-head" onClick={() => setOpen((v) => !v)}>
        <motion.span className="arrow" animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.15 }}>
          ▶
        </motion.span>
        <MoveName m={m} />
        <span className="mv-cmd">{m.i}</span>
        <CatBadge m={m} />
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
              <PunishBody list={list} self={self} w={w} />
              {list.length === 0 && (
                <p className="pn-none">{noPunishText(lang, fastestPunisher(self), w)}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PunishBody({ list, w }) {
  const { t, lang } = useLanguage();
  if (!list.length) return null;
  return (
    <table>
      <thead>
        <tr>
          <th>{t("colName")}</th><th>{t("colCmd")}</th><th>{t("colStartup")}</th>
          <th>{t("colReach")}</th><th>{t("colDamage")}</th><th>{t("colPcAdv")}</th><th></th>
        </tr>
      </thead>
      <tbody>
        {list.map((m) => (
          <tr key={m.n + m.i}>
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
        ))}
      </tbody>
    </table>
  );
}
