# 全記事を組み込む候補アプリのHosted UI検査

## 作業契約

- 目的: [M4](../../plans/engineering/ios-app-completion.md)の受入を、全記事の変換・CLI検証から実アプリのDebug/UI/Releaseへ進める。
- 許可根拠: ユーザーのTODO順の自律実装とcommit・PR・main統合の依頼。既定切替・実機導入・有料登録・公開申請を含めない。
- 基準・所有: 全記事同梱候補PR #253。UI担当は一覧/本文の識別子と既存/新UI tests・project登録・ローカルUI runnerを担当し、失敗後は本文の配置・目次発火・対応するunitへ範囲を広げた。CI担当は新候補workflowと通常workflow、親はREADME・計画・記録・Gitを担当する。他者の差分を戻さない。
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

初回0.2.7（9）は件数header・操作識別子・新test登録が中心だった。Hostedで実際の目次到着位置の不具合が見つかったため、0.2.8（10）では以下の本文配置修正も含める。保存field・schema・app rootは維持する。

## 準備時の検証と残件

Xcode 16.2・iPhoneSimulator18.2のbuild-for-testingでUITests targetのcompileが成功した。最初のXCTNSPredicateExpectation引数名の準備失敗を修正し、最終結果と区別した。新Simulatorは起動していない。pbx lint・shell構文・空白検査、通常3/fixture4のmanifest SHA不変を確認した。

workflow2本のYAML・全23run stepのshell構文、tracked published件数199、ハーネス試験76件と静的check-harnessが成功した。独立レビューで8ソースの凍結SHA、3シナリオの原文/候補metadata、通常クラス限定と期待envの接続を確認し、必須修正なしだった。通常用READMEのgeneric test例もクラスを限定した。

## 初回Hostedの失敗と修正

[初回候補run40167723261](https://github.com/pero3dev/ai-agent-library/actions/runs/40167723261)、head 09acf0de…では、実Debug bundleの199記事・全SHA・全本文と単体57件に成功した。UI5件は大図・長文復帰の2件が成功し、Transformer目次・一覧復帰・最大表の3件が失敗した。Releaseは失敗後に実行していない。同headの[通常3記事run40167723203](https://github.com/pero3dev/ai-agent-library/actions/runs/40167723203)は単体57件・UI2件・Releaseが成功し、Actionlintも成功した。

録画と階層から、目次後の見出しがY13.3で上部バーへ隠れる実不具合を確認した。最終配置では同じ縦UIScrollViewとleaf markerのcontent座標を使い、adjustedContentInsetを反映して有効範囲へclampする。横表・UITextView・drag中・旧要求を補正対象にしない。目次の要求はsheetを閉じた後に発火し、読書位置の判定も同じvisible topへ揃える。

一覧復帰は成功していたが件数headerが画面外だったため、本文の消失と検索欄の表示を確認してheaderを表示させてから件数を検査する。表は画面外の右端セルのhittest照会がドラッグ前に例外となっていた。実際に横移動し、可視になった末尾セルの操作可能性と文字を引き続き検査する。目次のassertを手動スクロールで補う変更はしていない。

修正版はXcode16.2/Simulator18.2 SDKでapp・単体63件・UI5件のcompileが成功した。新しい回帰6件のうちpure配置/位置判定3件はMacで実行成功、UIKit marker3件はcompileまで。独立レビューは修正6ソースを承認し、共通check600件中585成功・15skip・失敗0も確認した。最初の共通checkはmacOS既定tempパスのsymlinkを既存の安全検査が拒否したため、既定の`TMPDIR=/private/tmp`を指定してソース変更なしで取り直した。修正後のHostedと実画面の成功は未確認である。

待機時間とgesture回数の上限は同期用で、性能の合格値ではない。全章・全記事の視覚確認、更新/import UI、オフライン実機・VoiceOver・性能、既定199記事採用は残す。[JSON](ios-published-candidate-ui.json)へ実行面を分けて保存する。
