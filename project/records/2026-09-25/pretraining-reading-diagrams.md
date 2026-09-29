# 事前学習とスケーリング則の読書連動図解

状態: C2の実装・ローカル検証・独立コード/実画像レビュー完了。正式記事レビュー、PRと公開受入はこれから行う。P1の公開受入は7/15記事で、この記事の完成はまだ数えない。

## 作業契約

- 目的: 承認済みの[詳細設計](../2026-09-24/training-storyboards.md)と[機械対応表](../2026-09-24/training-storyboards.json)に沿い、C2を5図23段階・19 READへ対応させる。本文を増量せず6か所の事実訂正を適用する。
- 開始: PR #59のC1独立公開受入 approved / low、must 0を確認。baseは `517dc8b5166bd7b0c85baef3800d7fe57bac7b31`、branchは `feat/pretraining-reading-diagrams`。
- 所有: rootは記事・registry・AST/MDX安全性・dispatcher・受入・browser・記録とGit。数値3図12ファイルと概念2図8ファイルは担当を分離する。公開検証キットも別担当。他者変更を戻さない。
- 許可: ユーザーの自律実装と公開反映依頼。P1全15記事の公開受入で停止し、P2へ進まない。別PC用の引き継ぎ文書を残す。
- 必須検証: 数値/意味モデル、元AST保持・固定包装・不正MDX拒否、全主要論点のREAD到達性、操作/逆シーク/明暗/狭幅/低画面/縮小モーション/印刷/JS無効、作者以外の実画像確認。共通check・site unit・静的export・browser、記事変更manifestの独立最終レビュー、PR全チェック・通常merge・同じmain CI/Pages artifactと公開配信の照合。
- 終了条件: 新C2と共有入力が変わる旧7記事を現行inputDigestで再受入し、次のD1へ進む。計画の承認や過去snapshotは新製品版の承認ではない。

## 記事訂正の根拠

[一次資料の確認](../../../research/internals/pretraining-diagram-sources-2026-09-24.md)と[詳細JSON](../../../research/internals/pretraining-diagram-sources-2026-09-24.json)に基づく6置換を適用する。下限からの損失差、固定予算内の配分と予算増加時の成長、FLOPsと実コストの区別を明確にする。式・段落・見出し・箇条書きは増やさない。初回実装時のlast_updatedは2026-09-25 JSTで、再開後は下節の実作業日に同期する。実取得した2資料のアクセス日は2026-09-24、未取得の3資料は元日付を維持する。通常記事変更はT-1の全成果物（未変更alignment-theoryを含む）を独立レビューへ渡す。

## 2026-09-30の再開

利用制限による中断後、作業差分を保持してmainの別記事更新PR #60をfast-forwardで取り込んだ。現行baseは `a9f4364f0a8adcbdaa873a16d012ab7c2a0516a0`。記事の最終作業日を2026-09-30 JSTへ更新し、一次資料の実取得日2026-09-24と過去のレビュー日時は維持する。

中断前のsite unitは360/360成功。root checkは480件中469成功・10失敗・1スキップで、失敗を成功扱いにせず、環境の権限制約を含めて再確認する。初回の静的exportは成功したが、その後のKaplan表示訂正を含まないため最終候補で再生成する。公開受入は引き続き7/15記事。

再開後はroot/website双方で `npm ci` を実行。通常権限での `npm run check` は479成功・失敗0・skip1、Markdown・記事規約・リンク・ハーネス検査も成功した。前回の失敗はsandbox実行ユーザーのGit所有権とユーザーディレクトリへのrealpath制約によるもので、製品やテスト条件を変更せず解消した。再開時のstatic exportは223ルート・230 HTML・16章を確認し、BUILD_IDは `iLekWQhd6OAV88q9PsICA`。生成前後の8記事inputDigestが一致する。これはローカル生成版の識別情報であり、CI artifactや公開配信の確認は後続で行う。

[公開検証キットの独立レビュー](pretraining-portable-review.md)はapproved / low、must 0。旧71件の保護とC2追加20件、実Git先行版との全文比較、offline25件を確認した。レビューの元ファイルと初回実行は[再開時の移管索引](pretraining-local-evidence/resumption-file-index.json)、再実行と独立証拠は[検証ログ索引](pretraining-local-evidence/verified-local-file-index.json)にhash付きで保持する。

