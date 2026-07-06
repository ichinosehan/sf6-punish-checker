"""公式サイトのフレーム表から日本語技名を抽出し、ja_names.json の
ベース訳・通常技ニックネームを更新するための対応表を作る。

方式:
- 必殺技/特殊技/スーパーアーツ 行を「方向＋単一強度ボタン」でキー化し、
  同じコマンドを持つ FAT の技（m.i）に紐付ける。
- FAT英語名から強度接頭辞を除いた base と、公式名から強度接頭辞を除いた
  base を対応付ける（多数決）。これで [電刃]/OD/空中 等の変種はスクリプトの
  既存プレフィックス機構に任せつつ、ベース名だけを公式表記へ正す。
- 通常技は 立ち/しゃがみ/ジャンプ×ボタン ごとの公式ニックネームを抽出。
"""
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OFF_DIR = ROOT / "data" / "raw" / "official"
FRAME = ROOT / "src" / "data" / "framedata.json"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36"


def ensure_html(slug):
    """公式フレーム表HTMLをキャッシュ（無ければ取得）。data/raw/official/ は .gitignore。"""
    path = OFF_DIR / f"{slug}.html"
    if not path.exists():
        OFF_DIR.mkdir(parents=True, exist_ok=True)
        url = f"https://www.streetfighter.com/6/ja-jp/character/{slug}/frame"
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        path.write_bytes(urllib.request.urlopen(req).read())
        time.sleep(0.4)
    return path.read_text(encoding="utf-8")

SLUGS = {
    "Ryu": "ryu", "Ken": "ken", "Chun-Li": "chunli", "Luke": "luke",
    "Jamie": "jamie", "Guile": "guile", "Kimberly": "kimberly", "Juri": "juri",
    "Blanka": "blanka", "Dhalsim": "dhalsim", "E.Honda": "ehonda",
    "Dee Jay": "deejay", "Manon": "manon", "Marisa": "marisa", "JP": "jp",
    "Zangief": "zangief", "Lily": "lily", "Cammy": "cammy", "Rashid": "rashid",
    "A.K.I.": "aki", "Ed": "ed", "Akuma": "gouki_akuma", "M.Bison": "vega_mbison",
    "Terry": "terry", "Mai": "mai", "Elena": "elena", "Sagat": "sagat",
    "C.Viper": "cviper", "Ingrid": "ingrid", "Alex": "alex",
}

DIRMAP = {"key-u": "8", "key-ur": "9", "key-r": "6", "key-dr": "3", "key-d": "2",
          "key-dl": "1", "key-l": "4", "key-ul": "7",
          # チャージ（溜め）方向。溜め技のコマンドを正しくキー化して衝突検出に使う。
          "key-lc": "4", "key-rc": "6", "key-dc": "2"}
STR_BTN = {"icon_punch_l": "LP", "icon_punch_m": "MP", "icon_punch_h": "HP",
           "icon_kick_l": "LK", "icon_kick_m": "MK", "icon_kick_h": "HK"}
# 注: 強度なしの汎用ボタン(icon_punch/icon_kick)はSA・空中技・ターゲットコンボで
# 多数の技がコマンドを共有し衝突を招くため、あえて照合キーに使わない。

# 公式名の先頭に付く強度・状態の接頭辞（ベース名を得るため除去する）
PREFIX_RE = re.compile(
    r"^(?:\[[^\]]+\]\s*)?"           # [電刃錬気] など
    r"(?:(?:SA[123]|CA)\s*)?"        # SA1 / CA（スペースなし表記もある）
    r"(?:(?:弱|中|強|OD|空中)\s*)*"   # 強度・空中（複数可）
)
SUFFIX_RE = re.compile(r"(?:（(?:Lv[123]|ホールド|チャージ|ためなし|溜めなし)）|\(Lv[123]\))\s*$")


def strip_tags(s):
    return re.sub(r"<[^>]+>", "", s).strip()


def base_name(jp):
    jp = PREFIX_RE.sub("", jp)
    jp = SUFFIX_RE.sub("", jp).strip()
    return jp


SECTION_JA = {"通常技": "normal", "特殊技": "unique", "必殺技": "special",
              "スーパーアーツ": "sa", "通常投げ": "throw", "共通システム": "system"}


