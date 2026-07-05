import { useState } from "react";

function readStorage(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch {
    return fallback;
  }
}

function writeStorage(key, val) {
  try {
    localStorage.setItem(key, val);
  } catch {
    /* file://等で失敗しても無視 */
  }
}

/** localStorageに文字列として保存されるstate。key未保存時はfallbackを使う。 */
export function usePersistedState(key, fallback) {
  const [value, setValue] = useState(() => readStorage(key, fallback));
  const set = (v) => {
    setValue(v);
    writeStorage(key, v);
  };
  return [value, set];
}

/** チェックボックス用。"1"/"0"文字列でlocalStorageに保存する真偽値state。 */
export function usePersistedBool(key, fallback = false) {
  const [value, setValue] = usePersistedState(key, fallback ? "1" : "0");
  return [value === "1", (v) => setValue(v ? "1" : "0")];
}
