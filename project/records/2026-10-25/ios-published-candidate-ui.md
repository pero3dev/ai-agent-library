# 全記事を組み込む候補アプリのHosted UI検査

## 作業契約

- 目的: [M4](../../plans/engineering/ios-app-completion.md)の受入を、全記事の変換・CLI検証から実アプリのDebug/UI/Releaseへ進める。
- 許可根拠: ユーザーのTODO順の自律実装とcommit・PR・main統合の依頼。既定切替・実機導入・有料登録・公開申請を含めない。
- 基準・所有: 全記事同梱候補PR #253。UI担当はLibraryView・NativeReaderView・既存/新UI tests・project登録・ローカルUI runnerの6ファイル、CI担当は新候補workflowと通常workflowの2ファイル、親はREADME・計画・記録・Gitを担当する。他者の差分を戻さない。
- 検証・終了条件: 旧2件の本文・目次・しおり復帰を保ち、新3件を本物の全記事bundleで実行する。正本件数、Debug実bundleとReleaseのSHAを確認する。静的準備・SDK compile・Hosted実行・実機を区別する。
- 適用: [共通契約](../../../AGENTS.md)、[Git規約](../../../harness/git-rules.md)、[同梱候補の準備](ios-published-library-profile.md)。

## 対象と構成

旧open helperの1回swipeでは199記事中のTransformerへ届かないため、title検索・stable row ID・上限付きswipeへ変更した。通常jobとローカルreaderは既存クラス2件に限定し、新しいPublishedReaderクラスは全記事候補jobで実行する。任意のapp rootを注入せず、実際の通常Contentを同梱する。

候補jobは全publishedを1回生成し、fixture4記事を追加生成する。独立した原文監査とPackageAuditの後、unit全件、Debug実appのmanifest一致・全SHA・全本文、全UI、Releaseの全SHA・TestContent不在を確認する。期待記事数は追跡済みpublished原文から別に算出する。

`TEST_RUNNER_AILIBRARY_EXPECTED_PUBLISHED_COUNT`はXcodeがprefixを除いてtest runnerへ渡す。新クラスは正のIntかつ3超を必須とし、値の欠落・不正・代表3記事をskipで通さない。公開の件数headerと期待Nを照合する。Xcode 16.2付属の公式xcodebuild manとCIの値受け渡しを独立に確認した。

| 範囲 | 実行する操作 | 対象 |
| --- | --- | --- |
| 既存2件 | 本文非空、Transformer目次・しおり・終了再起動復帰 | 01章のAgentループ/ツール使用、11章Transformer |
| 新規1件 | 大図の拡大・150→100%・閉じる・Mermaidテキスト表現 | 03章モデル選定 |
| 新規1件 | 深い目次移動・しおり・再起動後に近い見出しへ復帰 | 03章OpenAI prompting |
| 新規1件 | 14行×9列の表の最終行・横移動・最終列 | 08章コーディングエージェント比較 |

LibraryViewの変更は件数headerと少数の識別子、NativeReaderViewは4つの操作識別子だけ。保存・schema・rootの変更はない。projectは新test登録だけで、版0.2.7（9）を維持する。

## 準備時の検証と残件

Xcode 16.2・iPhoneSimulator18.2のbuild-for-testingでUITests targetのcompileが成功した。最初のXCTNSPredicateExpectation引数名の準備失敗を修正し、最終結果と区別した。新Simulatorは起動していない。pbx lint・shell構文・空白検査、通常3/fixture4のmanifest SHA不変を確認した。

workflow2本のYAML・全23run stepのshell構文、tracked published件数199、ハーネス試験76件と静的check-harnessが成功した。独立レビューで8ソースの凍結SHA、3シナリオの原文/候補metadata、通常クラス限定と期待envの接続を確認し、必須修正なしだった。通常用READMEのgeneric test例もクラスを限定した。

新候補workflowのHosted完走・Actionlint・40分枠とUIの実通過は未確認である。待機時間とgesture回数の上限は同期用で、性能の合格値ではない。全章・全記事の視覚確認、更新/import UI、オフライン実機・VoiceOver・性能、既定199記事採用は残す。[JSON](ios-published-candidate-ui.json)へ実行面を分けて保存する。
