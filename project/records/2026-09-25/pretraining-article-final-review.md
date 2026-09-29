# C2 事前学習記事・最終候補の独立 publish-review

総合判定: **approved / low、publish 可（must 0、should 1）**。

- reviewer_run_id: `01a0ced7-e41c-70c1-904e-2ae30ff2fa4b:/root/inference_doc_review`
- reviewed_at: `2026-09-29T17:23:32Z`
- base: `a9f4364f0a8adcbdaa873a16d012ab7c2a0516a0`
- candidate tree: `dcd56bbac7886ece933199a2a4bd2d7cbb0bc5a7`
- branch: `feat/pretraining-reading-diagrams`
- manifest: `harness/changes/2026-09-25-pretraining-reading-diagrams.json`
- 独立再計算 content_digest: `93264d16536c88c69226b8bdc182b8aa36245648800923ad3b18f4a92554d641`

## 指摘表

### docs/11-llm-internals/pretraining-and-scaling-laws.md

| 重要度 | 行 | 指摘 | 修正案 |
| --- | --- | --- | --- |
| should | 124–128 | 既存チェックリストの前半は「説明できる」「理解している」という自己評価が中心で、設計レビュー時の具体的な確認証拠へ結び付きにくい。今回の6訂正で生じた問題ではない。 | 将来の本文改訂で、比較対象のトークナイザ・評価データを記録したか、固定計算予算と増額時の配分を分けたか、データ量・品質・混合の前提を確認したか、という検証可能な表現への置換を検討する。今回の本文非増量方針下で追加修正を必須としない。 |

must: 問題なし。総合判定: **publish 可**。

- 目的（14行）: 投資判断と能力の見積りへ接続しており問題なし。
- アンチパターン（116–120行）: やりがちな設計、問題の理由、代替策が揃い問題なし。
- 文体・初出用語: 今回の変更で問題なし。新しい独立用語の追加はなく、GLOSSARY の関連語と矛盾しない。
- TODO（153行）: 確認対象と参照先が具体的で問題なし。
- 関連トピック・数式・図の用語: 問題なし。残差、固定予算、予算増加、FLOPs、実コストの区別が揃っている。

### docs/11-llm-internals/alignment-theory.md

今回の差分への追加 must/should は問題なし。base と candidate の生バイトが同一で、status は published のまま。T-1 の成果物として全文を確認した。**既存 published の維持可**。この判定は既知の A1–A3 の記述を正確と再承認するものではない。

93–96行と130行の、結果/過程という評価粒度と、学習済み報酬モデル/人手/検証器という報酬源の混同は残る。承認済み D1 計画の A1–A3 には、これらの最小置換と alignment-feedback 実装前の適用条件が保存されている。Lightman 論文 §2.4 の人手ステップ評価と §2.5 の学習済み outcome reward model を再確認し、訂正理由が引き続き妥当であると判断した。

C2 はこの記事を新規公開昇格せず、当該箇所も編集しない。C2 の5図は事前学習の損失・配分・データ・測定・計算量を扱い、報酬源の説明を利用も拡張もしない。よって既知問題は今回の訂正の正当性や図の理解を妨げず、C2 の公開ブロッカーには数えない。D1 で本文訂正・関連記述同期・独立最終レビューが必要なことは維持する。

## 独立確認の結果

候補内の AGENTS.md、harness/writing-rules.md、templates/doc-template.md、publish-review SKILL.md を読み、通常の published 記事改訂の手順を適用した。対象はすべて `git show <tree>:<path>`、原記事は `git show <base>:<path>` で取得した。ROADMAP T-1 の全成果物、章 README、GLOSSARY、manifest、一次資料記録、C2 制作記録、scene review、scene archive index、8記事の現行受入記録、展開状況・引継ぎ、D1 計画と独立計画レビューを照合した。

次を独立に実行し、exit 0 と期待 digest の完全一致を確認した。Git の safe.directory はこのプロセスの環境変数だけで設定し、Git 設定や index を編集していない。

```powershell
$env:GIT_CONFIG_COUNT='1'
$env:GIT_CONFIG_KEY_0='safe.directory'
$env:GIT_CONFIG_VALUE_0='C:/dev/ai-agent-library'
node scripts/harness-policy.mjs --base a9f4364f0a8adcbdaa873a16d012ab7c2a0516a0 --head dcd56bbac7886ece933199a2a4bd2d7cbb0bc5a7 --branch feat/pretraining-reading-diagrams --print-digest
```

