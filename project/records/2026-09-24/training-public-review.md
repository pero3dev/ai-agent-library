# C1 学習パイプライン 独立公開受入レビュー

判定: **approved / low、must 0、should 0**。確認確定: 2026-09-24T15:59:03.585Z。

レビュー担当は /root/training_public_acceptance。C1 製品実装、公開 runner、待機候補の作者とは別。担当した変更は TEMP の補助キャプチャとレビュー記録だけで、repo・製品・Git・原 result.json は変更していない。原 raw の independentVisualReview.pending は維持し、この別文書で公開画像を判定する。

承認範囲は PR #59 の C1 2 図と既存 15 図の公開回帰。P1 全 15 記事の完了を宣言する記録ではない。

## 公開物の同一性

- actual merge: 517dc8b5166bd7b0c85baef3800d7fe57bac7b31
- main push CI: 36019573674 / attempt 1、workflow .github/workflows/ci.yml
- build job: 107700727287、Pages job: 107704025706、成功 deployment: 6641574999 / status 18790811264
- github-pages artifact: 10816009077、BUILD_ID: EliX86DAnCpMQHOKIyCQx
- artifact container API digest: sha256:4e0c35dcdffaf17926ab8ff46e6d14bb6e179bb58f13727ce319f5faa32f42ca
- ダウンロードした artifact.tar の独立 SHA256: 8c0be0f46463d79cb03cfc3bdb3b5f302cc42384fb71468b47a69cdbfcc382ec。container digest と同一視しない。
- collector の前後 API 記録、7 HTML の実 bytes/hash、main run・job・deployment・artifact の対応を照合した。原ブラウザー全 70 document/engine は固定 URL、BUILD_ID、対応 artifact HTML の hash が一致（図解を持たない alignment control は BUILD_ID 照合）。
- 補助キャプチャ前後の 7 HTML と、両原 run・限定再検証が終わった後の **2026-09-24T15:55:33.828Z** の 7 HTML を再照合し、すべて同じ BUILD_ID/hash、HTTP 200、text/html。最後の再確認は training-public-identity-after.json（SHA256 d25303ea2bcf18169cdbba123f8d1a74c744b63e3bdd4925a1a00048b7f14cb5）。

| 記事 | artifact / 公開 SHA256 |
| --- | --- |
| /docs/llm-internals/inference-internals | 19e9dbcedadaadf3e3d6ed22a66af49ce3af1423f719cc82f7e8925f0c7eba4e |
| /docs/llm-foundations/how-llms-generate-text | 7c52c141f61acdbc6ec799b9b94d188038104b1f8ff1fec4063ed35fe454e421 |
| /docs/llm-foundations/tokenization | 6e95d58f9efdd94d57a255eb5da2d9365e295fae2f3eac843afa54971a02d61e |
| /docs/llm-internals/mixture-of-experts-internals | 06d18b2e1e73df8a08d35f91e418245b020d8326419662bb9fc80db6b94a5174 |
| /docs/llm-internals/attention-variants-and-long-context | 1a5f5f609fdeb51fd8e7025aecd5b3fc2195757e64e8c6767b8c2075fd6db2b9 |
| /docs/llm-internals/transformer-architecture | 66df211e702e20e4006318faa2107ebf0e82eb283bbc9ae055eaf268971f24ec |
| /docs/llm-foundations/llm-training-pipeline | 8e541c3ad8371923044012902c39ecd6abccc148c088a93ac27aeef4131ce73d |

## 実行結果と実見範囲

| 証拠 | 原 case 結果 | 生成 PNG | 直接実見した PNG | うち C1 |
| --- | --- | --- | --- | --- |
| Chromium Edge 153.0.4234.48 | 71 / 71 成功 | 295 | 83 | 66 |
| WebKit 26.6 原 run | 66 成功 / 5 失敗 | 284 | 53 | 40 |
| Transformer 独立補助キャプチャ | 4 図 stage 2、7 HTML 前後一致 | 8 | 8 | 0 |
| 合計 | 原 WebKit 失敗を成功化しない | 587 | **144** | **106** |

C1 は両 engine とも **13 / 13 成功、138 PNG（68 viewport + 70 完全 scene）**。全 276 枚を実見したとは主張しない。実見した 106 枚の C1 と、既存図の 38 枚を JSON の imageLedger にファイル名・SHA256・実画素寸法付きで列挙した。残りは生成・存在・hash・寸法を機械照合した証拠だけ。PNG を直接 view_image で開いて判定し、一覧表や機械 pass から可読性を推測していない。

各 engine の C1 全 10 整数段階は 1440 light で実見。Edge は 390 light と 960×540 DSF2 でも全 10 段階、1280 の S1・S5・runtime S3 を追加実見。全 selector、両 modal、noJS/print の scene も両 engine で確認。6 profile は 1440×1000 light/dark、1280×720 light、390×844 light/dark、960×540 light DSF2。

**runtime S2 の「SFT・選好・実行時制御も影響」は、初期選択が幻覚のままでも、6 profile × 2 engine の完全 scene と viewport すべてで実見済み。** 幻覚・迎合・拒否の 3 行と外側の権限確認が保持されている。この文に専用の新 assert が原 public helper にあるとは扱わず、artifact に対応する公開画像で補って確認した。

旧図は generation/tokenization、inference 4 図、MoE 2 図、attention variants 3 図の代表を両 engine で実見。原 runner の Transformer 代表だけでは 4 図が揃わないため、独立で io/position/self-attention/block の stage 2 を各 viewport + 全 SVG として追加撮影・実見した。図の意味、本文との対応、文字切れ、色、ラベルの識別に要修正はない。

