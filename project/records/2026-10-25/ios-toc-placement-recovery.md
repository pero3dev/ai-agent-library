# 遅延生成する本文の目次移動を回復する

## 作業契約

- 目的: IOS-10・25で観測した目次移動の未到達に対し、本文の遅延生成後も有効な要求だけを再配置する。
- 基準: PR #260統合後のmain `66e4c05634f04b1d69934a15ee4676fc0aa05903`。版0.2.12（14）を保持し、実機へ導入しない。
- 所有: NativeReaderView、新しいFoundationの配置制御と7件の試験、Xcodeの2ファイル登録、本記録と索引。他者の変更を戻さない。
- 許可根拠: ユーザーによるTODOの自律実装・段階的commit/PR/通常main統合の依頼。追加の実機確認は未完了で記録する。
- 終了条件: 内容レビュー後、正確なPR headで通常CI・iOS単体・UI・Releaseを確認する。契約は[AGENTS](../../../AGENTS.md)・[Git規約](../../../harness/git-rules.md)に従う。

## 観測と修正範囲

PR #261の全記事run40188857118と、PR #265のrun40198387801で、目次「関連トピック」の選択後に本文が「チェックリスト」付近・87%で停止した。後者の機能UI12件は10成功・2失敗でReleaseへ進まなかった。もう1件の専用記事の失敗は、背後のnavigation barを含めたテストの幾何判定による誤判定候補で、本文の未到達と分ける。同じ目次codeのPR #260同期headでは機能10件が成功しており、間欠性と未確定の原因を記録する。 統合後のmain `66e4c056`のrun40201701432でも関連トピックの1件が再発し、機能10件中9成功・1失敗でReleaseへ進まなかった。通常CI・Pagesとnativeの単体/通常UIは成功した。

既存処理には、containerへ一度だけ移動した後、未生成のleaf markerを短時間確認して終了し、未整列でも完了と同じ扱いへ進む経路があった。このコード上の回復不足を修正する。実画面の失敗原因をそれだけで断定するものではない。

新しい処理はdisplay frameを待ちながら、同じ世代・操作epochが有効な間だけcontainerの生成と実markerへの補正を有限回行う。offsetの発行と整列確認を分け、後続2回の整列観測で完了する。ユーザーのpan開始、root交換、sceneの非active化、離脱や新しい要求で古い要求を失効させる。gesture delegateや設定を上書きせず、期限・取消でframe待機を終える。

1秒・60 layout pass・初回移動後の再生成要求を最大6回・補正6回・0.5ptは試作の有限化と幾何許容差であり、性能の受入目標ではない。失敗時に古いfocusや移動を再実行せず、通常の読書位置追跡へ戻す。検索の入れ子leaf、既存目次・保存形式・VoiceOverの意図を保つ。

## 検証と残件

Foundationの制御ロジック7件はMac XCTestで実行成功した。Xcode16.2・Simulator SDK18.2ではApp依存・候補reader/policy・既存NativeInline24件・新7件を限定型検査し、diagnostic0で成功した。Xcodeの全target buildや、iOS上の126件の登録・実行を済ませたという意味ではない。監視用scriptのstat競合による初回の結果不明と、監視修正後の正式な成功を区別する。

候補の独立レビューと、共有workspaceの後続候補を含むsuperset共通検査765件中750成功・15skip・失敗0を確認した。この765件には最終treeに未収録のClock/CSV36件とSDK署名7件が含まれ、最終treeそのものの検査ではない。正確なheadの共通検査はHostedで取得する。UIKitの実配置、CADisplayLink・実pan・SwiftUIの描画、全記事UI、VoiceOver・最大文字・実機は未確認。前面barを選ぶテスト側の修正は別単位で扱う。IOS-10・23・25全体は完了にしない。[JSON](ios-toc-placement-recovery.json)へソースと私有証拠のSHAを保存する。
