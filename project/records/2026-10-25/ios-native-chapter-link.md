# 本文の章リンクをネイティブ章案内へ接続

## 作業契約

- 目的: [IOS-14](../../plans/engineering/ios-app-completion.md)のうち、本文の既知章リンクからオフラインで章案内と記事へ進む。
- 許可根拠: ユーザーの自律実装・commit・PR・main統合の依頼。新たな実機確認は未完了として記録する。
- 基準: More入口を修正したPR #259、head 5ac6881b。今回の版は0.2.12（14）。
- 所有: UI担当はNativeLearningViews・ArticleReaderView・NativeReaderView・LearningNavigationTests・PublishedReaderUITests・Xcode版番号の6ファイル。親は文書・独立レビュー・Git統合。他者の変更を戻さない。
- 終了条件: URLの厳密な振り分け、既存導線と保存の維持、Mac helper・SDK compileと未完了Hosted/実機を分けてPRへ保存する。
- 適用: [共通契約](../../../AGENTS.md)、[Git規約](../../../harness/git-rules.md)、[iOS手順](../../../ios/README.md)。

## 既存本文と最小の接続

全199記事の原文と学習付き候補を読み取りで照合した。前提知識405リンクと関連トピック1,411リンクの順序付きtargetに不一致はなく、両見出しも全記事で保持されていた。前提知識は本文であり、学習索引へ別fieldとして重複保存する変更は不要だった。索引v1のfield集合を維持する。

関連のうち章READMEへの1リンクは外部URLだった。学習索引が有効な場合に限り、既知16章の正規URLを章案内sheetへ振り分ける。README順の記事を選べるようにし、閉じると元の記事へ戻る構造にした。本文のリンクと説明文、既存の章絞り込み・用語集は保持する。

fragmentなしと空の#は同じ章入口として扱う。別origin・credential・明示port・query・非空fragment・未知章・encoded aliasと索引不在は従来のbrowser fallbackを使う。既存の用語集URL guardを保持し、Python例10リンクは同梱対象外の通信が必要な参照として残す。パーサー・本文/manifest/索引schema・音声・保存キーは変えない。

## 検証と残件

Macでは既存4件と新規2件のURL/helper回帰6件が成功した。Xcode16.2・Simulator SDK18.2の累積build-for-testingも成功し、章6ファイルと前提のMore/0件修正を含むapp・unit・UIをcompileした。Simulatorや実機で実行した結果ではない。

全記事UIには、usecase-discoveryの関連リンク・説明文から13章案内を開き、閉じて元の段落を確認し、再び開いて章の先頭記事へ進み、戻る1件を追加した。既存9件の本文は変えず、新1件を含む10件は最終headで未実行である。見えないリンクを直接callbackで実行する試験にはせず、実際のリンクをtapする。

LibraryViewの検索中More入口修正は前提PRに含まれ、今回の6ファイルへ混ぜない。正確な最終headのHosted通常/全記事・Release、VoiceOver・最大文字・実機、全記事の既定採用とIOS-14全体の受入は残す。[JSON](ios-native-chapter-link.json)に凍結SHAと実行面を記録する。
