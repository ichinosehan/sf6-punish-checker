import { useMemo, useState } from "react";
import { CHARS, CHAR_NAMES, charDisplayName, displayName, groupOf } from "../data/shared";
import { usePersistedState } from "../hooks/usePersistedState";
import { CAT_GROUPS, groupLabel, lvlLabel, xxLabel } from "../i18n/strings";
import { useLanguage } from "../i18n/LanguageContext";
import CharIcon from "./CharIcon";
import CharSelect from "./CharSelect";
import { CatBadge, FrameValue, MoveName } from "./MoveCells";

const COL_KEYS = [
  { key: "name", label: "colName", sortVal: (m, lang) => displayName(m, lang) },
  { key: "cmd", label: "colCmd", sortVal: (m) => m.i },
  { key: "su", label: "colStartup", sortVal: (m) => (m.su === null ? 999 : m.su) },
  { key: "ac", label: "colActive", sortVal: (m) => parseInt(m.ac, 10) || 999 },
  { key: "re", label: "colRecovery", sortVal: (m) => parseInt(m.re, 10) || 999 },
  { key: "oh", label: "colOnHit", sortVal: (m) => (m.oh === null ? -999 : m.oh) },
  { key: "ob", label: "colOnBlock", sortVal: (m) => (m.ob === null ? -999 : m.ob) },
  { key: "xx", label: "colCancel", sortVal: (m) => m.xx.length },
  { key: "dmg", label: "colDamage", sortVal: (m) => parseInt(m.dmg, 10) || 0 },
  { key: "lvl", label: "colLevel", sortVal: (m) => m.lvl || "" },
  { key: "ex", label: "colNotes", sortVal: (m) => m.ex.length },
];

const STAT_ITEMS = [
  ["statHealth", (s) => s.health],
  ["statFDash", (s) => s.fDash && s.fDash + "F"],
  ["statBDash", (s) => s.bDash && s.bDash + "F"],
  ["statThrowRange", (s) => s.throwRange],
  ["statFastestNormal", (s) => s.fastestNormal],
  ["statBestReversal", (s) => s.bestReversal],
];

export default function FrameTable() {
  const { t, lang } = useLanguage();
  const [char, setChar] = usePersistedState("sf6.fdChar", CHAR_NAMES[0]);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState({ key: null, dir: 1 });

  const c = CHARS[char] ? char : CHAR_NAMES[0];
  const stats = CHARS[c].stats;

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    let l = CHARS[c].moves.filter((m) => {
      if (cat !== "all" && groupOf(m) !== cat) return false;
      if (!q) return true;
      return (m.n + " " + (m.j || "") + " " + m.i).toLowerCase().includes(q);
    });
    if (sort.key) {
      const col = COL_KEYS.find((x) => x.key === sort.key);
      l = l.slice().sort((a, b) => {
        const va = col.sortVal(a, lang), vb = col.sortVal(b, lang);
        return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
      });
    }
    return l;
  }, [c, search, cat, sort, lang]);

  function onSort(key) {
    setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 }));
  }

  return (
    <section className="view">
      <div className="controls">
        <label>
          {t("charLabel")}
          <CharSelect id="fd-char" value={c} onChange={setChar} />
        </label>
        <input
          type="search"
          placeholder={t("searchFrames")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="chips">
          {CAT_GROUPS.map((v) => (
            <button
              key={v}
              className={`chip${cat === v ? " active" : ""}`}
              onClick={() => setCat(v)}
            >
              {groupLabel(lang, v)}
            </button>
          ))}
        </div>
      </div>

      <div className="stats">
        <CharIcon char={c} className="char-icon" />
        <div className="stats-body">
          <div className="stats-name">{charDisplayName(c, lang)}</div>
          {STAT_ITEMS
            .map(([k, get]) => [k, get(stats)])
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v], i) => (
              <span key={k}>
                {i > 0 && <span>｜</span>}
                {t(k)} <b>{v}</b>
              </span>
            ))}
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {COL_KEYS.map((col) => (
                <th key={col.key} onClick={() => onSort(col.key)}>
                  {t(col.label)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.n + m.i}>
                <td><MoveName m={m} /></td>
                <td className="mv-cmd">{m.i}</td>
                <td className="num">{m.suR ?? t("dash")}</td>
                <td className="num">{m.ac ?? t("dash")}</td>
                <td className="num">{m.re ?? t("dash")}</td>
                <td><FrameValue raw={m.ohR} parsed={m.oh} /></td>
                <td><FrameValue raw={m.obR} parsed={m.ob} /></td>
                <td>{m.xx.map((x) => xxLabel(lang, x)).join("・") || t("dash")}</td>
                <td className="num">{m.dmg ?? t("dash")}</td>
                <td>{m.lvl ? lvlLabel(lang, m.lvl) : t("dash")}</td>
                <td>{m.ex.length ? <span className="info" title={m.ex.join("\n")}>ⓘ</span> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