def parse_official(html):
    """行を順に (section, name, dirs, str_btn or None) で返す。"""
    rows = []
    section = None
    # heading と skill 行を出現順に走査
    token_re = re.compile(
        r'frame_heading__\w+"><td[^>]*><span>(.*?)</span>'
        r'|frame_skill__\w+"><span class="frame_arts__\w+">(.*?)</span>'
        r'(?:<p class="frame_classic__\w+">(.*?)</p>)?',
        re.S,
    )
    for m in token_re.finditer(html):
        head, name, cmd = m.group(1), m.group(2), m.group(3)
        if head is not None:
            section = SECTION_JA.get(strip_tags(head).strip(), strip_tags(head).strip())
            continue
        name = strip_tags(name)
        imgs = re.findall(r'controller/([a-z0-9_-]+)\.png', cmd or "")
        dirs = "".join(DIRMAP[i] for i in imgs if i in DIRMAP)
        strs = [STR_BTN[i] for i in imgs if i in STR_BTN]
        str_btn = strs[0] if len(strs) == 1 else None
        rows.append((section, name, dirs, str_btn, imgs))
    return rows


TRUE_NORMAL_RE = re.compile(r"^(Stand|Crouch|Jump|Neutral Jump|Back Jump)\s+[LMH][PK]$")


def eng_base(n):
    n = re.sub(r"^(OD|[LMH][PK])\s+", "", n).strip()
    # 末尾の状態接尾辞は除去してベース名に寄せる（(hold)/(stock)/(air)/(enhanced) 等）。
    # スクリプト側の接尾辞ハンドラが （ホールド）等を後付けする。
    while True:
        m = re.match(r"^(.*\S)\s*\((?:hold|stock|stocks|air|enhanced|charged|"
                     r"charge|bomb|Critical Art|\d+ stocks?|\d+ stock)\)$", n)
        if not m:
            break
        n = m.group(1).strip()
    return n


def fat_canon(cmd):
    core = cmd.split(" (")[0].split(" >")[0].strip()
    return core


# 公式名に含まれると「combo行/変種集約」で曖昧なため base 採用を見送るマーカー
AMBIG_RE = re.compile(r"（\d+段目|/|（メダル|（Lv|溜め|ため")
FAT_BASE_CATS = {"special", "super", "unique"}

# コマンド衝突で誤マッチと確認できた組み合わせ（採用しない）
SKIP_BASE = {
    ("Alex", "Collapsing Driver"),      # 4MK(back turn) が オブリークスタンプ と衝突
    ("C.Viper", "Thunder Dash"),        # 別技2つが同名に collapse（衝突疑い）
    ("C.Viper", "Tracer Combination"),
    # 電刃状態のSA。公式は「[電刃錬気]SA1 真空波動拳」形式で技名自体は同じだが、
    # 一覧で区別できるよう手動の「～（電刃錬気）」名を維持する。
    ("Ryu", "Denjin Hadoken"),
    ("Ryu", "Denjin Hashogeki"),
    # ターゲットコンボ/移動技が特殊技のコマンドに衝突（逆引きで別技と重複）
    ("Kimberly", "Step Up (neutral hop)"),
    ("Kimberly", "Step Up (forward hop)"),
    ("Kimberly", "Step Up (backward hop)"),
    ("Cammy", "Lift Combination"),
    ("Elena", "Trunk Slap 1"),
    ("Elena", "Trunk Slap 2"),
    ("Elena", "Trunk Slap Final"),
    ("Elena", "Handstand Whip 1"),
    ("Elena", "Handstand Whip 2"),
}


