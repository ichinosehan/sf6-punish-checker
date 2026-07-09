import { useState } from "react";

const KEY = "sf6.pn.notes";

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

/** 確反メモ全体。{ "<自キャラ>|<相手キャラ>|<相手技>": { pick, combo } } */
export function usePunishNotes() {
  const [notes, setNotes] = useState(load);
  const update = (key, note) => {
    setNotes((prev) => {
      const next = { ...prev };
      if (note === null) delete next[key];
      else next[key] = note;
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* 保存失敗は無視（stateには反映される） */
      }
      return next;
    });
  };
  return [notes, update];
}

export function noteKey(self, opp, m) {
  return `${self}|${opp}|${m.n}|${m.i}`;
}

/** 技の一意ID（punisher側の採用マークに使う） */
export function moveId(m) {
  return m.n + m.i;
}
