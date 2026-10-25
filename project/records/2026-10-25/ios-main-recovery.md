# 前提依存PRの限定復旧とiOS段階統合

## 作業契約

- 目的: 修正前mainの依存監査が修正PR自身を阻む状態をPR #240だけの限定例外で復旧し、保護を維持した通常の段階統合へ戻す。
- 許可根拠: ユーザーが「PR #240だけを対象に限定した管理者復旧を許可する」と明示回答した。当該チェックの一時変更が必要な場合はその変更と直後の復元までに限定する。PR #241以降への例外は許可されていない。
- 開始状態: main `405e29273a7a3257adeb370c6ac3196d35693d4d`、PR #240 head `57c96d24c8682aab20485a004a4dd20d3abcf520`。mainはprotectedで11必須チェック、全員に適用されている。通常10検査は成功し、Harness policyだけがtrusted baseのmarkdown-it highで失敗していることを再確認した。
- 所有: 親がPR metadata・検証head・squashの形式確認、限定したGitHub操作、復元確認と記録を担当する。独立読取担当が例外条件と復元項目を監査する。他者のファイル・別PRの保護や許可を変更しない。
- 手順（開始時点の採択）: まずPR単位の管理者例外で完了できる方法を確認する。必要時だけharness-policyの必須条件を一時変更し、PR #240を確認済みhead・検証済みsquashで統合後、直ちに元の条件へ復元する。復元とmain実行結果を確認してから後続へ進む。
- 終了条件: 実merge SHA・メッセージ、元の11必須チェックとその他の変更した条件の復元、main CIの結果を保存する。後続PRは通常のmain同期・最終head検査・レビュー・squashで進める。実機・契約・課金・App Store公開の追加操作は行わない。
- 適用: [共通契約](../../../AGENTS.md)、[Git規約](../../../harness/git-rules.md)、[前提依存の記録](markdown-parser-security-update.md)、[iOS統合前チェックポイント](ios-autonomous-progress.md)。

## 状態

この記録はPR #248統合後、main CI `40159510477`とPR #241の再検査が進行中の時点のsnapshotである。PR #240限定の復旧と保護復元は完了し、例外は終了している。後続PRは通常の11必須チェックで統合する。[JSON](ios-main-recovery.json)へ変更前の値と各工程を保存する。

開始時は接続APIの管理機能に制約があり、PR単位で完了できない場合はGitHubの管理画面で必要な範囲だけを操作する方針とした。以下はその経緯であり、現在の再認証・許可待ちを示すものではない。

trusted base `405e2927`のscripts・harnessを隔離し、修正版markdown-it14.3.3でHarness policy本体を同じbase/headに対して実行して成功した。最終PR metadataを通常10検査の成功と限定復旧条件へ同期し、trusted baseの形式検査と正規squash生成も成功した。

API mergeはharness-policy必須条件で拒否された。管理画面では全条件を管理者にも適用する設定のためPR単位の例外がなく、harness-policyの必須条件だけを一時的に外す入力を準備したが、保存前にGitHubのConfirm accessで本人再認証を要求された。この待機時点のserver側は11チェックのままで変更されていなかった。認証後に変更が自動再開されても元の11条件を保つよう、元の全条件で保存し直した状態を認証待ちへ引き継いだ。本人へGitHub内での認証を依頼し、資格情報は受け取らなかった。

本人の再認証完了後、harness-policyだけを一時的に必須条件から外した。残り10チェックと全員への適用をAPIで照合し、確認済みheadを指定してPR #240をsquashした。実mergeは`9c2b0466ea82886985b921fa9e0fffe4ae9e9231`。統合直後にharness-policyをGitHub Actions由来の必須条件へ戻し、11個の名前・app ID・全員への適用と、変更前の15 checkbox flagすべての一致を確認した。条件に恒久変更はない。

実mergeのtreeは候補`57c96d24…`と同一で、件名・本文は検証したsquashと一致し、名義の再検査も成功した。後続PR #241は通常の2親mergeで同期し、索引再レビューの1指摘を追加commitで解消した当時のheadは`67678a1882317b4d08718d12bb650822b82f07dd`だった。元native sourceとmainのsecurity・websiteを保って通常CIへ戻した。例外はこの時点で終了し、後続には使わない。

## 復旧後の通常修正と段階統合

復旧後のmain CI [40155939255](https://github.com/pero3dev/ai-agent-library/actions/runs/40155939255)は、遅延読込のSVGに寸法予約がなく見出し位置がずれるため、build内のbrowser検査で674件成功・5件skip・1件失敗となった。依存監査の循環とは別の通常回帰である。

修正は通常の[PR #248](https://github.com/pero3dev/ai-agent-library/pull/248)、head `7860fc9e3b955f1cc29163821b3a68670715ab4f`へ分け、11必須チェックの合格を確認してmain `c4eb4927daf62e5decbf2e4d618474775b4ec331`、tree `f2cac35ecede470c9259a09a6f18fb877d8327c2`へsquashした。保護例外は使っていない。このmainのCI [40159510477](https://github.com/pero3dev/ai-agent-library/actions/runs/40159510477)はsnapshot時点で進行中であり、結果は未確認である。

PR #241は`67678a1882317b4d08718d12bb650822b82f07dd`と修正済みmain `c4eb4927…`を親とする通常2親mergeで再同期した。新headは`957dffc82806710c4cb71af35ba9916d7a621da4`、treeは`c4633233ab03125d2ca1501e1b5d08f8442d03ab`。独立照合は合格し、最終headのCIを取り直している。mainへの統合完了とはしない。

並行した全記事の一時packageは[PR #249](https://github.com/pero3dev/ai-agent-library/pull/249)、head `bee33d124d53aa3897e12fcb56ba0b9ac2c3b5fd`へ12ファイルを保存した。baseはPR #247、draftであり、199記事の実consumer監査は成功しているが、開始済みHosted検査の結果は未確認である。後続の統合やIOS-13・15の完了を、この保存だけで成功と扱わない。

## 通常統合の後続snapshot

PR #241〜246は全件を通常の最終head検査と独立tree照合を経てmainへsquashした。最新mainは`81b5da90796e061d3e2230b941f9156a61f822bc`。PR #240の管理者例外を再利用せず、11必須チェックと元の保護設定を維持した。各実merge SHAと正規メッセージ・treeの照合はJSONおよび[自律実施記録](ios-autonomous-progress.md)へ残す。このsnapshotでは最新mainのCIは実行中であり、直前mainまでの成功と区別する。