def main():
    frame = json.loads(FRAME.read_text(encoding="utf-8"))
    result = {}
    for char, slug in SLUGS.items():
        rows = parse_official(ensure_html(slug))
        # 公式: 単一強度コマンド(方向付き) -> 公式ベース名の集合（特殊/必殺/SA のみ）
        off_sets = {}
        nick = {}
        for section, name, dirs, sb, imgs in rows:
            if section == "normal":
                mm = re.match(
                    r"^(立ち|しゃがみ|ジャンプ)(弱P|中P|強P|弱K|中K|強K)\s*（(.+?)）\s*$", name)
                if mm:
                    nick[mm.group(1) + mm.group(2)] = mm.group(3)
                continue
            if section in ("unique", "special", "sa") and sb and dirs:
                off_sets.setdefault(dirs + sb, set()).add(name)
        # 1コマンドに複数の別名がぶら下がる＝衝突。曖昧なので除外。
        off_by_cmd = {}
        for key, names in off_sets.items():
            bases = {base_name(n) for n in names if not AMBIG_RE.search(n)}
            if len(bases) == 1:
                off_by_cmd[key] = next(iter(bases))
        # SA: 強度なしボタン(P/K)なので「方向列＋P/K種別」でキー化。
        # 同キーの表記ゆれ（強化版 例: 武神乱拍子・雷譜）は最短の共通ベースに寄せる。
        sa_sets = {}
        sa_air_keys = set()  # 公式に「空中～」行があるキー（空中版SAを持つ技）
        for section, name, dirs, sb, imgs in rows:
            if section != "sa" or not dirs:
                continue
            cls = ("P" if any(i.startswith("icon_punch") for i in imgs)
                   else "K" if any(i.startswith("icon_kick") for i in imgs) else None)
            if cls:
                sa_sets.setdefault(dirs + cls, set()).add(base_name(name))
                if "空中" in name:
                    sa_air_keys.add(dirs + cls)
        sa_by_cmd = {}
        for key, bases in sa_sets.items():
            shortest = min(bases, key=len)
            if all(b.startswith(shortest) for b in bases):
                sa_by_cmd[key] = shortest
        # FAT技（必殺/SA/特殊のみ）と突き合わせ
        eng2jp = {}
        for m in frame["chars"][char]["moves"]:
            # 真の通常技（Stand/Crouch/Jump+ボタン）と投げ/ドライブは対象外。
            # FATは特殊技を cat=normal にしていることがあるので name で判定する。
            if TRUE_NORMAL_RE.match(m["n"]) or m["cat"] in ("throw", "drive"):
                continue
            key = fat_canon(m["i"])
            if key in off_by_cmd:
                eb, jb = eng_base(m["n"]), off_by_cmd[key]
                if (char, eb) in SKIP_BASE:
                    continue
                if " > " in eb:  # 派生技はスプリッタに任せる（前段名を潰さない）
                    continue
                if jb and eb:
                    eng2jp.setdefault(eb, {}).setdefault(jb, 0)
                    eng2jp[eb][jb] += 1
        # SA（cat=super）を「方向列＋P/K種別」で照合
        for m in frame["chars"][char]["moves"]:
            if m["cat"] != "super":
                continue
            if ">" in m["i"]:  # 追加入力・派生（ツインゲイザー等）は名前が別なので対象外
                continue
            mm = re.match(r"^(\d+)\s*(?:\[?[LMH]?\]?)?([PK])", fat_canon(m["i"]))
            if not mm:
                continue
            key = mm.group(1) + mm.group(2)
            if key not in sa_by_cmd:
                continue
            eb, jb = eng_base(m["n"]), sa_by_cmd[key]
            if (char, eb) in SKIP_BASE or " > " in eb:
                continue
            # 公式に空中版の行がある技だけ、Aerial/Air/Soaring ～ に「空中」を戻す
            if key in sa_air_keys and re.match(r"^(Aerial|Air|Soaring)\s", eb):
                jb = "空中" + jb
            eng2jp.setdefault(eb, {}).setdefault(jb, 0)
            eng2jp[eb][jb] += 1
        # 1英語ベースが複数公式ベースに割れる＝衝突。除外。
        base_map = {eb: next(iter(c)) for eb, c in eng2jp.items() if len(c) == 1}
        result[char] = {"base": base_map, "nick": nick}
    return result


def apply_to_ja_names(result):
    """抽出結果を scripts/ja_names.json にマージする（べき等）。"""
    path = ROOT / "scripts" / "ja_names.json"
    ja = json.loads(path.read_text(encoding="utf-8"))
    ja.setdefault("nicknames", {})
    n_base = 0
    for char, r in result.items():
        moves = ja["moves"].setdefault(char, {})
        for eb, jb in r["base"].items():
            if moves.get(eb) != jb:
                moves[eb] = jb
                n_base += 1
        if r["nick"]:
            ja["nicknames"][char] = r["nick"]
    path.write_text(json.dumps(ja, ensure_ascii=False, indent=2), encoding="utf-8")
    n_nick = sum(len(r["nick"]) for r in result.values())
    print(f"applied: base {n_base} changes, {n_nick} nicknames -> {path.name}")
    print("次に `py scripts/fetch_framedata.py --local` で framedata.json を再生成してください。")


if __name__ == "__main__":
    apply_to_ja_names(main())
