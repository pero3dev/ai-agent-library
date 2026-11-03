# TypeScript 段階移行 — 実施記録

開始日: 2026-11-03(JST)。本書はP0〜P6の実装・ローカル検証記録。GitHubの実マージ・最終CI・公開結果は[PR #329](https://github.com/pero3dev/ai-agent-library/pull/329)の最終証跡と合わせて照合する。

## 作業契約

- 目的: [移行計画](../../plans/engineering/typescript-migration.md)のP0〜P6を順に実施し、主要コードの型検査、既存互換性、CIと必要な公開確認を完了する。
- 許可根拠: 計画提示後のユーザーの「全て完了するまで自律的に作業」「本当に必要な時のみ確認」という依頼。計画段階の操作制限は当時の記録として保持し、本記録を実装・依存追加・検証・通常Git/PR/merge/公開の許可根拠とする。有料API利用や個人設定変更は含めない。
- 元HEAD: `405e29273a7a3257adeb370c6ac3196d35693d4d`。開始時の差分は前回自分が作成した計画・調査・索引・記録6ファイルのみ。
- 所有範囲: `website/`の自前ソースと型設定・依存、`scripts/`、`tests/`、必要な`.codex/`・`.claude/`互換入口、`harness/`の検証契約、CI、関連README、計画・調査・実施記録。記事本文、Python、外部vendor、過去証跡、実行中runの永続状態は保持する。
- 検証: 各実行面の型検査、共通check、依存未導入CLI、最低Node22.22.2/対応24、サイトunit/clean build/browser、Windows回帰、CI/policy/独立レビュー、通常のPRと公開確認。
- 終了条件: 未分類0件、主要UI/データ/運用状態の検査、互換例外の根拠、既存動作と公開経路の維持、最終レビュー・CIと公開した変更の公開確認を記録する。

## 分担と進捗

- サイトUI: app/components/MDX入口/browser tests。
- サイトデータ: lib/scripts/unit、共有データと音声・AST契約。
- Node共通: 文書解析・検証・レポートと共通helper。
- 主担当: 固定版の適合検証、依存・型設定、Node状態/公開/フック、CIと全体統合、記録、GitHub提出・公開確認。

P0の方式確認を完了し、TypeScript 6.0.3とNode22系・React19系の型を直接devDependencyへ固定した。Node.js 22.22.2を公式checksumで検証して作業領域内に準備し、22.22.2/24.19.0の`.mts`実行・`.mjs`入口・型除去を確認した。システムのNode/PATHは変更していない。

## 最新mainの統合と対象の再確認

計画時のmainから取得済みmainは`eb0c80a22375db454998246ad30c7e0fbc752423`へ進んでいた。所有する途中候補を`182e6b6`へ保存し、mainの更新を保持して`ff72f54`で統合した。計画・旧観測の基準SHAは履歴として維持する。iOSのSwift本体は対象外で、追加されたJSと試験を再棚卸しして型検査の範囲へ加える。

統合後のサイトlockはNext 16.4.3、TypeScript 6.0.3、React型19.3.0である。計画時点のNext 16.3.8との互換性確認を実施したと読み替えない。

2026-11-04、head`460e1a0`の11必須check成功後、mainが`cdf2b6e5259f42ff547d8ff804dc62992fd8542a`へ進んでstrict同期が必要になった。読書位置修正のSwift/PBX/Swift試験とproject記録14ファイルを競合なく取り込んだ。JS/TS・website・policyには上流差分がなく、351ソースの正規化Git blob fingerprintは一致した。自動マージ予約を解除し、統合headでCIを取り直す。既存の他作業の記録・実装を保持する。

その統合head`51d3050`でも11必須checkが成功した後、mainが`1f752a7cef0c1e4593d7900e51338d56d30587e0`へ進んだ。EC2ミラー対応のhelper9行・回帰44行とproject記録を保持して取り込んだ。MJS試験入口の競合は薄い入口を維持し、追加11ケースを既存MTS本体へ移植した。parseMirrorの実行ASTとPython writerは上流の意味を保持し、型検査2設定0・関連89/89成功・APT実行0を確認した。以前の351ソース不変という判定はcdf同期時点のものと区別し、この同期後のsource fingerprintを集計JSONへ更新した。

## 中間検証と残件

| 対象 | 確認した結果 | 残件 |
| --- | --- | --- |
| サイトUI・browser tests | strict型検査成功。app/components/MDX入口とbrowser12specをTS/TSX化 | 全ブラウザー回帰・最終tree確認 |
| サイトデータ・unit | lib/scriptsのTS実装と互換JS入口、producer/consumerのunknown検証。unit17本もTS化し99/99成功、skip0 | 最終全体checkとCI |
| 静的ビルド | baseline/candidateともclean build3回が終了0。候補は230/230route、metadata/CSP/Pagefind等の既存検査が成功 | 最終内容での公開確認 |
| Node主要処理 | scriptsのNode用とDOM評価用configで型検査。state/policy/runはTS実装＋既存mjs入口、hookはJSDocで維持 | 全体回帰・最低版CLI確認 |
| policy・公開証跡・鮮度 | policy/freshness4群160/160、GitHub証跡60/60、いずれもskip0 | 最終treeで再検証 |
| 音声 | 型検査の主要診断解消。高負荷時のWindows timeout6件は負荷低下後のhost/concurrency1で全件成功 | 全体回帰、試験コード型付け |
| 新mainのiOS JS/試験 | rendererと小ツールを型検査。大型診断処理とroot側iOS試験の型付けを継続 | 未完了の型診断・Linux/macOS CI |

ビルド所要時間はbaselineが319.412/433.988/400.565秒、candidateが473.224/388.341/242.056秒。中央値は400.565秒と388.341秒だが、並行した型付け・ビルドによる負荷変動があるため、速度改善の因果や保証には使わない。最終typecheckの費用と公開資産budgetも別途記録する。

サイトだけで`skipLibCheck`を使用する。固定MathJaxのgeneric制約、Nextra/Next配布d.tsの未解決内部参照、MDXの旧JSX namespace等の上流宣言が理由で、自前実装の`strict`/型検査は維持する。`ignoreBuildErrors`は使用しない。ルートのNode検査は宣言検査も有効のままである。

## 不変の互換例外

既存のiOS性能観測はrunnerと固定試験のバイトSHAとprofileを固定しているため、以下の実装3本・固定試験1本は本文を保持し、明示した型宣言を相互運用境界として置く。実装を型検査済みとは数えず、最終のSHA照合と既存試験で保護する。固定試験はexportがないため宣言も空のmodule境界のみである。過去のprofileや観測SHAは移行都合で書き換えない。

| ファイル | 保持するSHA-256 |
| --- | --- |
| `ios/tests/core-performance-runner.mjs` | `4276643f3c0df1e21d62f020c0ebd5ec32639b536fa6933806e7ad611edcaf5f` |
| `ios/tests/verify-core-performance.mjs` | `15880ac76ec61af487d888684fa8910a5f74e74a43a717bb839442ce7fa30c51` |
| `ios/tests/verify-core-performance-notice-20261031.mjs` | `c911db411741ddfa60af310a6d1906f565f3413375a6538655b29053a28d5784` |
| `tests/unit/ios-core-performance-notice-20261031.test.mjs` | `43126d0daa63ceea3d6d520098b47b6c540c00283f70bd406b45a6d68212e712` |

## 実装の到達点

最新mainのJS/TSは238ファイルで、過去の証跡6・外部vendor1を除く231ファイルが自前だった。追加・分割を含む現在の351ファイルは、検査する実装258、独立検査する宣言18、固定ASTまたはSHAで保護する互換入口64、凍結4(実装3・固定試験1)、過去証跡6、vendor1に分類した。未分類は0。互換入口と宣言を実装の検査件数へ加算していない。

固定版・分類・ビルドbudget・検証レベルの[集計JSON](typescript-migration-result.json)を併記する。

`harness/typecheck.json`と`check-type-coverage`は実際のstrict programのソース対応、JSのcheckJs、noCheck/strict無効化、抑制コメント、宣言による実装の隠蔽、互換入口の形、例外のSHAを確認する。semantic診断は別の型検査コマンドで行う。設定はルート6・サイト5の計11で、既存のharness/build CIへ接続した。新しい必須check名や権限は追加していない。

UIとNodeの相対importは実在する拡張子へ同期し、Nodeの`.mts`には型除去で実行できる構文だけを使う。既存CLI・test glob・hookの`.mjs`パスを維持し、runtime compiler/loaderは導入していない。改名で切れた2026-09-10監査の4リンクは、本文と当時の行番号を保ち、原監査commitの実在ソースへ固定した。

計画の段階ごとにローカル検証・分担レビューを行い、共有型と入口・検査の依存を一緒に提出するため、最終変更を1つのPRへまとめる。途中候補の保存commitとmain統合commitは前述のとおり保持する。採択時の計画・棚卸しは当時の観測として書き換えない。

## 独立レビューで修正した境界

実装担当を入れ替えて、UI、Node、音声、状態・公開証跡、CIとcoverageをレビューした。宣言済みの型と実際の検証範囲がずれていたJSON境界を修正した。

- 保存世代番号と加算結果をsafe integerで確認し、破損時はjournal作成前に停止する。
- GitHub API、音声設定・review全coverage要素・cache・認証・ffprobe・公開journal/PR/check・lock・著作者記録を、unknownから使用する構造へ絞る。
- 過去キューの部分的なjob、未指定chunk長の既定値、旧review、stringの音声ID、公開カタログの任意license metadata、途中journalを保持する。
- 評価・healthの未検証テレメトリや診断metadataはunknownのまま報告し、数値・文字列などの保証を捏造しない。構造設定も未消費metadataと実際の検査範囲を型で分ける。
- 既存の課金確認、許可コマンド、所有権、symlink、trusted base、実head/workflow照合と公開条件を保持する。

新規の検査を型定義だけに合わせたモックへ置き換えず、不正応答・legacy正常入力・原stateの非破壊と書込前停止を回帰で確認した。レビュー担当自身が実装した範囲は独立判定へ数えていない。

## 最終検証の証拠と限界

| 対象 | ローカルで確認した結果 |
| --- | --- |
| 型検査 | ルート6・サイト5のstrict/noEmit検査で診断0。coverage未分類0、凍結SHA一致 |
| 共通check | Node24.19、EC2対応の統合後も終了0。単体1,556件中1,456成功、100件は理由付きWindows/外部環境skip。POSIX専用の固定Notice試験1ファイルは別途not-runを明示、Linux/macOS CIでは原文を実施 |
| 負荷時の再現 | 並行browser実行中の初回checkはPowerShellと2秒child期限の2件がtimeout。負荷低下後、同じ契約・直列で2/2成功。期限や不変runner本文を緩和していない |
| サイトunit | hostで99/99成功、skip0。sandboxのsymlink EPERMとは分けた |
| サイトbrowser | 公開相当出力で677成功、5skip、失敗0。5件は専用音声fixtureビルドでのみ実施する試験で、通常ビルドの成功へ数えない |
| 最低Node | 公式checksumで確認した22.22.2で、fresh checkout/npm未導入のCLI/bootstrapとharness全33/33成功、skip0。24.19でも同じnative型除去方式を確認 |
| 静的ビルド | baseline/candidate各3回終了0、230/230ルート。初期JSは双方12script・raw962,476B/gzip307,969Bで同じ |
| 依存・workflow | root/website/ios-tools監査はhigh以上0。low/moderateは残存し、破壊的な自動fixは行っていない。固定actionlint 1.7.12でworkflow検査成功 |

ビルド時間は前節の制約を保って解釈する。先行した一括checkは180.208秒、別途のルート型検査実測は81.333秒だが、並行負荷があり同条件の最新main check基準はないため、全体checkの増加率や速度向上は主張しない。

初回PRのLinux CIは1,547件中1,527成功・19skip・期限注入の1件失敗だった。xcresultの追加構造検証が模擬getterをCSV export前に読んだためで、baseline成功・候補失敗・型除去後の候補も失敗と切り分けた。期限値と期待6コマンドを保持し、期限注入をCSV export後のnormalization読取へ合わせ、期限切れ時のcommand数と最終数の一致も検査した。実装は変更せず、修正した試験はbaseline/候補/型除去後の全経路で6/6成功、memory全体はhost35成功・POSIX skip17だった。純mockの期限5段階はWindowsでも実施する。最終headのLinux CIはPRで取り直す。

続くheadのLinux CIは1,552件中1,533成功・19skip・失敗0。追加のNotice観測CIで固定試験自身のSHA拘束が判明したため、当該試験をbaselineとbyte完全一致へ戻して第4凍結例外へ分類した。Python/profileは変更しない。Windowsでは不変のPOSIX専用1ファイルだけ収集時にnot-runと表示し、Linux/macOSは原文の全試験を維持する。collectorの3OS分岐と不変SHAを独立レビューで確認した。

Windowsで扱えない不変runnerのPOSIX絶対パス、symlink権限、process groupやAppleツールはbaselineでも確認し、対象外を明記した。Linux/macOSの検証はCIの正確なheadと結果を照合する。実Agentでのhook発火、物理iPhone/Safari/AirPods、有料モデル・実音声生成をこの移行の成功と読み替えない。ローカルログ・3回分のビルド出力・baseline checkoutは`.local/typescript-plan/`等の非追跡領域へ保持し、公開する記録は本書と小さな集計JSONに限定する。
