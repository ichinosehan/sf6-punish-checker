import framedata from "./framedata.json";

export const DATA = framedata;
export const CHARS = DATA.chars;
export const CHAR_NAMES = Object.keys(CHARS);

// 「立ち/しゃがみ/ジャンプ＋ボタン」の素の通常技。それ以外のnormal分類は特殊技・タゲコン扱い
const PLAIN_NORMAL_RE = /^(Stand|Crouch|Jump|Neutral Jump|Back Jump)\s/;
export function groupOf(m) {
  if (m.cat === "command-grab") return "throw";
  if (m.cat === "taunt" || m.cat === "movement-special" || m.cat === "other") return "other";
  if (m.cat === "normal" && !PLAIN_NORMAL_RE.test(m.n)) return "unique";
  return m.cat;
}

export const ICONS = {
  "Ryu": "iconA01_Ryu.png", "Luke": "iconA02_Luke.png", "Jamie": "iconA03_Jamie.png",
  "Chun-Li": "iconA04_ChunLi.png", "Guile": "iconA05_Guile.png", "Kimberly": "iconA06_Kimberly.png",
  "Juri": "iconA07_Juri.png", "Ken": "iconA08_Ken.png", "Blanka": "iconA09_Blanka.png",
  "Dhalsim": "iconA10_Dhalsim.png", "E.Honda": "iconA11_EHonda.png", "Dee Jay": "iconA12_DeeJay.png",
  "Manon": "iconA13_Manon.png", "Marisa": "iconA14_Marisa.png", "JP": "iconA15_JP.png",
  "Zangief": "iconA16_Zangief.png", "Lily": "iconA17_Lily.png", "Cammy": "iconA18_Cammy.png",
  "Rashid": "iconA19_Rashid.png", "A.K.I.": "iconA20_AKI.png", "Ed": "iconA21_Ed.png",
  "Akuma": "iconA22_Gouki.png", "M.Bison": "iconA23aJ_Vega.png", "Terry": "iconA24_Terry.png",
  "Mai": "iconA25_Mai.png", "Elena": "iconA26_Elena.png", "Sagat": "iconA27_Sagat.png",
  "C.Viper": "iconA28_CViper.png", "Alex": "iconA29_Alex.png", "Ingrid": "iconA30_Ingrid.png",
};

export function displayName(m, lang) {
  return lang === "en" ? m.n : m.j || m.n;
}

export function charDisplayName(c, lang) {
  return lang === "en" ? c : CHARS[c].ja;
}

// 反撃側で使える技: 生出しできる地上技のうち、実際にヒットする打撃・投げのみ。
// ohR(ヒット時データ)が無い技はインストールSA・設置・当身・構え等なので除外する。
export function punisherCandidates(c) {
  return CHARS[c].moves.filter((m) =>
    m.su !== null && !m.air && !m.fw && !m.np &&
    m.dmg != null && m.ohR != null &&
    ["normal", "special", "super", "throw", "command-grab"].includes(m.cat));
}

export function punishersFor(c, windowF) {
  return punisherCandidates(c)
    .filter((m) => m.su <= windowF)
    .sort((a, b) => (parseInt(b.dmg, 10) || 0) - (parseInt(a.dmg, 10) || 0) || a.su - b.su);
}

export function fastestPunisher(c) {
  return punisherCandidates(c).reduce((a, m) => Math.min(a, m.su), 99);
}
