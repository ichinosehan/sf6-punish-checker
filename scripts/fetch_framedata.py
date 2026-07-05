# SF6フレームデータ取得・変換スクリプト
# FAT (Frame Assistant Tool, GPL-3.0) の公開データを取得し、React側が import する
# src/data/framedata.json を生成する。
# 使い方:
#   py scripts/fetch_framedata.py            # ダウンロードして変換
#   py scripts/fetch_framedata.py --local    # ダウンロードせず data/raw/SF6FrameData.json から変換
import json
import re
import sys
import urllib.request
from datetime import date
from pathlib import Path

SOURCE_URL = "https://raw.githubusercontent.com/D4RKONION/FAT/main/src/js/constants/framedata/SF6FrameData.json"

ROOT = Path(__file__).resolve().parent.parent
RAW_PATH = ROOT / "data" / "raw" / "SF6FrameData.json"
OUT_PATH = ROOT / "src" / "data" / "framedata.json"
JA_PATH = Path(__file__).resolve().parent / "ja_names.json"

# 挑発などで特別状態に変身した時だけ使える技（真・豪鬼、ダークイングリッド、
# モノイド、真・ベガ）。通常の対戦ではほぼ登場しないノイズなのでデータごと除外する。
STATE_GATED_RE = re.compile(
    r"Shin Akuma exclusive|Dark Ingrid only|Shin Bison only", re.I)


def is_state_gated(name, num_cmd, extra_info):
    if STATE_GATED_RE.search(" ".join(extra_info or [])):
        return True
    return "Monoid" in name or "(Monoid)" in str(num_cmd)


# 当身・カウンター技や設置後限定の起爆技。フレーム上は打撃データを持つが
# 相手の攻撃や事前設置がないと機能しないため、確定反撃の候補から除外する。
NOT_PUNISHERS = {
    ("Ingrid", "Sun Veil"),
    ("Ingrid", "OD Sun Veil"),
    ("Zangief", "Tundra Storm"),
    ("Mai", "Kagerou no Mai"),
    ("Mai", "Kagerou no Mai (stock)"),
    ("Marisa", "Javelin of Marisa (Counter)"),
    ("Marisa", "Scutum (absorb)"),
    ("Marisa", "OD Scutum (absorb)"),
    ("Blanka", "Blanka-chan Bomb (Charge)"),
    ("Blanka", "Blanka-chan Bomb (OD Charge)"),
    ("Blanka", "Blanka-chan Bomb (SA1 Charge)"),
    ("JP", "Amnesia: Bomb"),
    ("JP", "OD Amnesia: Bomb"),
}

POS_JA = {
    "Stand": "立ち", "Crouch": "しゃがみ", "Jump": "ジャンプ",
    "Neutral Jump": "垂直ジャンプ", "Back Jump": "後方ジャンプ",
}
BTN_JA = {"LP": "弱P", "MP": "中P", "HP": "強P", "LK": "弱K", "MK": "中K", "HK": "強K"}
STRENGTH_JA = {"LP": "弱", "MP": "中", "HP": "強", "LK": "弱", "MK": "中", "HK": "強", "OD": "OD"}


def load_ja():
    with open(JA_PATH, encoding="utf-8") as f:
        return json.load(f)


def parse_frame(v):
    """発生・硬直差などの値を数値化する。'-8(-6)' -> -8、'KD'などは None。
    '11+5' のような多段表記は実際に当たるまでの合計フレームとして加算する。"""
    if isinstance(v, (int, float)):
        return int(v)
    if isinstance(v, str):
        m = re.match(r"\s*(\d+)(?:\+(\d+))+", v)
        if m:
            return sum(int(x) for x in re.findall(r"\d+", m.group(0)))
        m = re.search(r"-?\d+", v)
        if m:
            return int(m.group())
    return None


def translate(char, name, ja):
    """技名を日本語化する。訳せない場合は None（呼び出し側で英語のまま表示）。"""
    cmap = ja["moves"].get(char, {})
    if name in cmap:
        return cmap[name]
    if name in ja["common"]:
        return ja["common"][name]

    # 通常技: Stand LP / Crouch MK / Jump HP (+ (hold)等)
    m = re.match(r"^(Neutral Jump|Back Jump|Stand|Crouch|Jump)\s+([LMH][PK])(?:\s*\((.+)\))?$", name)
    if m:
        pos, btn, sfx = m.groups()
        base = POS_JA[pos] + BTN_JA[btn]
        # 公式サイトの通常技ニックネーム（例: 立ち強P（正拳突き））を付与。
        nickmap = ja.get("nicknames", {}).get(char, {})
        nick = nickmap.get(POS_JA[pos] + BTN_JA[btn]) or nickmap.get("ジャンプ" + BTN_JA[btn])
        if nick:
            base += "（" + nick + "）"
        if sfx:
            base += "（" + ja["suffixes"].get(sfx, sfx) + "）"
        return base

    # ドライブ技: "Drive Impact: Oni Goroshi" など
    m = re.match(r"^(Drive Impact|Drive Reversal)\s*:", name)
    if m:
        return ja["common"][m.group(1)]

    # 強度プレフィックス: "LP Hadoken" -> 弱波動拳
    m = re.match(r"^(OD|[LMH][PK])\s+(.+)$", name)
    if m:
        pre, rest = m.groups()
        base = translate(char, rest, ja)
        if base:
            return STRENGTH_JA[pre] + base

    # 末尾の括弧: "Hadoken (hold)" -> 波動拳（ホールド）
    m = re.match(r"^(.+?)\s*\(([^()]+)\)$", name)
    if m:
        base_en, sfx = m.groups()
        base = translate(char, base_en, ja)
        if base:
            return base + "（" + ja["suffixes"].get(sfx, sfx) + "）"

    # 派生: "A > B" -> 各パートを個別に翻訳
    if " > " in name:
        parts = [translate(char, p.strip(), ja) or p.strip() for p in name.split(" > ")]
        if any(translate(char, p.strip(), ja) for p in name.split(" > ")):
            return "→".join(parts)

    return None