元記事へ根拠 JSON の C2-1–C2-6 を各1回適用し、last_updated と該当2資料のアクセス日を同期する独自検算を実施した。結果は候補本文と生バイト相当の文字列比較で完全一致した。追加段落・式・見出し・Mermaid 構造の変更はない。初回検算の日時置換 regex は引用符を扱っていなかったため検算側だけ修正した。製品は変更していない。

| 対象 | 生バイト SHA256 |
| --- | --- |
| pretraining 元記事 | 55c2af5771a48c676eea173ab912429c8c7ba94c3ccd49f27858e6f5c4050deb |
| pretraining 候補本文 | 4385c84ea1a6f0c126ea8477b93f3777b08a5acc8317b90917a3b2ddf83557c2 |
| alignment 元記事・候補共通 | 6bb4501e5fcd44323a0890d20286cc6e597ab042997df47d2cf9fa2ddabd480b |
| scene viewed-images.json | 8924ffd9b5a7afc61768cba01f5fee5220b9a80918f6076551f11bbeb7dc3ef8 |

本文変更は事実の意味を変えるため substantive が適切。両記事の published と ROADMAP T-1 完了を維持する分類も適切。実作業日は2026-09-30 JST、作者による一次資料の実取得日は2026-09-24で、異なる事実の日付として整合する。今回の再確認日で作者の取得記録や他の未再取得資料の日付を上書きしていない。

## 一次資料の独立照合

今回の独立一次資料照合は 2026-09-29T17:21:23Z までに完了した。以下は新しい確認であり、作者の2026-09-24の取得証拠を代替・変更しない。

- [Training Compute-Optimal Large Language Models](https://arxiv.org/html/2203.15556): §3.3 式2・4、§3.4 Table 2、Appendix F。固定予算の N/D 配分と、予算を増やしたときの近い成長率を区別する訂正を支持する。残差の倍率は記事の一変数式から独立に確認し、論文の二変数式の E と記事の L∞ を無条件に同一視していない。
- [Scaling Laws for Neural Language Models](https://arxiv.org/html/2001.08361): §2.1。6ND は演算回数の概算で、通貨・時間・電力との同一視を外す訂正を支持する。Chinchilla Appendix F との埋め込み計数条件の違いも根拠記録に残り、普遍的な実コスト則にはしていない。
- [Let's Verify Step by Step](https://arxiv.org/html/2305.20050v1): §2.4–2.5。未変更記事の A1–A3 を D1 で訂正する必要性の照合に使用した。

## 最終候補と受入境界

C2 5図23段階と記事登録の対応を確認した。訂正に直結する scaling/compute のラベル・注記は、総損失と残差、固定予算と増額、説明用の比と測定最適値、FLOPs と実時間・費用・エネルギーを区別している。係数や最適値は仮造せず、推論時計算の増加による改善も保証していない。

別作者の正式 scene review は `/root/pretraining_visual_review`、2026-09-29T17:00:43.085Z、approved / low、must 0 / should 0。最終 build は RuEOJ2GbDzXcNrG4UDMh4。最終 Edge20/20、以前の WebKit20/20 と loss 変更に対する限定7/7、実視認117枚（初期42・最終C2 58・既存17）を区別している。生成1020枚を全実視認と扱わず、最終 WebKit 全件の再実行とも扱っていない。archive index と画像索引 hash、記録の内訳は整合する。

この doc review では117枚の再視認やブラウザー全再試験を実施していない。別作者の実検証・画像レビュー記録を、その人物・版・範囲に限定して参照した。今回 reviewer 自身の独立確認は本文・一次資料・変更再構成・Git tree/digest・記録とゲートの照合である。

8記事の review/local は scene review に記された現版 inputDigest と一致する。既存7記事の public 記録は別 digest の PR59 固定履歴で、新C2の public は未受入。展開状況と引継ぎは歴史的な7/15公開受入を維持し、C2や現行共有入力版の公開完了を誤表示していない。P1全15記事の現版公開受入後に停止し、P2へ自動着手しない境界とも整合する。

機械チェック215docs・349files/5714links・lint、root check479成功/1skip、site unit360、root C2最終36/36 は作者の実行記録として読み、当 reviewer が再実行した結果とはしていない。型・書式検査の繰返しは本レビューの担当外。実機Safari・読み上げ実機・印刷実視認・GitHub CI・今回版の公開受入を承認した判定ではない。

## 後続操作

root は manifest.review に実 reviewer_run_id / reviewed_at / content_digest / verdict を記録し、その後の実 completed_at を記入して最終 tree の policy を確認する。本文・根拠・対象内容を変えた場合は本判定をそのまま流用せず再レビューする。公開後の同版確認と P1 停止条件は別ゲートとして残る。

製品・記事・Git/index に変更は行っていない。本 MD と対応 JSON の TEMP 出力だけを作成した。
