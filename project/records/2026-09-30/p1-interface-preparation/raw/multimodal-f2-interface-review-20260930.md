# F2 インターフェース計画の独立レビュー

判定: **approved / low、must 0・should 1**。採択済み F2 絵コンテの具体化として妥当です。以下の should は変更記録のタスク名の明確化だけで、計画をブロックしません。実記事訂正、実装、実画面、公開受入の承認ではありません。

- reviewed_at: 2026-09-29T19:11:39Z
- reviewer_run_id: 01a0ced7-e41c-70c1-904e-2ae30ff2fa4b:/root/inference_doc_review
- 参照コミット: 5940334a6fd3aab8178cfeb8746a58c8b937d390
- 対象 MD SHA256: a7634a2b3a1e4de44b1200e6bddfd7b15c5ef0ff64dafb7f80e912d88aada068
- 対象 JSON SHA256: 3577d71ce330008fabfa208dfd3ba444c7a46c897ee8fe6c2f5e48087c4a818b

## 指摘表

MD（multimodal-f2-interface-proposal-20260930.md、3–19 行）は問題なし。計画として approved、must 0・should 0。

JSON（multimodal-f2-interface-proposal-20260930.json）は次の 1 件です。計画として approved、must 0・should 1。

| 重要度 | 行 | 指摘 | 修正案 |
| --- | --- | --- | --- |
| should | 1572 | correctionBoundary の T-task manifest は、対象記事の ROADMAP AR-2 と対応が曖昧です。 | AR-2 に対応する通常記事変更 manifest と明記してください。MD 17 行のタスク全成果物、最終 tree/digest の独立記事レビューという要件はそのまま維持します。 |

## 独立検算

作者 validation を独立証拠として流用せず、上記コミットから git show で原記事・採択計画・根拠記録を取得し、独自の unified/remark parser と assertions で確認しました。adopted F2 object と corrections 13 件は採択 JSON と全体で deepEqual。inputs の生バイト SHA 5 件も一致しました。原記事全文、F2 採択 MD、訂正候補と段階別の契約を読み合わせています。

| 項目 | 独立結果 |
| --- | --- |
| 原記事 SHA256 | 151625bf1c3c744cbb5ed04b4de827e4dea9810e6d45844d6cc54d974da28033 |
| 13 置換後 SHA256（日付未変更） | 27956431766343cd1c4b910ce9d7b703e655365856c3e10484de315684688ced |
| 原 AST SHA256 | 2788b1924a89263949a644475f2c282b2d1440a4506465b1fb63ded3f2f2b04e |
| 訂正候補 AST SHA256 | ba6fdaf2a4362fb1586a9fc4d8090b8f73ad19de103c5e9be8fd1395f2415a08 |
| 原文構造 | 43 root nodes、対象 9 H3・18 body、display math 0・Mermaid 0・table 1 |
| 包装範囲 | representation [12,22)、tradeoffs [22,32)。合計 6 H3・14 body。連続・非重複 |
| 原文単位 | 42 = 動的 27 + 静的 15。13 単位だけが宣言どおり変わる |
| 見出し・リンク・表 | 全 18 heading nodes、25 link nodes、既存 table の AST を保持 |
| READ | 2 図、5+4=9 段階すべて READ。manual-only なし。全動的 topic の body-block と READ stage が一致 |
| 仮包装復元 | 訂正候補を全 4 有効/無効組合せで仮包装し、position を含めて元の訂正候補ノードへ復元 |

AST SHA は position を除き、キーを整列・改行を正規化した値です。原文と訂正後の section 見出し・行・root 範囲・bodyTypes は一致し、front matter は変更していません。仮包装は構成の実現可能性の検算であり、未実装の製品 AST 変換の合格記録ではありません。

