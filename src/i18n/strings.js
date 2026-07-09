// UIの静的文言。技名自体はデータ側にj(日本語)/n(英語)を持っているのでここでは翻訳しない。
export const UI = {
  titlePre: { ja: "SF6 フレームデータ ", en: "SF6 Frame Data " },
  titleAccent: { ja: "&", en: "&" },
  titlePost: { ja: " 確定反撃チェッカー", en: " Punish Checker" },
  docTitle: { ja: "SF6 フレームデータ & 確定反撃チェッカー", en: "SF6 Frame Data & Punish Checker" },

  tabPunish: { ja: "確定反撃", en: "Punish Checker" },
  tabFrames: { ja: "フレーム一覧", en: "Frame Data" },

  footerSource: { ja: "データ出典: ", en: "Data source: " },
  footerLicense: { ja: " (GPL-3.0) ｜ 更新: ", en: " (GPL-3.0) ｜ Updated: " },
  footerUpdateMethod: { ja: " ｜ 更新方法: ", en: " ｜ Update: " },

  charLabel: { ja: "キャラクター", en: "Character" },
  searchFrames: { ja: "技名・コマンドで検索", en: "Search move name or command" },

  statHealth: { ja: "体力", en: "Health" },
  statFDash: { ja: "前ダッシュ", en: "Forward Dash" },
  statBDash: { ja: "後ダッシュ", en: "Back Dash" },
  statThrowRange: { ja: "投げ間合い", en: "Throw Range" },
  statFastestNormal: { ja: "最速通常技", en: "Fastest Normal" },
  statBestReversal: { ja: "最速無敵技", en: "Best Reversal" },

  colName: { ja: "技名", en: "Move" },
  colCmd: { ja: "コマンド", en: "Command" },
  colStartup: { ja: "発生", en: "Startup" },
  colActive: { ja: "持続", en: "Active" },
  colRecovery: { ja: "硬直", en: "Recovery" },
  colOnHit: { ja: "ヒット", en: "On Hit" },
  colOnBlock: { ja: "ガード", en: "On Block" },
  colCancel: { ja: "キャンセル", en: "Cancel" },
  colDamage: { ja: "ダメージ", en: "Damage" },
  colLevel: { ja: "属性", en: "Level" },
  colNotes: { ja: "備考", en: "Notes" },
  colReach: { ja: "リーチ", en: "Reach" },
  colPcAdv: { ja: "PC時有利", en: "PC Advantage" },
  dash: { ja: "－", en: "-" },

  selfLabel: { ja: "自キャラ（反撃する側）", en: "Your Character (punisher)" },
  oppLabel: { ja: "相手キャラ（ガードした技）", en: "Opponent (blocked move)" },
  searchPunish: { ja: "相手の技名で検索", en: "Search opponent's move" },
  showSmall: { ja: "猶予3F以下も表示", en: "Show 3F-or-less windows" },
  boActive: { ja: "自分バーンアウト中（猶予−4F）", en: "I'm in Burnout (-4F window)" },
  note: {
    ja: "⚠ フレーム上の理論値です（発生 ≦ 相手のガード硬直差）。距離・押し合い・リーチは考慮していません。ガード後に届くかはトレモで確認してください。",
    en: "⚠ Theoretical frame-data calculation only (startup ≤ opponent's block advantage). Spacing, pushback, and range are not accounted for — verify it actually connects in training mode.",
  },
  boSuffix: { ja: "（バーンアウト補正中）", en: " (Burnout-adjusted)" },

  selfRole: { ja: "反撃する側", en: "Punisher" },
  oppRole: { ja: "技をガードされた側", en: "Blocked this move" },

  exact: { ja: "ぴったり", en: "Exact" },

  showStarred: { ja: "★のみ表示", en: "Starred only" },
  pickTitle: { ja: "この技を確反に採用（★）", en: "Set as my punish (★)" },
  comboLabel: { ja: "コンボメモ", en: "Combo memo" },
  comboPh: {
    ja: "例: 弱昇龍拳 > SA3 ／ 画面端はOD波動〆",
    en: "e.g. LP DP > SA3 / OD fireball ender in corner",
  },

  langJa: { ja: "日本語", en: "日本語" },
  langEn: { ja: "English", en: "English" },
};

export function t(lang, key) {
  const entry = UI[key];
  if (!entry) return key;
  return entry[lang] ?? entry.ja;
}

export function countText(lang, opp, oppCount, self, punishCount, boActive) {
  const suffix = boActive ? t(lang, "boSuffix") : "";
  if (lang === "en") {
    return `${opp}'s unsafe-on-block moves: ${oppCount} ／ Punishable by ${self}: ${punishCount}${suffix}`;
  }
  return `${opp} のガード時マイナス技 ${oppCount}件 ／ うち ${self} で確反可能 ${punishCount}件${suffix}`;
}

export const guardLabel = { ja: "ガード", en: "Block" };
export const windowLabel = { ja: "猶予", en: "Window" };

export function noPunishText(lang, fastest, w) {
  if (lang === "en") return `No guaranteed punish (fastest ${fastest}F > window ${w}F)`;
  return `確定反撃なし（最速 ${fastest}F ＞ 猶予 ${w}F）`;
}

// 技カテゴリ・キャンセル種別・属性の日英ラベル
export const CAT_LABEL = {
  normal: { ja: "通常技", en: "Normal" },
  unique: { ja: "特殊技", en: "Unique" },
  special: { ja: "必殺技", en: "Special" },
  super: { ja: "SA", en: "SA" },
  throw: { ja: "投げ", en: "Throw" },
  "command-grab": { ja: "コマ投げ", en: "Command Grab" },
  drive: { ja: "ドライブ", en: "Drive" },
  "movement-special": { ja: "移動技", en: "Movement" },
  taunt: { ja: "挑発", en: "Taunt" },
  other: { ja: "その他", en: "Other" },
};

export const CAT_GROUPS = [
  "all", "normal", "unique", "special", "super", "throw", "drive", "other",
];

const CAT_GROUP_LABEL_ALL = { ja: "すべて", en: "All" };

export function groupLabel(lang, group) {
  if (group === "all") return CAT_GROUP_LABEL_ALL[lang] ?? CAT_GROUP_LABEL_ALL.ja;
  return CAT_LABEL[group] ? (CAT_LABEL[group][lang] ?? CAT_LABEL[group].ja) : group;
}

export function catBadgeLabel(lang, cat, group) {
  const key = group === "unique" ? "unique" : cat;
  return CAT_LABEL[key] ? (CAT_LABEL[key][lang] ?? CAT_LABEL[key].ja) : cat;
}

export const XX_LABEL = {
  ch: { ja: "連打", en: "Chain" },
  sp: { ja: "必殺", en: "Special" },
  su: { ja: "SA", en: "SA" },
  tc: { ja: "TC", en: "TC" },
  dr: { ja: "DR", en: "DR" },
};

export function xxLabel(lang, code) {
  return XX_LABEL[code] ? (XX_LABEL[code][lang] ?? XX_LABEL[code].ja) : code;
}

export const LVL_LABEL = {
  H: { ja: "上段", en: "High" },
  M: { ja: "中段", en: "Mid" },
  L: { ja: "下段", en: "Low" },
  T: { ja: "投げ", en: "Throw" },
};

export function lvlLabel(lang, code) {
  return LVL_LABEL[code] ? (LVL_LABEL[code][lang] ?? LVL_LABEL[code].ja) : code;
}
