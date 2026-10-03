# 公開正本から再現する保守・制作の基準値

Issue [#168](https://github.com/pero3dev/ai-agent-library/issues/168)の初回基準値。基準日は2026-10-03（日本時間）、入力HEADは`d990973c2c02b6108cd9911fc06e45b3a29f9332`です。この作業の後続修正や未公開runを混ぜません。

## 分母と入力

[集計JSON](maintenance-baseline.json)は全入力のパス・Git blob SHA・バイト列SHA-256を保持します。[集計スクリプト](maintenance-baseline.mjs)は作業ツリーの記事ではなく指定commitの`git ls-tree`/`git show`を読み、既存のfront matter解析と音声のLF正規化digest関数を再利用します。helperが指定commitと異なれば停止します。

| 項目 | 固定HEADでの値 | 分母・確認範囲 |
| --- | --- | --- |
| published学習記事 | 199本、16章 | `docs/NN-section/*.md`のREADMEを除く199本。章別内訳はJSON |
| Pythonサンプル | 6件 | 追跡済み`examples/python/*/README.md`。既存の動作確認日・mock/SDK/実API宣言をJSONに原文で保持。この集計で再実行しない |
| 公開音声付き記事 | 9 / 199本 | 固定HEADの`website/audio/catalog.json`にある一意article_path |
| 音声part・episode | 9件 | カタログの全9episodes。MP3取得・デコード・聴取は対象外 |
| 原文digest不一致 | 0 / 9episodes | カタログsource_digestと固定HEADのLF正規化記事SHA-256を照合 |
| コミット済み鮮度run | 5 JSON | `research/freshness-runs/*.json`の追跡済み5ファイル |
| runが宣言する対象記事 | 13一意パス | 全observationsのaffected_docsの和集合。記事全文の観測完了を表さない |
| runが宣言する観測系統 | 6種類 | observationsのsystem_idの和集合。章数やlast_updatedを代用しない |

JSONにはrunごとの宣言時刻・対象主張・観測status・取得元/取得時刻を保持します。[9/10の初回横断監査](../2026-09-10/freshness-audit.md)と[反映記録](../2026-09-10/freshness-update.md)は別証拠で、5runの件数へ加算しません。ローカル未公開run・queue・認証・稼働状態は取得していません。

## 再現と次回比較

リポジトリrootでNode.js 22以降とGitを使って実行します。ネットワーク接続、音声制作、有料API、追加依存は不要です。指定commitのGit objectを保持しているcheckoutで実行してください。

```powershell
node project/records/2026-10-03/maintenance-baseline.mjs --ref d990973c2c02b6108cd9911fc06e45b3a29f9332 --output baseline-replay.json
if ($LASTEXITCODE -ne 0) { throw '集計に失敗しました' }
Get-FileHash baseline-replay.json -Algorithm SHA256
Get-FileHash project/records/2026-10-03/maintenance-baseline.json -Algorithm SHA256
```

同HEADを2回集計し、JSONのSHA-256と全件数・digest判定が一致することを検証します。次回は新しいHEAD・基準日を別記録に固定して、published/章別数・サンプル宣言・音声coverage/part数/旧版数・runの宣言範囲を同じ方法で比較します。`baseline_date_jst`は今回の初回記録日なので、将来の基準値ではその意味と日付を更新します。

制作成功率・滞留時間・稼働頻度・周期超過・維持工数・学習成果は根拠がないため全て`unknown`です。公開カタログは成功した公開物の集計であり、試行全体の分母にはなりません。鮮度ティア、周期、KPI目標、引退方針は採択しません。
