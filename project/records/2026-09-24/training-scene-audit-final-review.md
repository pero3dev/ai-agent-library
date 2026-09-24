# C1 図固有実装の独立最終レビュー

判定: **approved / low**。must 0 / should 0。確認日時: 2026-09-24T14:42:52.836Z。

レビュー担当は /root/training_integration_map。承認対象は他者が実装した C1 の 2 models・2 scenes・2 CSS・2 units と、その統合後の画面・旧6記事の動作回帰。自分が実装した registry/AST/MDX/受入などの共通統合コードは独立承認の対象に含めず、別レビューに委ねる。製品・Git・公開サイトは変更していない。

## 版の固定と初回指摘の解消

最終 BUILD_ID: **GpM7J_g8lnbvEy6H7i7nO**。C1 inputDigest: **sha256:ac6d8aabd80a18e7cf8d54343531ba1e43e346f18ec9bde25017b350e955750e**。7記事の inputDigest と HTML SHA-256、8担当sourceの SHA-256 を 2026-09-24T14:32:38.889Z ～ 2026-09-24T14:35:49.799Z の前後で固定し、判定時にも再照合した。詳細は JSON の identities/fileHashes。

初回の C1-REFUSAL-FACTORS は解消。S2 拒否行に「SFT・選好・実行時制御も影響」を同じ20px文字で追加し、detailにも原文由来の一節を加えた。既定の幻覚強調、迎合/拒否選択、全8画面条件でも3行の比較と留保を保持する。本文記事は SHA-256 993147125244a6bfc7b3e64ca5d9f4f2142dd944b7a1fa7d43d33a79b7242e62 のまま。初回の changes_requested 記録と110画像の実見結果は別版として保持した。

## 検証結果

- 改訂sourceで担当unitを独立実行し16/16、fail/skip 0、319.0531ms。独立モデル検査では 0.01 刻みの 802 位相、全 focus 設定の組合せについて、整数面の意味・固定の重み箱・検索先・外部権限の経路・架空数値なしを確認。
- C1 全10整数面を1440×1000明暗、1920×1080、1280×720、768×1024、390×844明暗、960×540 DSF2で検査。80面すべてSVG文字の図外はみ出しとページ横スクロールなし。境界前後16面、逆シーク、11 selector choices/defaults、9 READ停止、キーボードHome/End、modal/focus復帰、実時計再生/一時停止/画面外停止を確認。
- 学習と検索の入力先、固定重みの位置、RLHF/DPOの別経路、関連を示す点線、モデル候補からモデル外権限→操作→結果検証を視認。模式図と実測値の区別、事実の学習可能性の条件、対象closed-book QAの範囲、単一原因/品質保証へ一般化しない留保を確認。21 dynamic topicsと13 static topicsの範囲を照合。
- 元の8 H3の文字列一致とMermaid1本の実SVG描画を確認。7記事のno-JSで本文と段階一覧を読め、操作はdisabled。printで本文/SVGを保ち操作を隠す。C1の2個別chunkを故障させても原文8H3と本文が残る。
- 旧6記事の15図・90整数段階を再確認し、15代表画像を実見。各記事はその記事の図だけを読み込み、無関係な図を配信しない。図なし記事は重いscene/core chunkを要求しない。

## 実画像の範囲

最終版では156枚のscene/panel画像を取得し、**81枚を本人が実見**した。20 contact sheets内の76枚（1440明全10面、390明/960 DSF2の全20 SVG、境界16、旧図15、全choices11・modal2・print2）に、他の5画面条件のS2を直接表示した分を加えた。重複実見は数えない。初回版110枚とは別集計。no-JS全文画像1枚は取得のみで、この実見数に含めない。

低い画面では図のpanel全体が同時に収まるとは主張しない。通常のスクロール撮影ではサイトnavが画像の上部を横切ることがある。390/960にはSVG全体をnavより下の実viewportへ収めて撮った別画像があり、対象画面のすべての段階を再実見した。図中文字の最小値はPCで約15～18 CSS px、390で約10 CSS px。PCでの学習を主対象とし、拡大/縦スクロールで確認する。

## 性能と配信

