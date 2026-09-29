# 学習パイプラインの読書連動図解

状態: **C1公開受入完了**。PR #59、main CI・Pages、公開Edge 71/71、WebKit初回66/71と元assertを保つ限定5/5、独立公開画像レビューapproved / lowを確認した。P1は7/15記事、次はC2事前学習。

## 作業契約

- 目的: `docs/10-llm-foundations/llm-training-pipeline.md` の主要論点を、本文と連動する2図へ割り当てる。記事本文は変更しない。
- 根拠: [承認済みの詳細設計](training-storyboards.md)、[機械対応表](training-storyboards.json)、[独立計画レビュー](training-storyboards-review.md)。C1だけを制作・公開受入してから、C2事前学習へ進む。
- 許可: ユーザーの自律実装・公開反映依頼。P1の全15記事を公開受入して停止し、P2は開始しない。
- 開始条件: 推論ラベル修正版のPR #58、main CI・Pages・公開機械検査・独立公開画像レビューの受入。作業開始時に最新mainと未保存差分を再確認する。
- 所有: 図固有model/scene/CSS/unit、共通wrapper・registry・AST/MDXの固定対応、記事別受入と関連試験、公開検査の対象追加、計画・制作・引き継ぎ記録。他のworktreeや音声制作の変更は含まない。並行担当の所有ファイルを分け、他者変更を戻さない。
- 終了条件: 主要論点と本文保持、意味・数値の区別、逆シーク・READと手動の切替、画面条件・JS無効・印刷、配信分離、作者以外の画像レビュー、共通検査・サイトunit・静的export、PR・CI・Pages・公開版と成果物の同一性を確認する。共通入力変更で失効する旧6記事も再受入する。

## 固定した制作範囲

| 図 | 段階 | 本文連動 | 主題 |
| --- | ---: | --- | --- |
| `training-stages` | 6 | 0, 1, 2, 3, 4, 5 | 事前学習・SFT・選好調整の入力と重みの更新 |
| `training-runtime-boundary` | 4 | 0, 2, 3 | 学習で得る性質と利用時の文脈・検証の役割 |

記事は8 H3・34主要論点（動的21、本文保持13）。5 H3と10本文blockを元ASTのまま包装し、9か所のREAD停止へ対応させる。概要Mermaidは第1図S0の元本文に保持する。手動補助1段階を新しい本文説明として増やさない。

同じ位置のモデル重みと情報の経路を追える図にし、図を短文カードだけで埋めない。学習の重み更新と利用時の文脈入力を視覚的に区別する。品質点数、改善率、万能な工程順や手法の優劣は作らない。本文の重要な留保は既定のREAD面に表示する。

原文SHA-256は `993147125244a6bfc7b3e64ca5d9f4f2142dd944b7a1fa7d43d33a79b7242e62`。記事の事実訂正は計画に含まれないため、通常記事変更のmanifestを用意しただけで公開条件を満たしたとは扱わない。本文変更が発生した場合は、その変更を別途分類して必要なレビューを追加する。

## 検証・公開

開始HEADは `67b1309fcea8267749be6e52881f3d6a4049ae2b`、ブランチは `feat/training-reading-diagrams`。PR #58の公開受入と6本の固定snapshotを保存した後で開始した。未保存の引き継ぎ準備差分を維持し、旧mainを指していた未着手ブランチをfast-forwardして切り替えた。

並行担当は図固有8ファイルを `/root/inference_public_review`、共通統合と受入unitを `/root/training_integration_map`、公開検査キットを `/root/portable_handoff_kit`、ブラウザー検査・公開手順・本記録をrootとする。各作者は自分の成果物を独立承認しない。

以下に実装・ローカル検査・独立判定と、PR #59の公開受入を記録する。計画の承認と製品の受入を区別し、最終公開判定は末尾の記録を参照する。

## 実装と初期検査

[図固有8ファイルの実装記録](training-scenes-implementation.md)では、担当model unit 16/16成功。重みの箱の座標、学習と文脈入力の経路、強調だけを変える選択、モデル外の権限確認を確認した。[共通統合の実装記録](training-integration-implementation.md)と[詳細JSON](training-integration-implementation.json)では、AST/MDX 85/85と記事受入31/31が成功した。これらの記録は改行だけLFへ正規化して移管した。