[再開後の限定追補](pretraining-resume-addendum-20260930.md)ではKaplanの明示と担当unit25/25、base・記事日付・stage 3の可視ラベルassert 1行を確認した。共通統合はapproved / low、must 0で、公開検証キット15ファイルは旧独立レビュー版と一致する。作者自身による数値図の承認や実画像レビューには読み替えない。[元/保存hash](pretraining-local-evidence/addendum-file-index.json)を保持する。

再開後のEdge全323 browser試験は317成功・1失敗・既定の音声fixture未使用5スキップ、754.168秒。唯一の失敗はmetricsの数値assert完了後、stage 0へ戻すテスト操作の可視位置待機で発生した。原因確認と修正後の再検査を必要とし、成功には算入しない。[初回結果・trace](pretraining-local-evidence/initial-browser-file-index.json)を保持する。独立画像確認では損失図stage 2の矢印と文字に余白を追加する指摘があった。後述の最終レビューで修正を確認した。

[独立した操作診断](pretraining-metrics-stage0-diagnosis-20260930.md)では、最初のtraceからstage 2の数値確認後、stage 0のclick前に待機が失敗したことを特定した。別の再現でボタン下端1000.40625pxに対し画面高1000pxとなり、`scrollIntoViewIfNeeded()` の反復でも移動しなかった。標準の中央スクロールなら厳密な画面内判定と3フレーム安定、通常click後の元assertをすべて満たす。生traceに座標は保存されておらず、数値は別の再現で得たものと区別する。[移管hash](pretraining-local-evidence/metrics-diagnosis-file-index.json)を保持する。

製品は損失図の矢印を `204v27` から `204v16` へ1か所だけ変更し、文字と数値の位置・内容を保持した。C2試験と公開検証キットはクリック前の中央スクロールへ同期し、待機・可視性・値のassertは維持した。キットの来歴逆変換と全25 offline試験は成功。再生成した候補のBUILD_IDは `RuEOJ2GbDzXcNrG4UDMh4`、8記事inputDigestが生成前後で一致する。旧ビルドの結果は保持し、この候補の局所再検査と独立表示確認を進める。

[中央スクロール変更の独立レビュー](pretraining-center-scroll-review-20260930.md)はapproved / low、must 0。現行キットmanifestは `caa2a618c84e6277b9fd6d60698765787a4667f4b73253fe26f86f6ec147544b`。旧71ケース・元のassert・実Git先行版8ファイルへの復元を維持し、[詳細証明](pretraining-center-scroll-independent-proof-20260930.json)と[移管索引](pretraining-local-evidence/center-review-file-index.json)を保存した。

第二browser実行は対象87件中86成功・1失敗（skip 0）。残った失敗は初回stage 2への通常clickとREAD同期の競合で、[第二診断と限定レビュー](pretraining-metrics-stage2-diagnosis-review-20260930.md)により原因と回復を確認した。C2ローカル試験だけ、同じ中央スクロール・厳密な3フレーム安定を全stageへ適用した。製品・公開キットは変更していない。[再実行したC2全36件](pretraining-local-evidence/final-c2-browser-file-index.json)は36成功、fail/skip/flaky 0、237.951秒。第二実行の本文・数式・chunk失敗試験51件と合わせ、変更の影響範囲を確認した。全323件を最終版で再走したという意味ではない。[第二実行](pretraining-local-evidence/second-local-file-index.json)と[診断の生証拠](pretraining-local-evidence/metrics-second-diagnostic-file-index.json)を保持する。

独立browser検証は最終Edge 20/20、修正前WebKit 20/20と最終WebKitの損失図限定7/7。最終WebKit全20の再走とは区別する。矢印だけの製品差分とクリック前スクロールだけのキット差分は逆変換で確認し、[全原結果と差分証明](pretraining-local-evidence/independent-browser-file-index.json)を保存した。最初のEdge 13成功・7失敗も改変せず保持する。各実行で8記事のinputDigest・HTML・BUILD_IDが前後一致し、公開CIや実端末の結果には読み替えない。

## 最終ローカル受入