C1のscene/coreは gzip換算 **18,209B**、共通entryは **21,681B**。旧6もscene/core最大40,797Bで、記事75KiB・共通100KiBの目安を満たす。図関連の初期CLSは全7記事で0、attention-variantsのページ全体の非入力CLSは0.0415412（図に帰属しないものを含む）。操作応答は18.1ms / 42.8ms、実時計rAF p95は両図7.1msで、200ms / 32msの目安内。

この測定はrootの検査と並行した同PCの観測で、隔離benchmarkやGPU paintの測定ではない。gzipはローカルの実chunkをNodeで圧縮した値で、HTTP転送圧縮や厳密な増分module量ではない。閾値緩和や失敗結果の破棄は行っていない。

## 論点照合

| Topic | READで確認した面 | 判定 |
| --- | --- | --- |
| training-representative-order | training-stages S0 | 確認済み |
| training-different-data | training-stages S0 | 確認済み |
| training-association-not-cause | training-runtime-boundary S0 | 確認済み |
| training-next-token-patterns | training-stages S1 | 確認済み |
| training-knowledge-range | training-stages S2 | 確認済み |
| training-frequency-accuracy | training-stages S2 | 確認済み |
| training-base-instruction | training-stages S2 | 確認済み |
| training-sft-demonstrations | training-stages S3 | 確認済み |
| training-sft-facts | training-stages S3 | 確認済み |
| training-closed-book-limits | training-stages S4 | 確認済み |
| training-retrieval-requirements | training-stages S4 | 確認済み |
| training-separate-evaluation | training-stages S4 | 確認済み |
| training-preference-data | training-stages S5 | 確認済み |
| training-preference-methods | training-stages S5 | 確認済み |
| training-preference-targets | training-stages S5 | 確認済み |
| training-multiple-objectives | training-runtime-boundary S0/S2 | 確認済み |
| training-hallucination-checks | training-runtime-boundary S2 | 確認済み |
| training-sycophancy-conditions | training-runtime-boundary S2 | 確認済み |
| training-refusal-limits | training-runtime-boundary S2 | 確認済み |
| training-prompt-tendency | training-runtime-boundary S3 | 確認済み |
| training-external-boundary | training-runtime-boundary S3 | 確認済み |

## レビュー対象ファイル

| File | SHA-256 |
| --- | --- |
| website/lib/training-stages-model.mjs | 86bb6fd18d34adb01f8511b9f139a3218d875a7d0febe9d90e382358abdd648b |
| website/lib/training-runtime-boundary-model.mjs | 290be52f3e5c413cfa0a50c5592c582fa19bbebf24cf4e9ff2b3e25c940ce097 |
| website/components/diagrams/training-stages-walkthrough.jsx | 1e59e2821f9e6622704934a1796294019164e621584c816444589e2bfd2c52aa |
| website/components/diagrams/training-runtime-boundary-walkthrough.jsx | 48a8760c0710cb36ea6f661d7f4e575c4c8f347403cfe18af5238e0d88d38a53 |
| website/components/diagrams/training-stages.css | a9188e12f0141444ffbe8334de052f5ae3447ad923ac71b803b3e885c1897f03 |
| website/components/diagrams/training-runtime-boundary.css | 71061427c9108c0612ca896910435a6a926f2b02cbc1f5dbd2c1d2a53dc9defb |
| website/tests/unit/training-stages-model.test.mjs | 2c6004084fd20ecc110f0c6de5d59a5f05f4918d8b95ec49cf89d37e5579c868 |
| website/tests/unit/training-runtime-boundary-model.test.mjs | c991b5ec08400a96cb82f3f58cb1c89da6f6434a8222daf3ad4c7b788788ca03 |

## 証拠と未実施

詳細: training-scene-audit-browser-v2.json（SHA-256 14064f1fb9afa67712888497ac5f917b236c50a460921557c53777414b5f0180）、training-scene-audit-final-review.json、training-scene-audit-final-sheets.json、training-scene-audit-images-v2/。最終の画像ファイル名とhashはreview JSONのvisual.viewedに固定した。

本レビューが実施したのはローカルWindows Chrome。WebKit・CI・公開配信の根拠はrootの別検査であり、この独立レビュー自身の成功とは数えない。実機iPhone/Safari、実サービス実行、実モデル学習は未実施。この記事の全gate完了や公開を、この記録単独で主張しない。
