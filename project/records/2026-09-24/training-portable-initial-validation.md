# C1公開検査キット候補

現manifest: `9fb0fb0d951d7ba52728b080b86948efc5bcfd6acf3288d5d044c13f6612c6a3`。独立コード・画像レビュー待ち。

旧58ケース＋C1新13件、固定7route、全10stage・9 READ・6画面条件・11 selector値を維持。追加sourceEditsの逆適用でラベル中間版と旧B保護区間hashへ復元する。

提出前の空白検査に合わせinference末尾LFを1byte削除。承認済みPR58元と旧B元のraw/LF正規化hashを保持。末尾LF復元→PR58一致、末尾復元＋2assert逆適用→旧B一致を機械検査。本文・fixture・case・C1モジュールの意味変更なし。

再確認: Windows19/19、skip0、prep71登録名・7route・全逆適用成功、変更Node構文2/2（C1初期の構文5/5・PS parserも成功）。候補hashを更新した末尾LF過不足2種を拒否。collector実route検査ブロックで正常7件成功、欠落・重複・未許可routeを拒否。合成tarの欠落・重複・BUILD_ID不一致も拒否。

専用localhost予行:

- chromium: 13/13成功、68画像、text BBox overlap候補24件、外部request 0。manifest `ab739274b10433c0d019a27fd062b9f21270fb530365a7bee7cd358237c118b7`。
- webkit: 13/13成功、68画像、text BBox overlap候補0件、外部request 0。manifest `9fb0fb0d951d7ba52728b080b86948efc5bcfd6acf3288d5d044c13f6612c6a3`。

Chromiumは末尾修正前の原証拠を保持し、意味変更のない後継との関係を別記録した。WebKitは現候補の実行。両方とも同一のroot完成static export（BUILD_ID FCghSEE6NdR0foJwlZB7g）を前後hash照合した。旧58公開caseをこの予行で再実行したとは扱わない。

原result・adapter・PNGを改変せず、重なり候補の参照だけ別JSONへ抽出した。画像の独立判定は保留。Git操作・GitHub API・公開HTTP・Linux・実機iPhone実行は担当内では未実施。

固定版: `TEMP/ai-agent-library-C1-portable-whitespace-candidate`。初期版: `TEMP/ai-agent-library-C1-portable-initial-candidate`。ラベル中間版と旧元キットのsnapshotも保持。全hash、履歴、raw evidence参照は隣接JSON、変更候補はdiff、画像候補索引は `training-portable-geometry-review-candidates.json`。
