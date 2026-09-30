# PR62 公開証拠と独立受入

**approved / low、must 0・should 0。PUBLIC-V1は公開修正版で解消し、C2と既存7記事を計8記事の範囲で受け入れています。** 判定は[独立公開レビュー](../inference-score-spacing-public-pr62-review.md)と[完全JSON](../inference-score-spacing-public-pr62-review.json)によるものです。この移管作業自体は新たなレビューや実行ではありません。

対象merge `5940334a6fd3aab8178cfeb8746a58c8b937d390`、main run `36615994124`、BUILD_ID `FnChqMe5DEINmNrKQkZeM`。独立レビュー時刻は `2026-09-29T19:43:48.515Z`、担当は `/root/pretraining_visual_review`。

## 保存した証拠

- [索引](index.json)は元path/SHA256/bytesとrepository-relativeな保存path/SHA256/bytesを対応付けます。gzipは元バイトへ復元できます。元PCの絶対pathはraw内で変更していません。
- Git/CIはPR checksの11 SUCCESSとdeploy SKIPPED、mainの10 jobs成功、初期IN_PROGRESSとwatch履歴を保持します。元の成功・失敗・途中状態を新しい判定へ書き換えていません。
- [collector](artifact-evidence.json)と[8HTML移管表](collector-html-manifest.json)はexact main CI artifactから得た期待値です。HTMLのraw SHA/bytes/BUILD_IDを確認済み。artifact API digestとtar SHAは別で、ローカルoutや公開HTTPを期待値に転用していません。
- 公開Edge・WebKitは各91件成功、失敗0。[観測assets](observed-assets-manifest.json)は各72件の値と順序を保持します。両engineで共通72 URLのhash/bytesは一致します。
- [独立レビュー証拠対応表](review-evidence-map.json)はreview.evidence全29件を保存先へ対応付けます。focusedの結果、補助runner、provenance、path guard修正前後、失敗log、修正後log、旧レビューのrawコピーを含みます。
- [実視認台帳](viewed-images.json)は元47件のメタデータを全文保持し、無加工PNGの保存先へ対応付けます。47件はfocused36とcurrent Edge full91の代表11。Edge29・WebKit18、全図38・viewport9です。

## 画像受入の範囲

総生成は全91実行の1339枚とfocused64枚、計1403枚です。新しく実視認した47枚だけをこの保存先へコピーしました。1403枚すべてを視認したとは主張しません。旧公開90枚、ローカル画像、root補助視認を47へ加算していません。

受入はPR61の既存独立レビューの確認範囲と、今回の修正箇所32scene＋代表viewport4・現公開代表11を組み合わせたものです。他7記事の凍結inputDigest一致、現公開全91×2、bbox比較を根拠としており、すべての旧図を今回再視認したという意味ではありません。原PR61のchanges_requested判定とローカル履歴は変更していません。

低い画面のviewport2枚は一部が画面外ですが、別の無加工full-sceneを視認済みです。390幅の数値は約9.84〜10.01 CSS pxで、PC中心の間隔修正としての承認です。物理iPhone/Safari、実スクリーンリーダー、物理印刷、新性能/CLS計測は未実施です。

## 補助検証器とraw pendingの扱い

focused初回の両engineはTEMP helperが正規のNextルート名を拒否し、browser起動前に停止しました。原helperと失敗logを保存し、path区間が親参照である場合だけ拒否する修正の前後・provenance・offline11項目を保持しています。別時刻の再実行は各16、計32観測成功です。この初回失敗を製品や全91の失敗と混同しません。

full/focused runnerのvisual pending欄は原バイトのままです。別の最終独立レビューがその判定を与えるため、indexと復元確認のpublicAcceptedをtrueへ結合しました。rawをapprovedへ書き換えたわけではありません。Edge focusedの66 ERR_ABORTED等もrawとレビューの分類を保持しています。

## 再開と復元

[archive-verification.json](archive-verification.json)はgzip・PNG・台帳・review hashの保存整合確認です。実行/レビューの再実施ではありません。current working treeの8入力は再計算せず、actual mergeと凍結PR62 snapshotに結合しました。D1以降の作業が進んでも、この公開版の証拠を上書きしません。

全tarと未視認の全PNGは保存していません。別PCではindex、collector-html-manifest、review-evidence-map、viewed-imagesのrepository-relativeな保存先を使用します。上位の[8記事受入snapshot](../diagram-acceptance-pr62.json)はrootが作成したrecorded-evidence-only記録です。本担当はgates・top records・製品・kit・Gitを変更していません。

過去の[PR61公開画像レビュー](../../2026-09-25/pretraining-public-evidence/README.md)と[修正候補のローカル証拠](../inference-score-spacing-evidence/README.md)もそのまま参照できます。
