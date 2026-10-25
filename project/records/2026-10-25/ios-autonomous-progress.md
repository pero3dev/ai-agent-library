# iOS完成版TODOの自律実施

## 作業契約

- 目的: [完成版TODO](../../plans/engineering/ios-app-completion.md)の優先度と依存に沿い、M0の基準化から実施可能な作業を継続する。
- 許可根拠: ユーザーが、コミット・PR・mainマージを含む計画の追記後に、TODO順で可能な限り自律的に作業を進め続けるよう明示依頼した。既存の同じiPhoneでの署名・導入・試験の許可も引き継ぐ。
- 開始状態: `main`、HEAD `405e29273a7a3257adeb370c6ac3196d35693d4d`。既存のiOS実装・生成処理・試験・計画・記録は未コミット。受入済み版は0.2.2（4）。
- 所有範囲: iOS一式、`scripts/build-ios*`・`scripts/lib/ios*`と関連単体試験、既存iOS対応の共通設定・配置検査・ライセンス、関連する計画・調査・記録。無関係な他者の差分を取り込まない。
- 分担: 親がGit統合・検証・PR・main反映と記録、独立した読取担当が生成処理とSwiftアプリをそれぞれレビューする。後続実装の担当はファイル境界を分ける。
- 検証: lockfileの依存準備、共通検査、生成・CoreSmoke・SDK build/testと既存実機受入の版を区別する。PRの最終headで必須CI・レビューを確認し、実merge SHA・main CI・影響する公開内容を確認する。
- 終了条件: 各単位は検証・レビュー・commit・PR・main反映を追跡する。本人の契約・有料登録・設備更新・実機操作が必要な部分だけ明示し、依存しない作業を継続する。
- 外部操作: 計画に沿う同じGitHubリポジトリへのbranch・commit・push・PR・mainマージを実施する。契約承諾・課金・OS更新・一般公開申請・タグ公開は、この依頼だけで実施しない。
- 適用規約: [AGENTS](../../../AGENTS.md)、[ROADMAP](../../../ROADMAP.md)、[Git共通規約](../../../harness/git-rules.md)、[形式契約](../../../harness/git-conventions.json)、[開発と検証](../../../CONTRIBUTING.md)、[project索引](../../README.md)。

## 初期準備と段階実施の履歴

この節は当時の順序とsnapshotを保存する。現時点の統合結果は後段の「M0〜M3の通常統合」とJSONの`main_snapshot`・`checkpoints`を参照する。

開始時にM0の所有差分とremote・既存PR・worktreeを照合し、独立レビューを開始した。GitHubの対象は公開リポジトリ`pero3dev/ai-agent-library`、default branchは`main`。開始時の検索ではiOSの既存open PRは見つからなかった。以後の進捗は[JSON](ios-autonomous-progress.json)へ記録する。

M1の未採択事項は選択肢を具体化し、採用前提を必要としないM2等の実装を止めない。現在のPersonal Teamとローカル試験の範囲を、App Store公開準備の完了とは扱わない。

ユーザーの追加指示により、新たな実機操作が必要な検査は未完了として記録し、依存しない作業を続ける。重大な影響・契約・費用等の本人判断が必要な場合だけ確認する。

M0レビューで、取り込んだ音声metadataの極端な時間が整数変換でクラッシュする経路と、同じrevision・pathを使う別packageの画像cache混同を発見した。共有の24時間上限と安全な表示変換、canonical root・対象SHAを含むcache keyと回帰試験で対処する。修正を含むソース版は0.2.3（5）とし、0.2.2（4）の既存実機受入と区別する。新しい端末操作は行わない。

両指摘を修正し、独立した再レビューで解消を確認した。CoreSmokeは通常3記事とfixture付き4記事の双方で成功。iOS SDKのbuild-for-testingとRelease buildが成功し、Releaseは3記事・140ファイルのSHAが一致、TestContentを含まなかった。当時は新しいXCTest3件を含むターゲットのcompileまでであり、新規XCTestの実行と実機受入は未実施だった。通常記事の再生成では既存の`c10353c1…`と同じ版を再現した。