def normalize_cat(move):
    cat = move.get("moveType")
    if cat:
        return cat
    name = move.get("moveName", "")
    if name.startswith("Drive"):
        return "drive"
    return "other"


def convert(raw, ja):
    out = {"meta": {"source": SOURCE_URL, "updated": date.today().isoformat()}, "chars": {}}
    for char, cdata in raw.items():
        stats = cdata.get("stats", {})
        # コマンド→カテゴリの索引（派生技判定用）
        cmd_cat = {}
        for mv in cdata["moves"]["normal"].values():
            c = mv.get("numCmd")
            if c:
                cmd_cat[str(c).strip()] = normalize_cat(mv)
        moves = []
        for key, mv in cdata["moves"]["normal"].items():
            name = mv.get("moveName", key)
            num_cmd = mv.get("numCmd") or mv.get("plnCmd") or ""
            if is_state_gated(name, num_cmd, mv.get("extraInfo")):
                continue
            cat = normalize_cat(mv)
            is_air = bool(re.search(r"\(air\)|air\b", str(num_cmd), re.I)) or "Jump" in name or "Aerial" in name
            # 派生技（生出し不可）判定: コマンドに ">" を含む技。
            # ただしSAは、前段が別のSA技のときのみ派生とみなす
            # （瞬獄殺やサンライズフェスティバル等は連続入力だが生出し可能）。
            is_followup = False
            if "(after" in str(num_cmd).lower():
                # 「特定技ヒット後のみ」の技（例: 5PP (after OD Power Drop)）
                is_followup = True
            elif ">" in str(num_cmd):
                if cat == "super":
                    prefix = str(num_cmd).split(">")[0].strip()
                    is_followup = cmd_cat.get(prefix) == "super"
                else:
                    is_followup = True
            moves.append({
                "n": name,
                "j": translate(char, name, ja),
                "i": num_cmd,
                "cat": cat,
                "su": parse_frame(mv.get("startup")),
                "suR": mv.get("startup"),
                "ac": mv.get("active"),
                "re": mv.get("recovery"),
                "oh": parse_frame(mv.get("onHit")),
                "ohR": mv.get("onHit"),
                "ob": parse_frame(mv.get("onBlock")),
                "obR": mv.get("onBlock"),
                "pc": parse_frame(mv.get("onPC")),
                "pcR": mv.get("onPC"),
                "dmg": mv.get("dmg"),
                "rng": mv.get("range"),
                "lvl": mv.get("atkLvl"),
                "xx": mv.get("xx") or [],
                "ex": mv.get("extraInfo") or [],
                "air": is_air,
                "fw": is_followup,
                "np": (char, name) in NOT_PUNISHERS or "(bomb)" in name,
            })
        out["chars"][char] = {
            "ja": ja["characters"].get(char, char),
            "stats": {k: stats.get(k) for k in (
                "health", "fDash", "bDash", "fWalk", "bWalk",
                "throwRange", "fastestNormal", "bestReversal") if stats.get(k) is not None},
            "moves": moves,
        }
    return out


def main():
    if "--local" in sys.argv:
        raw_text = RAW_PATH.read_text(encoding="utf-8")
    else:
        print(f"downloading {SOURCE_URL} ...")
        req = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "sf6-frame-app"})
        with urllib.request.urlopen(req) as res:
            raw_text = res.read().decode("utf-8")
        RAW_PATH.parent.mkdir(parents=True, exist_ok=True)
        RAW_PATH.write_text(raw_text, encoding="utf-8")

    raw = json.loads(raw_text)
    ja = load_ja()
    data = convert(raw, ja)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    n_moves = sum(len(c["moves"]) for c in data["chars"].values())
    n_ja = sum(1 for c in data["chars"].values() for m in c["moves"] if m["j"])
    print(f"OK: {len(data['chars'])} characters, {n_moves} moves ({n_ja} with JA names) -> {OUT_PATH}")


if __name__ == "__main__":
    main()
