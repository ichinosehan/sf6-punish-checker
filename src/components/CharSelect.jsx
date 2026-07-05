import { CHARS, CHAR_NAMES } from "../data/shared";
import { useLanguage } from "../i18n/LanguageContext";

export default function CharSelect({ id, value, onChange }) {
  const { lang } = useLanguage();
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      {CHAR_NAMES.map((c) => (
        <option key={c} value={c}>
          {lang === "en" ? c : `${CHARS[c].ja}${CHARS[c].ja !== c ? ` (${c})` : ""}`}
        </option>
      ))}
    </select>
  );
}