[独立コード・実画像レビュー](pretraining-scene-review.md)は2026-09-29T17:00:43.085Zにapproved / low、must 0・should 0。最終C2の全5図23段階と19 READ、元の数式・AST、数値/意味モデルを突合した。画像117枚（初回42・最終C2 58・旧7記事17）を実視認し、生成総数1020枚と区別する。[原レビューと証拠](pretraining-scene-review.json)、[別PC用の相対索引](pretraining-local-evidence/scene-review/index.json)から原結果・限定差分証明・実視認画像をたどれる。旧7記事も17図100段階を操作し、ページエラー0・版一致を確認した。

最終BUILD_IDは `RuEOJ2GbDzXcNrG4UDMh4`。全8記事のinputDigest・HTML・BUILDをレビュー開始/終了/確定時に照合した。共有入力が変わる旧7記事のreview/localゲートもこの入力版で再受入し、PR #59固定snapshotと旧publicゲートを履歴として残す。現行8記事のpublicゲートは未受入であり、ローカル成功を公開完了へ読み替えない。

性能測定はWindows Edge、1440×1000、loopback、CPU/通信制限なしで実施。C2固有chunkのgzipは44778bytes、共通entryは21808bytes、8記事と対照記事のCLSは0。操作からrangeの初回更新は10.5–15.9ms、native再生のrAF P95は7.1–7.2ms。採択基準内だが、GPU描画時間や実端末の保証ではない。実スクリーンリーダー・物理iPhone/Safari・物理印刷は未実施。

## 検証記録

正式記事レビューは全記録と受入ゲートをstageした不変treeを対象とする。変更manifestの最終判定後に通常PRへ提出し、全CI・実merge・main CI/Pages artifact・公開全91件をEdge/WebKitで確認してから、公開画像を独立レビューする。公開後の識別情報は後続記録へ保存する。

通常記事変更の最終判定は[変更manifest](../../../harness/changes/2026-09-25-pretraining-reading-diagrams.json)を正本とする。本文訂正と図解・検証キット・公開受入の判定を区別し、最終候補の固定前に記録類を揃える。

初期統合検査はAST・MDX・記事受入の79件中78成功、1件は新しい負例の作り方に不足があった。1見出しの配列反転が変更にならないことと、共有する意味依存の先行検査を整理し、全4 AST試験を取り直して成功した。製品の検査条件を緩めず、壊れた本文ブロックを構造の誤りとして拒否することを確認した。記事受入36件とMDX39件は初回から成功。5図の全32有効化組合せで元ASTへ戻ること、22本文block・6見出し・4表示数式・1 Mermaidを保持することを確認した。機械的なラベル到達性は内容・実画像レビューの代わりにしない。

[数値3図の実装記録](pretraining-numeric-implementation.md)と[詳細JSON](pretraining-numeric-implementation.json)では担当unit25/25成功。損失の確率0・1、配列・有限性、固定/拡大予算、未知の実コスト、操作の段階内への限定を確認した。[初期ログと移管hash](pretraining-local-evidence/initial-unit-file-index.json)を保持する。初期の製作者によるunit成功だけで表示・公開を受入済みとはしない。

[概念2図の実装記録](pretraining-concept-implementation.md)と[詳細JSON](pretraining-concept-implementation.json)は担当unit13/13成功。資料と処理出現の同一性、固定した連続スコアと整数の閾値判定を確認した。rootのコード読取で再利用アイコンの絶対座標と連続グラフの目盛位置を修正した。数値側の面積図も寸法線を実際の面積へ合わせている。実画像は別途確認する。

[独立統合レビュー](pretraining-integration-review.md)と[詳細JSON](pretraining-integration-review.json)はapproved / low、must 0・should 0。記事は承認6訂正と日付更新だけ、全主要論点・固定包装・sourceDigest・MDX制約は一致し、独立unit79/79成功。5登録のsource reviewに伴う3欄だけの変更も[追補照合](pretraining-integration-promotion-proof.json)で確認した。レビュー担当の数値3図自体はこの独立判定から除外し、別担当が5図の実画像と意味を確認する。図別sourceの確認と、記事全体の3受入ゲートを区別する。

[公開検証キットの実装](pretraining-portable-implementation.md)と[詳細JSON](pretraining-portable-implementation.json)は8記事・91ケースへ拡張し、旧71件の名前・順序・本文を保持した。offline25/25と準備検査は成功したが、実ブラウザー・公開成功を意味しない。移管時の元/保存hashは[実装記録](pretraining-local-evidence/implementation-file-index.json)と[統合記録](pretraining-local-evidence/integration-file-index.json)の相対索引に保存した。
