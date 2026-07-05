(function () {
  "use strict";
  const DATA = window.SF6_DATA;
  const chars = DATA.chars;
  const charNames = Object.keys(chars);

  const CAT_LABEL = {
    normal: "通常技", special: "必殺技", super: "SA", throw: "投げ",
    "command-grab": "コマ投げ", drive: "ドライブ", "movement-special": "移動技",
    taunt: "挑発", other: "その他",
  };
  // フィルタ用グループ
  const CAT_GROUPS = [
    ["all", "すべて"],
    ["normal", "通常技"],
    ["unique", "特殊技"],
    ["special", "必殺技"],
    ["super", "SA"],
    ["throw", "投げ"],
    ["drive", "ドライブ"],
    ["other", "その他"],
  ];
  // 「立ち/しゃがみ/ジャンプ＋ボタン」の素の通常技。それ以外のnormal分類は特殊技・タゲコン扱い
  const PLAIN_NORMAL_RE = /^(Stand|Crouch|Jump|Neutral Jump|Back Jump)\s/;
  const groupOf = (m) => {
    if (m.cat === "command-grab") return "throw";
    if (m.cat === "taunt" || m.cat === "movement-special" || m.cat === "other") return "other";
    if (m.cat === "normal" && !PLAIN_NORMAL_RE.test(m.n)) return "unique";
    return m.cat;
  };
  const XX_LABEL = { ch: "連打", sp: "必殺", su: "SA", tc: "TC", dr: "DR" };
  const LVL_LABEL = { H: "上段", M: "中段", L: "下段", T: "投げ" };

  const ICONS = {
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
  function iconImg(c, cls) {
    const f = ICONS[c];
    if (!f) return "";
    return `<img class="${cls}" src="icons/${f}" alt="${esc(chars[c].ja)}" onerror="this.remove()">`;
  }

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function displayName(m) {
    return m.j || m.n;
  }
  function nameCell(m) {
    const sub = m.j && m.j !== m.n ? `<div class="mv-en">${esc(m.n)}</div>` : "";
    return `<div class="mv-name">${esc(displayName(m))}${sub}</div>`;
  }
  function frameCell(raw, parsed) {
    if (raw === null || raw === undefined || raw === "") return "－";
    const cls = parsed === null ? "" : parsed > 0 ? "plus" : parsed < 0 ? "minus" : "";
    const txt = typeof raw === "number" && raw > 0 ? "+" + raw : String(raw);
    return `<span class="num ${cls}">${esc(txt)}</span>`;
  }
  function saveSel(key, val) { try { localStorage.setItem(key, val); } catch (e) { /* file://等で失敗しても無視 */ } }
  function loadSel(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

  function fillCharSelect(sel, storageKey, fallbackIdx) {
    sel.innerHTML = charNames
      .map((c) => `<option value="${esc(c)}">${esc(chars[c].ja)}${chars[c].ja !== c ? ` (${esc(c)})` : ""}</option>`)
      .join("");
    const saved = loadSel(storageKey);
    sel.value = saved && chars[saved] ? saved : charNames[fallbackIdx];
    sel.addEventListener("change", () => saveSel(storageKey, sel.value));
  }

  /* ---------- タブ ---------- */
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b === btn));
      $("#view-frames").hidden = btn.dataset.tab !== "frames";
      $("#view-punish").hidden = btn.dataset.tab !== "punish";
    });
  });

  /* ---------- フレーム一覧 ---------- */
  const fdChar = $("#fd-char");
  const fdSearch = $("#fd-search");
  const fdCats = $("#fd-cats");
  let fdCat = "all";
  let fdSort = { key: null, dir: 1 };

  const COLS = [
    { key: "name", label: "技名", sortVal: (m) => displayName(m) },
    { key: "cmd", label: "コマンド", sortVal: (m) => m.i },
    { key: "su", label: "発生", sortVal: (m) => (m.su === null ? 999 : m.su) },
    { key: "ac", label: "持続", sortVal: (m) => parseInt(m.ac, 10) || 999 },
    { key: "re", label: "硬直", sortVal: (m) => parseInt(m.re, 10) || 999 },
    { key: "oh", label: "ヒット", sortVal: (m) => (m.oh === null ? -999 : m.oh) },
    { key: "ob", label: "ガード", sortVal: (m) => (m.ob === null ? -999 : m.ob) },
    { key: "xx", label: "キャンセル", sortVal: (m) => m.xx.length },
    { key: "dmg", label: "ダメージ", sortVal: (m) => parseInt(m.dmg, 10) || 0 },
    { key: "lvl", label: "属性", sortVal: (m) => m.lvl || "" },
    { key: "ex", label: "備考", sortVal: (m) => m.ex.length },
  ];

  fdCats.innerHTML = CAT_GROUPS
    .map(([v, label]) => `<button class="chip${v === "all" ? " active" : ""}" data-cat="${v}">${label}</button>`)
    .join("");
  fdCats.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    fdCat = chip.dataset.cat;
    fdCats.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === chip));
    renderFrames();
  });

  $("#fd-table thead").innerHTML =
    "<tr>" + COLS.map((c) => `<th data-key="${c.key}">${c.label}</th>`).join("") + "</tr>";
  $("#fd-table thead").addEventListener("click", (e) => {
    const th = e.target.closest("th");
    if (!th) return;
    const key = th.dataset.key;
    fdSort = { key, dir: fdSort.key === key ? -fdSort.dir : 1 };
    renderFrames();
  });

  function renderStats(c) {
    const s = chars[c].stats;
    const items = [
      ["体力", s.health],
      ["前ダッシュ", s.fDash && s.fDash + "F"],
      ["後ダッシュ", s.bDash && s.bDash + "F"],
      ["投げ間合い", s.throwRange],
      ["最速通常技", s.fastestNormal],
      ["最速無敵技", s.bestReversal],
    ].filter(([, v]) => v !== undefined && v !== null);
    $("#fd-stats").innerHTML =
      iconImg(c, "char-icon") +
      `<div class="stats-body"><div class="stats-name">${esc(chars[c].ja)}</div>` +
      items.map(([k, v]) => `${k} <b>${esc(v)}</b>`).join("<span>｜</span>") + "</div>";
  }

  function renderFrames() {
    const c = fdChar.value;
    renderStats(c);
    const q = fdSearch.value.trim().toLowerCase();
    let list = chars[c].moves.filter((m) => {
      if (fdCat !== "all" && groupOf(m) !== fdCat) return false;
      if (!q) return true;
      return (m.n + " " + (m.j || "") + " " + m.i).toLowerCase().includes(q);
    });
    if (fdSort.key) {
      const col = COLS.find((x) => x.key === fdSort.key);
      list = list.slice().sort((a, b) => {
        const va = col.sortVal(a), vb = col.sortVal(b);
        return (va < vb ? -1 : va > vb ? 1 : 0) * fdSort.dir;
      });
    }
    $("#fd-table tbody").innerHTML = list.map((m) => `
      <tr>
        <td>${nameCell(m)}</td>
        <td class="mv-cmd">${esc(m.i)}</td>
        <td class="num">${m.suR ?? "－"}</td>
        <td class="num">${m.ac ?? "－"}</td>
        <td class="num">${m.re ?? "－"}</td>
        <td>${frameCell(m.ohR, m.oh)}</td>
        <td>${frameCell(m.obR, m.ob)}</td>
        <td>${m.xx.map((x) => XX_LABEL[x] || x).join("・") || "－"}</td>
        <td class="num">${m.dmg ?? "－"}</td>
        <td>${LVL_LABEL[m.lvl] || m.lvl || "－"}</td>
        <td>${m.ex.length ? `<span class="info" title="${esc(m.ex.join("\n"))}">ⓘ</span>` : ""}</td>
      </tr>`).join("");
  }

  /* ---------- 確定反撃 ---------- */
  const pnOpp = $("#pn-opp");
  const pnSelf = $("#pn-self");
  const pnSearch = $("#pn-search");

  // 反撃側で使える技: 生出しできる地上技のうち、実際にヒットする打撃・投げのみ。
  // ohR(ヒット時データ)が無い技はインストールSA・設置・当身・構え等なので除外する。
  function punisherCandidates(c) {
    return chars[c].moves.filter((m) =>
      m.su !== null && !m.air && !m.fw && !m.np &&
      m.dmg != null && m.ohR != null &&
      ["normal", "special", "super", "throw", "command-grab"].includes(m.cat));
  }

  function punishersFor(c, windowF) {
    return punisherCandidates(c)
      .filter((m) => m.su <= windowF)
      .sort((a, b) => (parseInt(b.dmg, 10) || 0) - (parseInt(a.dmg, 10) || 0) || a.su - b.su);
  }

  function catBadge(m) {
    const g = groupOf(m);
    const cls = { super: "super", throw: "throw", special: "special", drive: "drive" }[g] || "";
    const label = g === "unique" ? "特殊技" : CAT_LABEL[m.cat] || m.cat;
    return `<span class="badge ${cls}">${label}</span>`;
  }

  function renderVs(opp, self) {
    $("#pn-vs").innerHTML = `
      <div class="vs-side">
        ${iconImg(self, "vs-icon")}
        <div class="vs-name">${esc(chars[self].ja)}</div>
        <div class="vs-role">反撃する側</div>
      </div>
      <div class="vs-text">VS</div>
      <div class="vs-side">
        ${iconImg(opp, "vs-icon")}
        <div class="vs-name">${esc(chars[opp].ja)}</div>
        <div class="vs-role">技をガードされた側</div>
      </div>`;
  }

  function renderPunish() {
    const opp = pnOpp.value, self = pnSelf.value;
    renderVs(opp, self);
    const q = pnSearch.value.trim().toLowerCase();
    const showSmall = $("#pn-small").checked;
    const boPenalty = $("#pn-bo").checked ? 4 : 0; // バーンアウト中はガード硬直+4F＝猶予-4F
    const fastest = punisherCandidates(self).reduce((a, m) => Math.min(a, m.su), 99);

    const targets = chars[opp].moves
      .filter((m) => m.ob !== null && m.ob < 0)
      .filter((m) => m.cat !== "taunt" && !m.n.startsWith("Drive Impact"))
      .filter((m) => showSmall || -m.ob - boPenalty > 3)
      .filter((m) => !q || (m.n + " " + (m.j || "") + " " + m.i).toLowerCase().includes(q))
      .sort((a, b) => b.ob - a.ob); // 不利が小さい順（大幅マイナスは自明なので後ろへ）

    const withPunish = targets.filter((m) => -m.ob - boPenalty >= fastest).length;
    let html = `<p class="count">${esc(chars[opp].ja)} のガード時マイナス技 ${targets.length}件 ／ うち ${esc(chars[self].ja)} で確反可能 ${withPunish}件${boPenalty ? "（バーンアウト補正中）" : ""}</p>`;

    html += targets.map((m, idx) => {
      const w = Math.max(-m.ob - boPenalty, 0);
      return `
      <div class="pn-move" data-idx="${idx}">
        <div class="pn-head">
          <span class="arrow">▶</span>
          ${nameCell(m)}
          <span class="mv-cmd">${esc(m.i)}</span>
          ${catBadge(m)}
          <span class="pn-window">ガード ${esc(String(m.obR))} ／ 猶予 <span class="w">${w}F</span>${boPenalty ? '<span class="bo-mark">BO</span>' : ""}</span>
        </div>
        <div class="pn-body" hidden></div>
      </div>`;
    }).join("");

    const listEl = $("#pn-list");
    listEl.innerHTML = html;

    listEl.querySelectorAll(".pn-move").forEach((el) => {
      el.querySelector(".pn-head").addEventListener("click", () => {
        const body = el.querySelector(".pn-body");
        const open = el.classList.toggle("open");
        body.hidden = !open;
        if (open && !body.dataset.done) {
          const m = targets[+el.dataset.idx];
          body.innerHTML = punishBody(self, Math.max(-m.ob - boPenalty, 0));
          body.dataset.done = "1";
        }
      });
    });
  }

  function punishBody(self, w) {
    const list = punishersFor(self, w);
    if (!list.length) {
      const fastest = punisherCandidates(self).reduce((a, m) => Math.min(a, m.su), 99);
      return `<p class="pn-none">確定反撃なし（最速 ${fastest}F ＞ 猶予 ${w}F）</p>`;
    }
    return `
      <table>
        <thead><tr><th>技名</th><th>コマンド</th><th>発生</th><th>リーチ</th><th>ダメージ</th><th>PC時有利</th><th></th></tr></thead>
        <tbody>${list.map((m) => `
          <tr>
            <td>${nameCell(m)}${m.su === w ? '<span class="exact">ぴったり</span>' : ""}</td>
            <td class="mv-cmd">${esc(m.i)}</td>
            <td class="num">${m.su}F</td>
            <td class="num">${m.rng ?? "－"}</td>
            <td class="num">${m.dmg ?? "－"}</td>
            <td>${frameCell(m.pcR, m.pc)}</td>
            <td>${catBadge(m)}</td>
          </tr>`).join("")}
        </tbody>
      </table>`;
  }

  /* ---------- 初期化 ---------- */
  fillCharSelect(fdChar, "sf6.fdChar", 0);
  fillCharSelect(pnOpp, "sf6.pnOpp", 0);
  fillCharSelect(pnSelf, "sf6.pnSelf", 1);

  fdChar.addEventListener("change", renderFrames);
  fdSearch.addEventListener("input", renderFrames);
  pnOpp.addEventListener("change", renderPunish);
  pnSelf.addEventListener("change", renderPunish);
  pnSearch.addEventListener("input", renderPunish);
  for (const [id, key] of [["pn-small", "sf6.pnSmall"], ["pn-bo", "sf6.pnBo"]]) {
    const chk = document.getElementById(id);
    chk.checked = loadSel(key) === "1";
    chk.addEventListener("change", () => {
      saveSel(key, chk.checked ? "1" : "0");
      renderPunish();
    });
  }

  $("#meta-updated").textContent = DATA.meta.updated;
  renderFrames();
  renderPunish();
})();
