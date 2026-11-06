# iOS自用候補のチェックポイント

2026-11-06。[PR #360](https://github.com/pero3dev/ai-agent-library/pull/360)の製品Source `15027b5b7593` を、通常main [`5494bad3c216`](https://github.com/pero3dev/ai-agent-library/commit/5494bad3c21687554b33366cb79f9592ef774dac)へ統合した。Appは0.2.34（36）、treeは`0172ebac5df3`、追跡3,292ファイル。実commit・親acf・全tuple・正規本文を照合した。新mainのpush CIは本記録作成時点で観測中・未受入であり、新版の実導入やアプリ全体の完成は示さない。

## 採用範囲と確認結果

[自用範囲](../2026-10-28/ios-personal-use-scope.md)と[同梱更新方針](../2026-10-30/ios-personal-bundled-update-policy.md)を継承する。iPhone・iOS17以降、全published199記事のSwiftUI同梱と記事・検索のオフライン、アカウントなし、既存音声1本のストリーミングが初版の範囲である。更新は再ビルド同梱を主経路、信頼する既存の手動importを補助とする。

| 実行面 | 製品Source1502で受け入れた範囲 |
| --- | --- |
| 共通検査 | [CI](https://github.com/pero3dev/ai-agent-library/actions/runs/42144686015)と[Full A](https://github.com/pero3dev/ai-agent-library/actions/runs/42144686008)で固定依存を準備。Full Aの全10工程は1,670件中1,654成功・16skip、Linuxは1,651成功・19skip、Windows別検査は285件中284成功・1skip |
| iOS機能 | Core326件中324成功・既知skip2、追加6件と不存在条件を拡張した既存ケースが成功。Native UI8、同梱版A20・B8、374byteのコピー照合、改訂・欠落／復元・文字サイズ・回転の専用回帰、Runtime26の代表3件が成功 |
| Archive | [SDK26](https://github.com/pero3dev/ai-agent-library/actions/runs/42144686571)の署名なしarm64 Archiveで199記事・音声1本、版・Privacy情報と限定Release8文字列監査を確認。source37の固定照合は別途API結合した5パスを含まない |

コピーはCI hostのvalidator結果とmarkerの確認であり、clipboard本文の独立取得ではない。期待本文のSHAとvalidatorファイルのSHAを区別し、後者には旧記録の未検証ラベルを採用しない。

関連11workflowと必須11、Ready・最終本文後の新policy2件を確認して通常統合した。専用回帰4本の小証跡は型付きの端末・source・context・cleanupを照合した範囲で、raw argvをすべて取得したわけではない。Runtime26のcleanupは工程成功までで、個別の削除後不存在receiptは未取得である。

旧95b・0ac・755・e50・2aec・788の失敗と制御再検証は[同梱起動記録](../2026-11-04/ios-fresh-bundled-launch.md)へ保持し、新成功で消さない。788の読書復帰失敗はreader存在待ち**20秒**で、直前のResume操作可能性待ち15秒とは異なる。PR #352の[acf手動Memory](https://github.com/pero3dev/ai-agent-library/actions/runs/42084876691)はsource7・3指標各3標本（kB）・CSV11列1行の歴史であり、現Appの測定・性能予算には転用しない。

## 残件と文書単位の検証

[完成版TODO](../../plans/engineering/ios-app-completion.md)の32行・16完了と全条件を保持する。実機、VoiceOver、最低iOS17の機能、OS通信オフ、新版の新規導入・上書き保持、IOS-15・25・28全体は未完了である。Store配布、音声9本のカタログ受入・キュー・保存、独立ネットワーク更新、性能baseline・budgetは後続とする。

この文書単位は事実訂正1ファイルとチェックポイント4ファイルの2commitに分ける。容量条件によりローカル全共通検査は未実施。提出前CIのlint・docs・harnessは共通10工程中8工程に相当する構成で、残るアイコン検査・記事TODO抽出は入力同一性の影響分析と実行結果を区別する。最終文書mainのFull Aによる全10工程・各CIと、通常統合後に1回行う管理作業環境への反映結果は、PR・外部ローカル記録で別に追跡する。管理作業環境は現在e617のままである。
