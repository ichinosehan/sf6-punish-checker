# SF6 フレームデータ & 確定反撃チェッカー

ストリートファイター6 全30キャラクターのフレームデータ一覧と、
「相手のこの技をガードしたら、自キャラのどの技で確定反撃が取れるか」を調べられる静的Webアプリです。

**公開URL: https://ichinosehan.github.io/sf6-punish-checker/**（`main`へのpushで自動更新されます）

React + Vite + framer-motion製です。開発サーバを起動して使います（Node.js 18以上が必要）。

**[start-app.bat](start-app.bat) をダブルクリックするだけでOKです。** 初回は依存パッケージのインストールも自動で行い、サーバー起動後にブラウザで http://localhost:5173 を自動で開きます。終了する時は開いたコンソールウィンドウを閉じるか `Ctrl+C` を押してください。

手動でコマンドを打つ場合:

```
npm install
npm run dev
```

表示されたURL（デフォルト http://localhost:5173 ）をブラウザで開いてください。

## 使い方

### 言語切替

ヘッダー右上の「日本語 / English」ボタンでUI全体を切り替えられます（デフォルトは日本語）。設定はブラウザに保存され、次回起動時も引き継がれます。
技名は英語モードでは常に元データの英語名を表示し、日本語モードでは日本語名（無ければ英語名）を表示します。

### フレーム一覧タブ

- キャラクターを選ぶと全技のフレームデータを表示
- カテゴリ（通常技／必殺技／SA／投げ／ドライブ）で絞り込み、技名・コマンドで検索
- 列ヘッダのクリックでソート（もう一度クリックで昇順・降順切替え）
- 備考がある技は ⓘ にマウスを乗せると詳細を表示

### 確定反撃タブ

- **相手キャラ**（ガードした技側）と**自キャラ**（反撃する側）を選択
- 相手のガード時マイナス技が「不利が小さい順」に並びます（覚えるべき僅差の確反が先頭）
- 猶予3F以下（ほぼ確反なし）はデフォルト非表示。チェックボックスで表示できます
- 技をクリックすると、確定反撃になる自キャラの技（発生 ≦ 猶予フレーム）を**ダメージの高い順**に表示
- **PC時有利**列は、その技がパニッシュカウンターでヒットした時の有利フレーム（コンボ継続の判断用）
- **リーチ**列で「届くかどうか」の目安を確認できます（元データ未収録の技は「－」。ケンはほぼ未収録）
- **自分バーンアウト中（猶予−4F）**トグルで、バーンアウト時のガード硬直+4Fを織り込んだ猶予に切り替え可能
- 発生が猶予とちょうど同じ技には「ぴったり」表示
- 相手技リストから挑発・ドライブインパクトは除外しています（DIは反撃候補からも除外）
- 以下は反撃候補から除外しています:
  - インストール型SA（風水エンジン等、発動に攻撃判定がないもの）
  - 当身・カウンター技（サンベール、ツンドラストーム、陽炎の舞等 → `scripts/fetch_framedata.py` の `NOT_PUNISHERS` で管理）
  - 設置後限定の起爆技（サイコマイン系・ブランカちゃんボム起動等）
  - 特定技ヒット後限定の技・目押し派生（タゲコン後段等）

### ⚠ 確反判定の注意

- **フレーム上の理論値です。** 距離・押し合い・リーチは考慮していません
  （先端ガードで届かない、密着でしか入らない等はトレモで確認してください）
- タメ技（ソニックブーム等）はタメ完成が前提です
- 発生に幅がある技（`18~40` 等）は最速値で判定しています
- パニッシュカウンターやドライブラッシュによる状況変化は含みません

## データの更新（パッチ対応）

データはコミュニティ製フレームデータアプリ **[FAT - Frame Assistant Tool](https://github.com/D4RKONION/FAT)**（GPL-3.0）の公開データを変換して同梱しています。
変換スクリプトはPython製のままで、`src/data/framedata.json` を生成します（Reactアプリはこれをimportするだけ）。
ゲームのアップデート後は次のコマンドで再取得できます（Python 3 が必要）:

```
py scripts/fetch_framedata.py
```

ネットワークなしで変換だけやり直す場合（`data/raw/SF6FrameData.json` を使用）:

```
py scripts/fetch_framedata.py --local
```

データ更新後は`npm run dev`のHMRで自動反映されます（再起動不要）。

## 技名の日本語表記について

- 通常技（立ち弱P等）は自動変換
- 必殺技・SA等は `scripts/ja_names.json` のマッピングで全技を日本語化しています
- 一部は公式日本語名が確認できないためベストエフォートの訳です。訳を直したい場合は
  `scripts/ja_names.json` を編集して `py scripts/fetch_framedata.py --local` を実行してください

## ファイル構成

```
index.html                  Viteエントリ（<div id="root">のみ）
src/main.jsx                Reactマウント
src/App.jsx                 タブ切替（framer-motionでアニメーション）
src/components/             FrameTable・PunishChecker等のコンポーネント
src/data/shared.js          共通定数・確反計算ロジック
src/data/framedata.json     変換済みフレームデータ（生成物、Pythonが出力）
src/hooks/usePersistedState.js  localStorage永続化フック
src/i18n/strings.js         UI文言の日英辞書
src/i18n/LanguageContext.jsx 言語state管理（Context）
src/styles.css              スタイル
public/icons/               キャラクターアイコン（Viteの静的配信フォルダ）
data/raw/                   FATの生データ（再変換用キャッシュ）
scripts/fetch_framedata.py  データ取得・変換スクリプト（Python、変更なし）
scripts/ja_names.json       技名の日本語マッピング
legacy-vanilla/             旧バージョン（ビルド不要のvanilla JS版、参考用に保存）
```

## ビルド（配布用の静的ファイルを作る場合）

```
npm run build
```

`dist/` に静的ファイル一式が出力されます（`npm run preview` でローカル確認可能）。

## クレジット

- フレームデータ出典: [FAT - Frame Assistant Tool](https://github.com/D4RKONION/FAT) (GPL-3.0)
- Street Fighter 6 は CAPCOM の登録商標です。本アプリは非公式のファンメイドツールです。

## ライセンス

このプロジェクトは [GPL-3.0](LICENSE) の下で公開しています（同梱するフレームデータの出典元FATがGPL-3.0のため）。