独立した統合レビューで、手動専用のruntime S1だけへ論点を移しても割当検査が通る不足を再現した。C1の明示的なREAD契約を適用するため、記事設定に `requireReadingStage` を追加し、登録されたblockGroupsのREAD段階と論点の段階に交差があることを要求した。手動専用 `[1]` は拒否し、READを含む `[1,2]` と `[0]` は通る負例・正例1件が成功した。これは到達性の機械条件であり、表示内容の意味は独立画像レビューで確認する。旧6記事の過去の割当をこの修正で書き換えていない。

初回の静的exportは成功したが、実装中のモデル経路修正と重なったため表示受入へ使わず、ログとBUILD_ID `1gE9wObSoN4GH8zUWiypU` を保存した。最終コードを固定して再buildした。公開用設定は実GitHubの `SITE_URL=https://pero3dev.github.io/ai-agent-library` と `SITE_BASE_PATH=/ai-agent-library` を読み取り、`STATIC_EXPORT=1` と合わせた。

修正後の[独立統合レビュー](training-integration-review-addendum.md)と[詳細JSON](training-integration-review-addendum.json)はapproved / low、must 0・should 0。[初回の要修正判定](training-integration-review.md)と[再現を含むJSON](training-integration-review.json)も保持する。独立担当は初回116/116に加えて修正後の受入32/32を実行し、旧85件と合わせた現行117件の確認を記録した。15ファイルにはroot作成のブラウザー検査20件と読み込み失敗検査2件の差分も含むが、この段階では実ブラウザー成功を意味しない。

rootのサイト全unitは313/313成功、fail・skip 0、163.8秒。最終静的exportも成功し、BUILD_ID `FCghSEE6NdR0foJwlZB7g`、223 routes・230 HTML・16章を確認した。図固有6ファイルとwrapperの開始前後hashは一致し、7記事のinputDigestとHTML hashを固定してブラウザー検証へ渡した。公開CI artifactとの同一性証拠にはローカルbuildを流用しない。

同buildの対象Chromium・WebKitは各22/22成功（98.0秒・188.7秒、fail・skip・flaky 0）。独立画像レビューは110枚を確認し、runtime S2の拒否行にSFT・選好調整・実行時制御の複数要因が表示されない点を要修正とした。元本文は保持されていたが、割り当てた動的論点を既定READ面で扱うため、図の拒否行を2行にして注記を追加し、段階説明にも対応する一節を追加した。本文の変更はない。

修正後のmodel unitはrootの16/16と独立担当の16/16が成功した。対象ブラウザー試験には、既定の幻覚強調でも拒否の留保が見えることを追加した。初回build・レビュー・画像・検査JSONは旧版の証拠として保持し、新しいbuildで表示受入を取り直す。

修正前の画像指摘は[初回シーンレビュー](training-scene-audit-initial-review.md)と[詳細JSON](training-scene-audit-initial-review.json)に保持した。browserへの4行追加は、別担当が[限定レビュー](training-integration-caveat-review.md)と[詳細JSON](training-integration-caveat-review.json)でapproved / low・must 0とした。元の共通15ファイル中14ファイルの生バイトhash一致と、4行を除いたbrowserの旧承認hash一致を確認している。

留保を補った再exportはBUILD_ID `GpM7J_g8lnbvEy6H7i7nO`、223 routes・230 HTML・16章で成功した。旧6記事のinputDigestは前buildと一致し、C1は `sha256:ac6d8aabd80a18e7cf8d54343531ba1e43e346f18ec9bde25017b350e955750e` へ更新された。最終build後の7記事HTMLと入力hashを固定し、全Chromium回帰と独立画像再レビューを実施した。

`npm run check` のunitは474件中473成功・fail 0・skip 1（735.1秒）。skipは既存の実FFmpeg試験で、`AUDIO_FFMPEG` / `AUDIO_FFPROBE` またはPATHに実行環境がないため。続くMarkdown lintで、移管したシーン実装記録のリスト前空行不足1件を検出した。空行を補い、成功済みunitの反復はせず、残るlint・記事規約・相対リンク・TODO棚卸し・harnessの各共通検査を再実行して完了した。構造検査はこの時点でstage済みのキットを含む712 tracked filesを対象とし、残るサイト・記録のstage後に取り直す。

