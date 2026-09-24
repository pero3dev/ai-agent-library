# 推論の内部機構の読書連動図解

開始: 2026-09-24。状態: 実装・ローカル検証・独立レビュー完了、公開準備中。公開完了記録ではない。

## 作業契約

- 目的: 採択済みの[展開計画](../../plans/engineering/dynamic-diagrams.md)に従い、既存の推論内部記事に4図・23段階を組み込む。本文を追加せず、原文・数式・概要図を保持する。
- 元HEAD: PR #56公開受入済みの `1af3a76bf037a31fcbc8a8f677da7b135da3864d`。所有ブランチは `feat/inference-reading-diagrams`。
- 許可根拠: 「公開サイトへの反映まで」「順に作業を自律的に進めてください」。通常実装、独立レビュー、PR、CI、merge、Pagesと公開確認まで進める。
- 所有: rootは本文の最小訂正、実施記録、ブラウザー試験、キャッシュ図、サイトアイコン。統合担当はregistry・記事割当・AST/MDX・wrapper・受入検査・関連unit・website README。各scene担当は自身のmodel/scene/CSS/unitのみ。他者の変更を戻さない。
- 規約: AGENTS.md、CONTRIBUTING.md、harness/git-rules.md・git-conventions.json、harness/writing-rules.md、project/README.md。ROADMAPの既存執筆完了は維持する。
- 終了条件: 記事の全主要論点の割当、独立内容/画像レビュー、root check・website unit・公開相当build・Chromium/WebKit、GitHub/Pages/公開確認。旧5記事も共有入力変更を再受入する。物理iPhone・実スクリーンリーダー・物理印刷・学習効果の実測は別範囲。

## 採択した構成

| 図 | 段階数 | 本文連動段階 | 主な操作 |
| --- | ---: | --- | --- |
| サンプリング | 7 | 0, 1, 3, 6 | 温度、top-k/top-p、固定乱数、分岐の原因 |
| KVキャッシュとバッチング | 6 | 1, 2, 3, 4, 5 | 入力長、prefill/decode、通常/連続、論理反復 |
| 投機的デコーディング | 6 | 0, 2, 4, 5 | 棄却位置、全受理、貪欲/確率的方式 |
| 量子化 | 4 | 0, 2, 3 | 重み/活性/KV、bit数、外れ値の保持 |

9 H3・49論点（動的36、本文のみ13）を対応づける。4包装は22本文blockと5 H3を含み、概要Mermaid・実務適用・注意点は本文として保持する。中間段階は手動/再生で探索できる。固定した説明用データであり、実モデルの速度・品質の測定値としては表示しない。

事前契約はTEMP `inference-integration-contract.md`（SHA-256 `3fe3b9164fd79f29ea52d8206a564dc8b1cbc884491eef2d17144000f8c3cd27`）と同JSON。段階構成・本文包装・全16有効化組合せ・依存53ファイルを準備した。実際の統合後に再検証する。