## 内容・形状・操作の判定

異なる学習入力から同じ重みを更新する関係、予測と教師信号、SFT による条件付きの事実学習、学習による重み更新と検索による実行時文脈の違い、振る舞いと事実再現性の別評価、選好比較と RLHF/DPO の分岐が保持されている。特定研究の条件を全 FT へ一般化せず、工程順や品質保証を過剰に断定していない。runtime の点線は単独原因を意味せず、操作候補→モデル外の権限確認→許可範囲内の操作→結果検証が分かれている。

全 66 C1 geometry 記録/engine と全 70 scene 画像/engine の対応を照合。全 SVG capture は元の viewport/CSS のまま実 scroll で領域を出し、元 scroll を復元。clip と PNG 画素寸法×DSF の整合を確認した。wire/text 候補は 0。原 run の全 BBox 重なり候補（Edge C1 24 対・inference 12 対、WebKit inference 2 対）は実画像を確認し、字形同士は離れて読める。機械矩形の小さな交差を可視衝突とは判定しない。

低い viewport では固定ナビに panel 上部が重なったり、長い scene の一部だけが写る場合がある。全 scene 補助画像で切れがないことを確認しているが、縦スクロールが不要とは主張しない。390px の文字は PC より小さく、拡大表示を使用できる。

READ 9 停止点は順逆とも raw で到達、runtime S1 は手動補助段階。selector 11 値、全 midpoint 境界と reverse seek、keyboard/modal/focus、noJS 原文・全静的説明、print controls 非表示を raw で確認。実時間再生は Edge 8281 / 8205 ms、WebKit 9280 / 9443 ms で進行・静止・再開・完了を確認した。静止画像そのものをアニメーション動作の証明にしない。両原 run の 67 assets/engine、MIME/body、明示 basePath SVG favicon と無関係記事の heavy chunk 0 も通過。noJS の記録済み CSP 拒否以外の network/console 例外はない。

## 原 WebKit 5 失敗と限定補完

**原 WebKit raw は failed、66 / 71 のまま保存する。** 失敗は inference の 1440 dark、1280 light、図独立・READ、sampling/cache の native elapsed playback の 5 case で、いずれも初段ボタン選択 assert に到達した段階。

独立にイベント原本を読むと、1280 sampling S0 はロジットへの trusted pointerdown 後 224 ms 内に READ が stage 0→1 と配置を更新し、ボタンが 53.578125 px 下へ移動した。pointerup/click は同じ座標でボタンを捉えず、manual へ移らなかった。「成功した onClick の後を READ が上書きした」という証拠ではない。原因イベントを再現したのはこの 1 case。残る 4 case について同じ原因が毎回起きたと断定せず、発生率も推定しない。

候補の唯一の変更は index 0 前の実 scroll + 3 rAF の stage/scroll/矩形/inView 安定待機 24 行。既存 local seekForFit と完全一致し、候補から逆除去すると原 runner へ戻る。元 aria-pressed、data-stage、manual、slider assert を保持し、force click・DOM click・成功化する retry・fake clock・製品変更を追加していない。3 case adapter は元 helper と同一待機 token、追加 2 case adapter は候補 helper 本体を実行することも検算した。

元の inference-checks.mjs をそのまま import する限定再検証は 3 / 3 と 2 / 2 成功し、失敗 5 case 名を漏れなく対応付けた。trusted click 後の stage0/manual/pressed=true、READ と図独立性、実時間再生（9810 / 9593 ms）の進行・静止・再開・完了まで確認。public inference HTML は同じ artifact と一致した。他 6 記事をこの限定実行で監査したとは主張しない。

これにより C1 と既存回帰の限定補完を承認するが、**修正版 runner による全 71 case 再実行ではない**。待機候補の repository への移植・manifest 更新は root 管理の次作業で、今回の製品公開物は不変。

- 独立差分検算: training-independent-diagnostic-proof.json
- 候補 helper SHA256: 6c6b1d1c501a31d3837ba0a538e9fa2a7cdbdee20c1826b9890fad89da2cbcb1
- 候補 runner SHA256: 123d3d7e3ed4243f15b5933bcf0b71aeb55f2c22e94a18ac31045ee380f1f999
- 原 Edge raw SHA256: cefbbb3d8911068df930aa7c2a71e0316caa9b3df743c4473ffae91f857ae1f9
- 原 WebKit raw SHA256: 89b57e7baf51b68763bfdd9b6dd65664a8ae75ef5188b268e93a80a6f0ad746b
- 限定 3 case raw SHA256: ad3b4eb3165bf334cefc65cb7182444e68ba1b07ef88bccc44d949b97e7ab43c
- 限定 2 case raw SHA256: ea3faebac3504fb708721ddf94ce20885892e2f84878b6cdfabf729c76b1034b

## 証拠と限界

review JSON: training-public-review.json（SHA256 fd9a3c14e00cc7858d49425c4120729d9c9d7a0a870f5004594164b4a8ca298a）。元 kit manifest SHA256: 4359f9abf06785671e980686f89e596eb8c0d8cd1842fc3480712941a3b40507。全 source hash、raw hash、画像台帳、重なり候補の個別判定、最後の公開同一性は JSON に固定した。

検算スクリプト初回は tar 名を archive.tar と誤記して停止し、実在の artifact.tar へ修正して同じ hash assert を再実行した。製品・テストの許容値や合否条件を変えていない。

WebKit はブラウザーエミュレーションであり実機 Safari ではない。print は CSS emulation、物理印刷・スクリーンリーダー・実モデル学習・外部ツール実行/権限 backend の新規受入は含まない。