共通依存の監査で既存markdown-itのhighを検出したため、先に[限定依存修正PR #240](https://github.com/pero3dev/ai-agent-library/pull/240)を作成した。実CIでbase lockfileのhigh監査によるHarness policyの失敗を確認し、既存サイト依存の監査でも別のhigh・criticalを検出した。この準備時点では依存修正を分離し、保護設定・監査の回避は行わなかった。当初は接続の権限制約によりmain保護設定の詳細を取得できなかったが、branch APIでprotectedと11個の必須チェックの全員への適用を確認した。後の本人許可による限定復旧と完全復元は下記へ分けて記録する。

M0は責務別4コミットを[PR #241](https://github.com/pero3dev/ai-agent-library/pull/241)へ保存した。続いて検索ヒットへの移動を0.2.4（6）として[PR #242](https://github.com/pero3dev/ai-agent-library/pull/242)へ1コミットで保存し、M0をbaseにして機能差分を分けた。Foundation回帰と共通検査、42件のXCTestを含むSDK compile、独立レビューは成功した。新しい実機受入は未実施として維持する。

main反映待ちの間に[記事改訂後の復帰](ios-reading-revision-restore.md)と[Hosted Simulator CI](ios-native-ci.md)を独立に進める。保存は後方互換の任意anchorを追加し、CIは既存11必須チェックと保護設定を変更しない追加jobとする。CIは[PR #243](https://github.com/pero3dev/ai-agent-library/pull/243)へ先に保存し、改訂復帰をその次のPRへ分ける。CI実装をXCTest実行済みと読み替えず、PRごとに実行結果を取得する。

復旧前のPR #240はhead `57c96d24…`で通常検査10件が成功し、残るHarness policyはbase監査のhighによる失敗を再確認した。限定した管理者復旧の判断を本人へ依頼し、その回答までは例外操作を行わず、独立した機能とCIの実装・検証を続けた。

追加native CIはPR #243でXCTest42件、復帰を加えたPR #244で50件、いずれも失敗0とRelease同梱検査の成功を取得した。実機未実施のままでも、SDK compileだけだった部分をHosted Simulatorの実行結果へ進められた。続いて[IOS-19](ios-native-package-contract.md)の形式対応・future版拒否と正常版維持・producer/consumerの境界を揃え、旧HTML CLIの上書きを防ぐ。UI試験は別PRへ分け、既存2件の狭い確認範囲と残りの受入を区別する。

## 今回の統合前チェックポイント

以下はPR #248統合後、main CI `40159510477`とPR #241の再検査が進行中の時点で保存したsnapshotである。後続工程のlive状態を示すものではない。

| 作業単位 | PR | 確認結果と統合状態 |
| --- | --- | --- |
| 依存の前提修正 | [#240](https://github.com/pero3dev/ai-agent-library/pull/240) | 通常10検査成功・base監査失敗を記録後、本人許可の限定復旧でmain `9c2b0466…`へsquash。保護は完全復元し例外終了 |
| nativeの基準M0 | [#241](https://github.com/pero3dev/ai-agent-library/pull/241) | 意図別4commitを保存。修正済みmainとの通常2親同期後のhead `957dffc8…`は独立照合合格、11必須チェックの取り直し中。main未統合 |
| 検索ヒットへの移動 | [#242](https://github.com/pero3dev/ai-agent-library/pull/242) | 専用1commit。後続の同じnativeコードでHosted42件成功 |
| 生成・unit・ReleaseのCI | [#243](https://github.com/pero3dev/ai-agent-library/pull/243) | 専用1commit、Hosted job成功 |
| 記事改訂後の復帰 | [#244](https://github.com/pero3dev/ai-agent-library/pull/244) | 専用1commit、Hosted50件とRelease成功 |
| 形式契約と生成境界 | [#245](https://github.com/pero3dev/ai-agent-library/pull/245) | 専用1commit、Hosted52件とRelease成功。IOS-19完了 |
| 既存UI2件のCI | [#246](https://github.com/pero3dev/ai-agent-library/pull/246) | 専用1commit、Hosted単体52件・UI2件・Release成功。IOS-26完了 |
| Web図の寸法予約 | [#248](https://github.com/pero3dev/ai-agent-library/pull/248) | 通常の11必須チェック合格後、main `c4eb4927…`へsquash。main CIは進行中。例外なし |
| 全記事の一時package | [#249](https://github.com/pero3dev/ai-agent-library/pull/249) | baseは#247、draft、head `bee33d12…`に12ファイルを保存。199記事の実consumer監査成功、Hostedは開始済み・結果未確認 |

[runtime照合](ios-native-runtime-audit.md)では現targetに旧WebKit等が残っていないことを確認し、実装の追加削除をせずIOS-24を完了とした。実機未確認、本文block内の精度、全UI回帰や全記事展開は残る。この初期記録のチェックポイント時点では、main統合の完了を示していなかった。

復旧前のmainは`405e29273a7a3257adeb370c6ac3196d35693d4d`で、11必須チェックと保護設定を維持したまま本人判断を待った。本人の限定許可とGitHub再認証の完了後、[復旧記録](ios-main-recovery.md)に沿ってPR #240だけを統合し、11チェックの名前・提供元と全員への適用、変更前の15 checkbox flagを完全復元した。この例外は終了しており、後続PRには使わない。App Store関連の契約・支払い・公開・OS更新は別途採択の対象である。

PR #240統合前のworking treeに残したwebsite・依存記録の9ファイルは、公開head `57c96d24…`とbyte単位で一致することを確認し、nativeのコミットへ取り込まなかった。この照合は当時の分離状態の記録であり、後続のworking treeに同じ9ファイルが未コミットで残るという意味ではない。

復旧後のmain CI [40155939255](https://github.com/pero3dev/ai-agent-library/actions/runs/40155939255)は、遅延SVGによる見出し位置のずれでbuild内のbrowser検査が失敗した。通常の修正PR #248、head `7860fc9e3b955f1cc29163821b3a68670715ab4f`が11必須チェックを満たし、main `c4eb4927daf62e5decbf2e4d618474775b4ec331`、tree `f2cac35ecede470c9259a09a6f18fb877d8327c2`へsquashした。snapshot時点では、そのmain CI [40159510477](https://github.com/pero3dev/ai-agent-library/actions/runs/40159510477)が進行中であり、成功とは記録しない。

PR #241は旧head `67678a18…`とこの修正済みmainを親とする通常の2親mergeで同期し、headは`957dffc82806710c4cb71af35ba9916d7a621da4`、treeは`c4633233ab03125d2ca1501e1b5d08f8442d03ab`となった。独立照合は合格し、最終headのCIを取り直している。以降も通常のmain同期・最終headの11必須チェック・レビューを経て段階統合する。全記事の一時生成は[PR #249](https://github.com/pero3dev/ai-agent-library/pull/249)で追跡し、この時点ではdraftのHosted結果やIOS-13・15の全体受入を成功と推測しない。

## M0〜M3の通常統合

PR #241〜246を通常の二親main同期・独立tree照合・最終headの11必須検査と適切なnative CIを経て、順にsquashした。実mainは`81b5da90796e061d3e2230b941f9156a61f822bc`、source版0.2.5（7）。直前mainまではCIと公開が成功し、このsnapshotではPR #246統合後のmain CIは実行中である。実mergeの単一親・正規メッセージ・候補tree一致は全6件を照合した。

| 単位 | PR | 最終head → main | 確認結果 |
| --- | --- | --- | --- |
| native基準M0 | [#241](https://github.com/pero3dev/ai-agent-library/pull/241) | `957dffc8` → `d498716d` | 既存版の実機QAと修正版SDKを区別。11必須検査成功 |
| 検索ヒット移動 | [#242](https://github.com/pero3dev/ai-agent-library/pull/242) | `040cfbb4` → `8ea361ee` | 同じnative sourceのHosted42件と照合。11必須検査成功 |
| 生成・unit・Release CI | [#243](https://github.com/pero3dev/ai-agent-library/pull/243) | `05a0436a` → `14eb3ecb` | 同期headのunit42件・Release成功 |
| 改訂後の読書位置 | [#244](https://github.com/pero3dev/ai-agent-library/pull/244) | `70498ed6` → `931a0a1a` | 同期headのunit50件・Release成功 |
| 形式・生成上限 | [#245](https://github.com/pero3dev/ai-agent-library/pull/245) | `c92fe72f` → `f04d362d` | 同期headのunit52件・Release成功 |
| 既存UI回帰CI | [#246](https://github.com/pero3dev/ai-agent-library/pull/246) | `d50586ad` → `81b5da90` | 同期headのunit52件・UI2件・Release成功 |

依存修正PR #240の限定例外は終了し、11チェックの名前・提供元・全員への適用と15設定flagを復元済み。後続6件は例外を使っていない。PR #248の通常修正はmain CIと対象公開HTMLでも確認済み。

全記事の一時生成・絞り込み・初期失敗復旧・空検索改善・通常同梱候補・全記事UI候補はPR #249〜254の別stackで保存した。これらのmain採用はこのsnapshotに含まない。3記事の既定を維持し、初版の配布・費用・権利・既定切替は別の判断として残す。新たな実機/VoiceOver/実着信、block内の精密位置、全記事の視覚・性能受入は未完了である。

記録を更新した時点で、main `81b5da90…`の[通常CI](https://github.com/pero3dev/ai-agent-library/actions/runs/40167746668)と[native CI](https://github.com/pero3dev/ai-agent-library/actions/runs/40167746762)が成功し、Pagesのdeployも成功した。JSONでは古いPR-open状態を`historical_checkpoints`へ分け、現在の`checkpoints`は実merge結果へ揃えた。PR #247の記録自身の最終検査・main反映は、これらの実装統合と区別する。