最終シーンの[独立レビュー](training-scene-audit-final-review.md)と[詳細JSON](training-scene-audit-final-review.json)は2026-09-24T14:42:52.836Zにapproved / low、must 0・should 0。8画面条件の全10整数面、16境界、11選択肢、9 READ停止、旧6記事90段階、JS無効・印刷・chunk故障時の本文保持・配信分離を確認した。156取得画像のうち本人が81枚を実見し、初回110枚と別集計にした。入力とHTMLは開始・終了・判定時に一致した。応答18.1/42.8ms、rAF p95は両7.1ms、図関連CLS 0、scene/core gzip 18,209B・共通21,681Bで予算内。並行検査の負荷があるローカル測定で、実機Safariの結果ではない。

同じ最終buildの全Chromium回帰は278成功・失敗0・flaky 0、音声fixture専用の5件がskip（合計283、753.4秒）。[機械結果とログの保管台帳](training-local-evidence/summary.json)、[固定したbuild入力](training-local-evidence/build-identity.json)を保存した。元JSON・ログは生バイトのhashを保持したgzipで保存し、[1280×720の確認画像](training-local-evidence/runtime-evaluation-1280x720.png)と[960×540のSVG全体画像](training-local-evidence/runtime-evaluation-960x540-svg.png)を代表として同梱した。全画像の元PC TEMPパスを再開の必須条件にはせず、リポジトリのブラウザー試験と公開検証キットで再生成する。

最終対象WebKitは22/22成功、fail・skip・flaky 0、150.7秒。2026-09-24T14:48:29.587Zに7記事の現在inputDigestを最終build・独立レビューの両方と照合し、review/localの受入を記録した。publicは新入力版の未受入として残し、PR #58の固定記録を保持した。この更新は実施済みの結果の記帳であり、初回統合レビューに含まれていた空の受入JSONを製品コードとして再承認したという意味ではない。

受入記録の更新後に記事受入unitを再実行し、32/32成功・fail/skip 0（65.8秒）。既存のPR #58固定snapshotが後続の共通変更を承認しないことも確認した。提出前の実GitHub照合ではPUBLICの同じリポジトリ、mainが開始HEADと一致し、既存open PRなしを確認した。

## PR #59の公開確認