| 図 | 訂正前 sourceDigest | 訂正候補 sourceDigest |
| --- | --- | --- |
| multimodal-representation | sha256:3324ade1e55f96e5d8e661b93a7f3d0e9ca1b44ca21fac462cc78030e5917a2d | sha256:bde65e9480e412b84f43e04b32556b2ca9f8be4f29b09523581d27ffcdaf728a |
| multimodal-input-tradeoffs | sha256:1aeec688b92f8892b56e7df0db626df803cabaf660b68c6a3d1f38898047107f | sha256:1134db9f9a307d41fa2db299aa46ca92bf28df5e3eb264087ffdb2314df04cb0 |

13 置換の各 matchCount は 1。対象行は M1=38、M2=45、M3=46、M4=72、M5=81、同期=55/56/79/97/98/100/105/108。本文のディスクへの適用は行っていません。

## 意味と表示契約

- representation: 2×3 は説明用の 6 小片で、実エンコーダの列長や課金数ではありません。同じ patch/source ID を列への移動、逆シーク、中間位相でも保持する契約です。構成例という限定は S0 から常時表示し、音声は別の変換・表現経路で画像パッチへ流用しません。テキスト由来カードも実単語=トークンという主張にしません。注意は模式線、出力は未生成の枠で、実測重み・回答・成功を捏造しません。問題なし。
- tradeoffs: S1 の粗い/細かい、S2 の画像全体/関心領域/OCR/構造化という操作だけを許し、他段階の effective setting は null。既定状態で注意点と代替経路を見せ、細かい粒度が detailsRetained=true や精度向上を意味しません。小文字・密な表・位置・数え上げの 4 論点、原入力の来歴、検証の必要性を保持します。問題なし。
- OCR/構造化の経路は必要情報・位置/外観・認識誤りを確認する比較対象で、一律に安い・確実・画像は最後という判断をしません。解像度、枚数、使用動画フレームは確認条件で、価格・速度・精度は未計測です。問題なし。
- 入力理解からのテキスト出力とメディア生成を別能力として表示します。片方から他方への保証線や特定製品の対応判定を置かず、構成例のテキスト出力から全モデルの生成不能を推論しません。問題なし。
- M1–M3 の構成限定、M4 と関連同期の一律換算の除去、M5 と関連同期の情報保持条件は採択済み文言と一致します。本文を追加解説・数値例で増やさず、13 置換を先に適用し独立記事レビューを受ける契約です。問題なし。

## 根拠と時刻の区別

既存根拠記録 research/internals/p1-remaining-diagram-sources-2026-09-24.json の SHA256 は 3aff21e037e9eec6962925e459e5e8a762f8b8511d8d8212b34f91cd55eb28d1。提案に残る 2026-09-24 の取得時刻は来歴として保持されており、提案作者が今回取得したとする記述はありません。

今回のレビューでは独立補助確認として、[Flamingo v1 §3.1.1 と接続の記述](https://arxiv.org/html/2204.14198v1) の固定数の視覚出力と cross-attention、[ViT v2 abstract](https://arxiv.org/abs/2010.11929v2) のパッチ系列、[TextVQA v2 abstract](https://arxiv.org/abs/1904.08920v2) の文字と画像/質問文脈の組合せを実取得しました。取得後 UTC は 2026-09-29T19:09:07Z。

[Visual Instruction Tuning §4.1–4.2](https://arxiv.org/html/2304.08485) では画像特徴の言語埋込空間への射影と画像/指示系列を確認しました（取得後 UTC 2026-09-29T19:10:55Z）。固定 v2 HTML の初回取得はエラーだったため、既存記録が参照する非固定 HTML を使用した補助確認です。これらはこのレビュー自身の取得であり、過去の採択計画や本文アクセス日を変更するものではありません。論文から料金、精度、速度の一般的優劣や音声の特定実装を確認したとは扱いません。

## 承認範囲

未実装の計画契約のみ approved です。実際の本文訂正日・参考資料との同期、AR-2 の変更記録、最終記事候補と根拠の独立レビューは制作時に必要です。F1 公開受入後に F2 を開始する境界を維持します。製品 unit/AST、実ブラウザー・画像・操作、CI/Pages/公開配布物は今回受入していません。P1 全 15 記事の公開受入後に停止し、P2 に進まない条件と整合します。製品・記事・Git は変更していません。
