import { useState } from "react";
import { charDisplayName, ICONS } from "../data/shared";
import { useLanguage } from "../i18n/LanguageContext";

export default function CharIcon({ char, className }) {
  const { lang } = useLanguage();
  const [failed, setFailed] = useState(false);
  const file = ICONS[char];
  if (!file || failed) return null;
  return (
    <img
      className={className}
      src={`${import.meta.env.BASE_URL}icons/${file}`}
      alt={charDisplayName(char, lang)}
      onError={() => setFailed(true)}
    />
  );
}