[PR #59](https://github.com/pero3dev/ai-agent-library/pull/59)のhead `79e709a5587de07925ec5d41aba1855b2a5c5abc` に対する11チェックは成功した。CI・freshness-policy・harness-policyの3 workflowについて、実runのrepository・path・event・head・successを照合した。PR側deployはmain限定のskip。2026-09-24T15:21:22Zに `517dc8b5166bd7b0c85baef3800d7fe57bac7b31` として通常squash mergeし、候補とmergeのtreeがともに `6786d62dd474fd1cc440f61ab789060772541468` で一致した。

同mergeの[main CI](https://github.com/pero3dev/ai-agent-library/actions/runs/36019573674)と[Pages](https://github.com/pero3dev/ai-agent-library/actions/runs/36019573674/job/107704025706)は成功。attempt 1、build job `107700727287`、artifact `10816009077`、deployment `6641574999`、status `18790811264`。取得前後の実API同一性を確認し、同CI artifactの7記事HTMLからBUILD_ID `EliX86DAnCpMQHOKIyCQx` と期待hashを得た。[識別情報](training-public-evidence/artifact-evidence.json)と[生証拠の相対索引](training-public-evidence/ci-file-index.json)に、API応答・選択HTMLのgzip・PR/merge/CI情報を保存した。

公開Chromium（Edge）は2026-09-24T15:32:55.633Zから15:39:39.028Zに71/71成功、67 assets・295 PNG。[生結果](training-public-evidence/chromium-result.json.gz)の展開後SHA-256は `cefbbb3d8911068df930aa7c2a71e0316caa9b3df743c4473ffae91f857ae1f9`。原本の独立画像レビューpending欄を維持し、[記帳時の索引](training-public-evidence/chromium-index.json)に結果と代表画像のhashを保存した。

公開WebKit初回は2026-09-24T15:45:43.081Zに66成功・5失敗で完了した。C1の13ケースは全成功で、失敗は既存inferenceの初段選択を含む5ケース。[初回生結果](training-public-evidence/webkit-initial-result.json.gz)の展開後SHA-256は `89b57e7baf51b68763bfdd9b6dd65664a8ae75ef5188b268e93a80a6f0ad746b`。失敗名・内容は[初回索引](training-public-evidence/webkit-initial-index.json)に保存し、後の成功で初回結果を書き換えない。

限定診断では1280×720のsampling初段で、pointerdownからpointerupまでに読書同期でボタンが53.58px移動し、clickがボタンへ届かない現象を再現した。既存ローカル試験の初段前の実スクロールと3フレームの安定待ちをTEMP候補に移し、元assertを保った3ケースと追加の実時間再生2ケースは成功した。製品コードは変更していない。[診断報告](training-public-evidence/stage-race-diagnostic.md)、[詳細JSON](training-public-evidence/stage-race-diagnostic.json)、[候補差分・生結果・実行コードの相対索引](training-public-evidence/stage-race-file-index.json)を保存した。作者以外の差分・イベント・実初段選択・実時間再生の確認も完了し、次節の独立公開レビューと併せて判定した。原WebKitの失敗は保持し、修正版全71件の再実行とは扱わない。

## 独立公開受入とPR #59の固定記録

[最終公開レビュー](training-public-review.md)と[画像台帳・詳細JSON](training-public-review.json)は **2026-09-24T15:59:03.585Z、approved / low、must 0・should 0**。C1は両engineとも13/13成功。生成276枚のC1画像のうち106枚を実見し、既存図の代表とTransformer4図の独立補助8枚を合わせて144枚を直接確認した。runtime S2の拒否要因の留保は、既定の幻覚強調でも6画面条件・両engineで表示される。機械BBoxの全候補は実際の字形を確認し、可視衝突はない。

両原runと限定再検証が終わった後、2026-09-24T15:55:33.828Zに[7記事の公開HTMLを再照合](training-public-evidence/training-public-identity-after.json)し、同main CI artifactのHTML hashとBUILD_IDがすべて一致した。[独立差分検算](training-public-evidence/training-independent-diagnostic-proof.json)は、候補の24行を逆除去すると原runnerへ戻ること、既存local待機との一致、元assertの保持を確認している。

[相対証拠索引](training-public-evidence/public-acceptance-index.json)は、既存38証拠ファイルを変更せず、最終レビュー・公開同一性・独立proof・Transformer補助raw gzipと8 PNG・元実行スクリプトの原hash/保存hashと変換を対応付ける。旧絶対パスを含むrawやスクリプトは歴史的証拠としてそのまま保管し、別PCの実行入口にはリポジトリの公開検証キットを使う。原rawのpending欄を最終承認で上書きしない。

記帳の所有は本記録・公開証拠・展開/引き継ぎ/索引と現行7受入・PR別snapshot。目的は実施済み公開承認の固定で、製品・build・Git・新しい公開操作は含まない。他者変更を保持し、受入CLIと相対証拠のhash、Markdown・リンクを確認する。

2026-09-24T16:12:34.933Zに現行7記事のpublicをactual merge `517dc8b5166bd7b0c85baef3800d7fe57bac7b31`、CI `36019573674`、Pages `107704025706`へ記帳した。[受入CLIの固定結果](training-public-evidence/article-acceptance-pr59.json)では7件すべてcomplete=trueを確認し、同じbytesの[Transformer](transformer-article-acceptance-pr59.json)、[注意変種](attention-variants-article-acceptance-pr59.json)、[MoE](moe-article-acceptance-pr59.json)、[文章生成](generation-article-acceptance-pr59.json)、[トークン化](tokenization-article-acceptance-pr59.json)、[推論内部](inference-article-acceptance-pr59.json)、[学習パイプライン](training-article-acceptance-pr59.json)のPR #59 snapshotを保存した。CLI初回の未対応--json指定はusage終了し、引数なしの正規コマンドで再確認した。共有コードを後で変更した現行版へ、これらの固定記録の承認を流用しない。

P1の公開受入は7/15記事（全体7/199）。P0の部分対応2記事を含め、図解公開は9記事19図。次は `feat/pretraining-reading-diagrams` の[C2事前学習](../2026-09-25/pretraining-reading-diagrams.md)。P1全15記事の公開受入で停止し、P2には着手しない。
