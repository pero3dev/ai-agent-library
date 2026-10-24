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

## 進行

M0の所有差分とremote・既存PR・worktreeを照合し、独立レビューを開始した。GitHubの対象は公開リポジトリ`pero3dev/ai-agent-library`、default branchは`main`。現時点でiOSの既存open PRは検索で見つからなかった。結果は[JSON](ios-autonomous-progress.json)へ更新する。

M1の未採択事項は選択肢を具体化し、採用前提を必要としないM2等の実装を止めない。現在のPersonal Teamとローカル試験の範囲を、App Store公開準備の完了とは扱わない。

ユーザーの追加指示により、新たな実機操作が必要な検査は未完了として記録し、依存しない作業を続ける。重大な影響・契約・費用等の本人判断が必要な場合だけ確認する。

M0レビューで、取り込んだ音声metadataの極端な時間が整数変換でクラッシュする経路と、同じrevision・pathを使う別packageの画像cache混同を発見した。共有の24時間上限と安全な表示変換、canonical root・対象SHAを含むcache keyと回帰試験で対処する。修正を含むソース版は0.2.3（5）とし、0.2.2（4）の既存実機受入と区別する。新しい端末操作は行わない。

両指摘を修正し、独立した再レビューで解消を確認した。CoreSmokeは通常3記事とfixture付き4記事の双方で成功。iOS SDKのbuild-for-testingとRelease buildが成功し、Releaseは3記事・140ファイルのSHAが一致、TestContentを含まなかった。新しいXCTest3件を含むターゲットのcompileまでであり、新規XCTestの実行と実機受入は未実施。通常記事の再生成では既存の`c10353c1…`と同じ版を再現した。

共通依存の監査で既存markdown-itのhighを検出したため、先に[限定依存修正PR #240](https://github.com/pero3dev/ai-agent-library/pull/240)を作成した。実CIでbase lockfileのhigh監査によるHarness policyの失敗を確認し、既存サイト依存の監査でも別のhigh・criticalを検出した。依存修正を分離して準備し、保護設定・監査の回避は行わない。接続の権限制約によりmain保護設定の詳細は取得できなかったが、branch APIでprotectedと11個の必須チェックの全員への適用を確認した。

M0は責務別4コミットを[PR #241](https://github.com/pero3dev/ai-agent-library/pull/241)へ保存した。続いて検索ヒットへの移動を0.2.4（6）として[PR #242](https://github.com/pero3dev/ai-agent-library/pull/242)へ1コミットで保存し、M0をbaseにして機能差分を分けた。Foundation回帰と共通検査、42件のXCTestを含むSDK compile、独立レビューは成功した。新しい実機受入は未実施として維持する。

main反映待ちの間に[記事改訂後の復帰](ios-reading-revision-restore.md)と[Hosted Simulator CI](ios-native-ci.md)を独立に進める。保存は後方互換の任意anchorを追加し、CIは既存11必須チェックと保護設定を変更しない追加jobとする。CIは[PR #243](https://github.com/pero3dev/ai-agent-library/pull/243)へ先に保存し、改訂復帰をその次のPRへ分ける。CI実装をXCTest実行済みと読み替えず、PRごとに実行結果を取得する。

前提PR #240は最新head `57c96d24…`で通常検査10件が成功した。残るHarness policyはbase監査のhighによる失敗を再確認した。限定した管理者復旧の判断を本人へ依頼し、回答まで例外操作を行わない。返答待ちでも独立した機能とCIの実装・検証を続ける。

追加native CIはPR #243でXCTest42件、復帰を加えたPR #244で50件、いずれも失敗0とRelease同梱検査の成功を取得した。実機未実施のままでも、SDK compileだけだった部分をHosted Simulatorの実行結果へ進められた。続いて[IOS-19](ios-native-package-contract.md)の形式対応・future版拒否と正常版維持・producer/consumerの境界を揃え、旧HTML CLIの上書きを防ぐ。UI試験は別PRへ分け、既存2件の狭い確認範囲と残りの受入を区別する。

## 今回の統合前チェックポイント

| 作業単位 | PR | 確認結果と統合状態 |
| --- | --- | --- |
| 依存の前提修正 | [#240](https://github.com/pero3dev/ai-agent-library/pull/240) | 通常10検査成功、trusted base監査だけ失敗。限定復旧の本人判断待ち |
| nativeの基準M0 | [#241](https://github.com/pero3dev/ai-agent-library/pull/241) | 意図別4commit、生成・SDK・独立レビューを保存。main未統合 |
| 検索ヒットへの移動 | [#242](https://github.com/pero3dev/ai-agent-library/pull/242) | 専用1commit。後続の同じnativeコードでHosted42件成功 |
| 生成・unit・ReleaseのCI | [#243](https://github.com/pero3dev/ai-agent-library/pull/243) | 専用1commit、Hosted job成功 |
| 記事改訂後の復帰 | [#244](https://github.com/pero3dev/ai-agent-library/pull/244) | 専用1commit、Hosted50件とRelease成功 |
| 形式契約と生成境界 | [#245](https://github.com/pero3dev/ai-agent-library/pull/245) | 専用1commit、Hosted52件とRelease成功。IOS-19完了 |
| 既存UI2件のCI | [#246](https://github.com/pero3dev/ai-agent-library/pull/246) | 専用1commit、Hosted単体52件・UI2件・Release成功。IOS-26完了 |

[runtime照合](ios-native-runtime-audit.md)では現targetに旧WebKit等が残っていないことを確認し、実装の追加削除をせずIOS-24を完了とした。実機未確認、本文block内の精度、全UI回帰や全記事展開は残る。今回のチェックポイントはmain統合の完了ではない。

mainは`405e29273a7a3257adeb370c6ac3196d35693d4d`のままで、11必須チェックと保護設定を維持している。PR #240への限定した管理者復旧は本人へ質問済みで、回答まで例外操作を行わない。復旧後は保護復元・実merge SHA・main CIを確認し、後続branchを通常のmain統合で同期して最終headと必須検査を取り直し、#241から順にsquashする。App Store関連の契約・支払い・公開・OS更新は別途採択の対象である。

working treeに残すwebsite・依存記録の9ファイルは、別PR #240の公開head `57c96d24…`とbyte単位で一致することを確認し、nativeのコミットへ取り込んでいない。再開時に未保存の新規修正と誤認してstash・reset・一括stageしない。