本文はtop-pの境界だけ「累積確率がpを超える」から「p以上になる」へ訂正する。2026-09-24に[原論文 §3.1 式2](https://arxiv.org/html/1904.09751)の不等号を確認済み。last_updatedと該当資料のアクセス日も同期する。図を合わせるための誤定義は採用しない。

前単位で確認した未指定faviconの自動404は、basePathを含む明示アイコンの追加で解消を検証する。既知観測の分類を製品の成功証拠へ流用しない。

## 検証と残件

4図の候補を製品へ取り込み、モデル単体32/32が成功した。sampling/quantizationは独立した324設定・117状態の数値検算と717 SSR状態、cache/batchingは独立8検算と60 SSR画像、speculativeは独立10,230状態の数値照合と126 SSR状態を確認し、いずれもapproved / low、必須修正なし。SSR検査は実記事のhydration・読書同期・公開確認の代わりではない。

- I1/I4: TEMP `inference-sampling-quantization-review.md`、SHA-256 `b0f265dc94938586c6fb54b70ffc0137003d1d5f9e451be094e41d79523e53ef`。疎配列の拒否、本文停止時の説明、乱数表示を横切る線を修正した。最終sampling sceneは `246d61c7418383daa6091fc0604926f86c4624a7ca16686d488211b2cbe29f23`。
- I2: TEMP `inference-cache-model-review.md` と `inference-cache-scene-review.md`。prefill/decodeの説明と重みからの線を修正し、最終sceneは `08d3b27bed7deadab2a9d6458c0e0cb23f14c5d6921cff31bb723945c6e1e008`。論理反復を実時間に換算しない。
- I3: TEMP `ai-agent-library-inference-sampling-candidate/validation/inference-speculative-model-review.md` と同 `inference-speculative-scene-review.md`（後者SHA-256 `20162dfe503c892ab6bc34516f58db65a0d8b93028dc0a03a2d807b4feaa424f`）。本文の停止画面でも一括検証・棄却以後の破棄・速度条件を明示した。最終sceneは `e1fca5a0625ac77a9be9363658c8978f5acd53a9bbcf42812fe1874d7a8d5563`。

統合後の全体試験・独立画像レビューは後節に記録する。公開確認は未実施。旧5記事のPR #56公開証拠は固定スナップショットへ保存済み。元単位のroot/website lockfileから `npm ci` 済みの同一依存を使用し、今回lockfileは変更していない。

## 統合とローカル検証

登録・包装・MDX安全性・記事別受入の担当検査は初回97/97、有効化後81/81成功。旧5記事の割当データとPR #56固定証拠を保持し、共有依存の変更後は6記事のreview/local/publicがすべて未受入となることを確認した。図のsourceDigestと本文対応は一致し、新記事は9 H3・49論点・4図を持つ。faviconを含む入力ファイルは54件。TEMP `inference-integration-work/integration-result.json`（SHA-256 `d7834e04b442b0b3cb54d1e31856cfb99be15efc7e3070ee82b5e45313bf5ea0`）に担当13ファイルのhashと検査結果を保存した。

ブラウザー検査ロジック・本文訂正・faviconは別担当の読取レビューでapproved / low、必須修正なし。TEMP `inference-browser-doc-favicon-review.md`（SHA-256 `7e2ebe62eab4701152cd427b6ea6219fd6d12b301dbf5e7e1e5cc64473e50f62`）。再生開始時のmanual固定、候補制限方式の排他性、温度の数値効果の検査を補強した。この読取レビューは実ブラウザー結果を含まない。

`npm run check` は成功（455試験中454成功・1 skip、466.4秒）。サイト全unitは287/287成功（159.3秒）。公開相当 `build:clean` も成功し、BUILD_ID `LB6Wk1ehrFA7qDJ2aBwNq`、223/223 routes、230 HTML、16章を確認した。環境は `STATIC_EXPORT=1`、`NEXT_PUBLIC_BASE_PATH=/ai-agent-library`、`NEXT_PUBLIC_SITE_URL=https://pero3dev.github.io/ai-agent-library`。TEMP `ai-agent-library-inference-{root-check,website-unit,build}.log` に実結果を保持する。既存のGit更新時刻・日本語stemmer等の警告は残している。

ブラウザーの重点48ケース、Chromium、WebKitの対象167ケースと最終独立画像レビューは完了。WebKitの初回失敗と限定再検証は後述する。GitHubと公開検証は未実施。

統合13ファイルも作者以外が独立確認し、approved / low、必須修正なし。TEMP `inference-integration-code-review.md`（SHA-256 `d7a8668b20c1b7b549b22ed3a5ffdd6006a72ac338e4af2567735bef6d95f502`）。全16有効化組合せと登録順の逆転、原ASTへの完全復元、後段図の検査失敗時に前段を部分変更しないこと、49論点・54入力・6記事の未受入状態を照合した。重点Chromiumは48/48成功（2.6分）。rootでも1440のKV入替と投機的補正の2画像を確認し、主なラベルと関係線に問題がないことを確認した。全画像判定は別担当の最終監査で行う。

全Chromiumは262件中257成功・音声fixture専用5 skip（7.7分）。TEMP `ai-agent-library-inference-chromium.log` の終了結果を中断再開時にも確認した。WebKitの最初の並列実行は図解の `data-ready` 待機で12失敗・後半7成功となり、中断して生ログとtraceを `ai-agent-library-inference-webkit-first-attempt/` に保存した。同一build・同一5秒待機の4ケースを単独workerで再確認し4/4成功。最初の待機失敗の原因は断定しない。

単独workerの全167ケースは165成功・2失敗（22.0分）。2件は推論記事1440明暗の段階ボタンクリックが手動モードへ移行せず、表示段階の期待値と異なった。traceでは自動スクロール直後の読書同期により段階とボタン位置が変わっており、文字の幾何検査へ到達する前の失敗だった。クリックの最終受信先は記録されていないため、配送の根因を断定しない。原log・trace・失敗IDを `ai-agent-library-inference-webkit-serial-original/` に保存した。

表示専用7ケースの手順に、明示スクロール後の段階・スクロール位置・ボタン矩形の連続3フレーム安定待ちを追加した。通常クリックと既定5秒、表示の期待値を保ち、クリック後はmanualも要求する。通常操作試験のseekと製品は変更していない。修正は独立レビューapproved / low、必須修正0（TEMP `inference-webkit-fit-helper-review.md`、SHA-256 `9dd933dcacf04e26748b6ddbd7fb85e187bcc04cc184629e6e479597649e6f9e`）。helperと呼出しを取り除くと前回検証済みの試験ソースへ一致することも独立照合した。

同一exportで表示7ケースを再検証し、WebKit **7/7成功（2.1分）**、Chromium **7/7成功（1.4分）**。いずれもskip・flaky・再試行は0。TEMP `ai-agent-library-inference-{webkit,chromium}-fit.json` と同log/exit記録に保持した。初回165成功と修正対象7成功（初回失敗2件を含む）の組合せでWebKit対象167件を確認しており、全167件を再実行して成功したとは記録しない。BUILD_ID、7 HTML、6入力digestは不変。

## 独立表示・動作レビュー

図の非作者による最終監査は6記事とも **approved / low、必須修正0**。TEMP `codex-inference-audit-20260924/independent-final-review.md`（SHA-256 `d0911a82c75dc48564b4581dfbe99e46d73b4d4b7f75e3adb41c1fc47470fb85`）と同JSON（`d0bda20de7b12ea8b1f7eecfd89fb6298d92fe3bf304aa004b09752fd187b89a`）に、対象版・全画像・入力digestを固定した。統合作者による表示監査と、別担当による統合コードレビューを組み合わせており、自己承認ではない。

新4図の全23整数段階・19境界の前後38状態・全selectorを含む237画像、旧5記事11図の67整数段階と11画像を確認し、計248画像を全件目視した。1440/1920、1280×720、768、390、960×540 DSF2の明暗を確認。1280のI2補助文字は約13.28pxで実寸でも読取可能と判定した。低い画面ではstickyを解除して通常スクロールする。390の小さな注記を実機で快適に読めるとの判定は含めない。

初回監査の目次操作1件は、閉じたnative detailsを開く操作が検査側に欠けていた。失敗を保存し、summaryを開いて17アンカーを限定再検証し17/17成功した。補完途中の誤ったMermaid selectorによる失敗も保存した。初回・補完の前後でBUILD_ID、7 HTML、6入力digestは不変。別の公開検査予行で出たI3 S1の文字BBox交差4組も実寸画像を独立確認し、字形の接触や欠けがないと判定した。機械の交差候補と視覚的衝突は区別する。

全6記事のJS無効・印刷DOM、4図の実時間再生・停止・画面外停止・終端再開、本文同期と状態独立を確認。可視応答は20.1〜27.3ms、rAF P95は16.7〜16.8ms、新記事と無図対照のcold-load CLSは0。共通入口のgzip再計算は21,612 bytes、新記事4図とreadingの合計は40,752 bytes。無図対照へのheavy scene配信は0。これらはローカルブラウザー観測であり、実HTTP転送量や分離した速度ベンチマークではない。

page console error・HTTP >=400は0。生のrequestfailed 875件（navigation/prefetch等のERR_ABORTED 869件、JS無効時のCSP拒否6件）とChromiumプロセスのGPU警告は保存し、全要求成功とは扱わない。faviconはbasePath配下で200・SVG MIME・324 bytesを確認した。専用サーバーは停止し再接続拒否を確認済み。公開配信・物理端末・実スクリーンリーダー・物理印刷の受入は別である。

## 公開検査の準備

公開検査は旧43ケースを保持し、推論14ケースと必須favicon1ケースを加えた58ケースを準備した。期待BUILD_IDと6記事HTMLのhashは、マージ後の成功main CIのPages artifactから独立取得する。公開HTMLやローカルbuildの値を期待値へ流用しない。対象SHA、run attempt、deploy job、Pages status、artifactを取得前後で照合する。

検査コードの独立レビューはapproved / low、必須修正0。TEMP `inference-public-script-review.md`（SHA-256 `ae1e1a073dfe8b91f9c5d8a937703a071fd57ce2574d689aaca770ef4945ef37`）。moduleは `90808bc9fb9dcf9c1e0f06e3b1ddc4e243bd0a0460f1d8d30c8997bb7415f80e`、runnerは `feda2fe31c1f983ab534714e4b3aaadebbd17155951d9f7a5089284ca1f03edd` に固定した。文字BBoxの交差を座標・寸法・PNG付きの目視候補として保持し、機械成功と独立画像承認を別にする。図外逸脱・Wireと文字の交差・不正fontは機械失敗のまま。

新14ケースは独立したlocalhost adapterで予行し14/14成功、50 PNGを保存した。TEMP `inference-public-local-rehearsal/run-2026-09-24T11-27-46-749Z/result.json`（SHA-256 `bbc31584b6f6c2d61b7a130cfc3e474cbf82a6539ef9c77da0d5dc5530b34979`）。初回のBBox判定による13成功・1失敗も保存している。最終予行でも1280のI3 S1の4組を候補として記録し、実寸画像で文字接触なしを独立確認した。これは検査実装のローカル予行であり、公開受入ではない。4206サーバーは停止・待受なしを確認した。

CI・Pages・artifact・公開版を結び付ける取得処理も別担当が限定レビューし、approved / low、必須修正0（TEMP `inference-public-identity-review.md`、SHA-256 `3035b17e78106cef9e16ad7cdac8aaa2ab19625928a73b4e1c4deec6312a19a2`）。実merge情報と成功APIの生記録をrootが取得して根拠とし、保存JSONだけを外部状態の証明とは扱わない。機械58ケースの完了と公開画像の独立承認は別に確認する。

受入記録の更新処理も独立レビューしapproved / low、必須修正0（TEMP `inference-release-record-review.md`、提出版の記録と6ゲートの照合を含む最終SHA-256 `77c9ffaf5788089b8f1e2940f40230e53349cb62ba16a778f3c889fa013e92be`）。実行時に固定レビューJSON、実WebKit初回失敗2題名、両エンジン再検査の全7題名と成功、BUILD_ID・7 HTML・6入力digestを照合したうえで、6記事のreview/localを記録した。公開ゲートは全6記事ともnullのまま。過去のPR #56スナップショット5本は変更していない。

## 記事変更記録の補完

[PR #57](https://github.com/pero3dev/ai-agent-library/pull/57)の初回候補 `a4f1a7b300506be4b905b37cb8f5af68c0a4035b` では、記事訂正用manifestが欠けていたためharness-policyが失敗した。図解の検査や独立レビューを、通常記事の変更記録の代わりにはできない。公開済み履歴を変更せず、[publish-reviewの通常記事変更手順](../../../.agents/skills/publish-review/SKILL.md)で不足を補完する。

top-pの境界訂正をsubstantiveとして、[変更記録](../../../harness/changes/2026-09-24-inference-reading-diagrams.json)へ元main、実編集者ID、U-1の全成果物、実取得した原論文とUTC日時を記録する。候補treeと全差分digestを固定してdoc-reviewerへ渡し、実際の独立判定・時刻・digestを受けた最終manifestでpolicyを検査する。通常の追加commitで提出し、必須CIと公開確認を終えるまで公開完了とはしない。記事の公開状態と既存U-1完了状態は維持する。

## PR #57の公開と表示ラベルの再修正

記事変更記録の補完後、PR #57は `140481edc3968d853f5b8c2b56d4ec5c9c29b027` としてマージされた。main CI `35998331013`、Pages job `107631808949` は成功し、BUILD_ID `5JreEwMcIwsNeVNWXJI0I` とCI artifactの6記事HTMLを公開配信へ照合した。公開ブラウザーは58/58成功、155 PNGを保存した。

独立した公開画像レビューでは、サンプリングの最後の比較において棒の確率と下段のロジットを区別しにくい必須修正1件が見つかった。このため推論内部の記事全体の公開受入は保留し、[表示ラベルの修正記録](inference-score-label-fix.md)へ継続する。ローカルの旧承認と公開58件の機械成功を、修正版の公開承認へ流用しない。
