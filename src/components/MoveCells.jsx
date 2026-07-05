import { displayName, groupOf } from "../data/shared";
import { catBadgeLabel } from "../i18n/strings";
import { useLanguage } from "../i18n/LanguageContext";

export function MoveName({ m }) {
  const { lang } = useLanguage();
  if (lang === "en") {
    return <div className="mv-name">{m.n}</div>;
  }
  const en = m.j && m.j !== m.n ? <div className="mv-en">{m.n}</div> : null;
  return (
    <div className="mv-name">
      {displayName(m, lang)}
      {en}
    </div>
  );
}

export function FrameValue({ raw, parsed }) {
  const { t } = useLanguage();
  if (raw === null || raw === undefined || raw === "") return <>{t("dash")}</>;
  const cls = parsed === null ? "" : parsed > 0 ? "plus" : parsed < 0 ? "minus" : "";
  const txt = typeof raw === "number" && raw > 0 ? "+" + raw : String(raw);
  return <span className={`num ${cls}`}>{txt}</span>;
}

const BADGE_CLASS = { super: "super", throw: "throw", special: "special", drive: "drive" };

export function CatBadge({ m }) {
  const { lang } = useLanguage();
  const g = groupOf(m);
  const cls = BADGE_CLASS[g] || "";
  const label = catBadgeLabel(lang, m.cat, g);
  return <span className={`badge ${cls}`}>{label}</span>;
}
